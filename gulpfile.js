var aws = require("aws-sdk");
var concat = require("gulp-concat");
var del = require("del");
var express = require("express");
var fs = require("fs");
var gulp = require("gulp");
var gzip = require("gulp-gzip");
var hl = require("highland");
var jade = require("gulp-jade");
var less = require("gulp-less");
var marked = require("marked");
var uglify = require("gulp-uglify");

del.sync("dist");

aws.config.update({
    region: "ap-northeast-1"
});

var putObject = hl.wrapCallback(new aws.S3().putObject.bind(new aws.S3()));

var l10nObj = {};
var l10nify = function (iter) {
    return function (next) {
        hl(Object.keys(l10nObj))
            .map(iter)
            .map(function (val) {
                return hl(val).errors(hl.log);
            })
            .merge()
            .once("end", next)
            .resume();
    };
};

gulp.task("i18n", function () {
    (process.env.L10N || "en,ja,ko,zh-tw").split(",").forEach(function (key) {
        var json = fs.readFileSync("l10n/" + key + ".json", "utf8");
        var terms = fs.readFileSync("l10n/" + key + ".terms.md", "utf8");
        var privacy = fs.readFileSync("l10n/" + key + ".privacy.md", "utf8");
        
        l10nObj[key] = JSON.parse(json);
        l10nObj[key].terms.html = marked(terms);
        l10nObj[key].privacy.html = marked(privacy);
    });
});

gulp.task("styles", ["i18n"], l10nify(function (l10n) {
    var opts = {
        compress: true,
        globalVars: l10nObj[l10n].style
    };
    
    opts.globalVars.i = JSON.stringify("/i/");
    opts.globalVars.I = JSON.stringify("/i/" + l10n + "/");
    
    return gulp.src("page/*.less")
        .pipe(less(opts))
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("scripts", ["i18n"], l10nify(function (l10n) {
    var files = [
        "node_modules/jquery/dist/jquery.min.js",
        "node_modules/bootstrap/js/transition.js",
        "node_modules/bootstrap/js/collapse.js",
        "page/global.js"
    ];
    
    return gulp.src(files)
        .pipe(concat("global.js"))
        .pipe(uglify())
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("pages", ["i18n"], l10nify(function (l10n) {
    var opts = {
        locals: l10nObj[l10n]
    };
    
    opts.locals.i = "/i/";
    opts.locals.I = "/i/" + l10n + "/";
    opts.locals.gakey = process.env.GANALYTICS_KEY;
    
    return gulp.src("page/!(global).jade")
        .pipe(jade(opts))
        .pipe(hl())
        .doto(function (file) {
            file.path = file.path.slice(0, -5);
        })
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("upload", ["styles", "scripts", "pages"], l10nify(function (l10n) {
    var type = {
        "": "text/html; charset=UTF-8",
        ".css": "text/css",
        ".js": "application/javascript"
    };
    
    return gulp.src("dist/" + l10n + "/*")
        .pipe(gzip({ append: false }))
        .pipe(hl())
        .flatMap(function (file) {
            return putObject({
                Bucket: l10nObj[l10n].meta.bucket,
                Key: file.relative,
                Body: file.contents,
                CacheControl: "public, max-age=900",
                ContentEncoding: "gzip",
                ContentLanguage: l10nObj[l10n].meta.code,
                ContentType: type[(file.relative.match(/\.[^.]+/) || [""])[0]]
            });
        });
}));

gulp.task("watch", ["styles", "scripts", "pages"], function () {
    gulp.watch("l10n/*.*", ["styles", "pages"]);
    gulp.watch("page/*.less", ["styles"]);
    gulp.watch("page/*.js", ["scripts"]);
    gulp.watch("page/*.jade", ["pages"]);
    
    express()
        .use(express.static("dist/" + process.env.L10N, {
            index: "index",
            setHeaders: function (res, file) {
                if (!/\./.test(file)) {
                    res.type("html");
                }
            }
        }))
        .use("/i", express.static("../honeyscreen-website-media"))
        .listen(9100);
});