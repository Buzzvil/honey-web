var aws = require("aws-sdk");
var concat = require("gulp-concat");
var del = require("del");
var express = require("express");
var fs = require("fs");
var gulp = require("gulp");
var gzip = require("gulp-gzip");
var hashsum = require("gulp-hashsum");
var hl = require("highland");
var imagemin = require("gulp-imagemin");
var jade = require("gulp-jade");
var less = require("gulp-less");
var marked = require("marked");
var uglify = require("gulp-uglify");

del.sync("dist");

aws.config.update({
    region: "ap-northeast-1"
});

var IMAGES = "/i-v2/";

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
        var md = fs.readdirSync("l10n");
        
        l10nObj[key] = JSON.parse(json);
        l10nObj[key].meta.key = key;

        md.filter(function (name) {
            return name.startsWith(key) && name.endsWith(".md");
        }).forEach(function (name) {
            l10nObj[key][name] = marked(fs.readFileSync("l10n/" + name, "utf8"));
        });
    });
});

gulp.task("styles", ["i18n"], l10nify(function (l10n) {
    var opts = {
        compress: true,
        globalVars: l10nObj[l10n].style
    };
    
    opts.globalVars.f = JSON.stringify("../file/_/");
    opts.globalVars.i = JSON.stringify(IMAGES + "_/");
    opts.globalVars.I = JSON.stringify(IMAGES + l10n + "/");
    
    return gulp.src("page/*.less")
        .pipe(less(opts))
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("scripts", ["i18n"], l10nify(function (l10n) {
    var global = gulp.src([
        "node_modules/jquery/dist/jquery.min.js",
        "node_modules/jquery-keystop/jquery.keystop.min.js",
        "node_modules/bootstrap/js/transition.js",
        "node_modules/bootstrap/js/collapse.js",
        "node_modules/bootstrap/js/carousel.js",
        "page/global.js"
    ]).pipe(concat("global.js"));
    
    var legacy = gulp.src([
        "page/legacy/shiv.js",
        "page/legacy/respond.js"
    ]).pipe(concat("legacy.js"));
    
    return hl([global, legacy])
        .merge()
        .pipe(uglify())
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("pages", ["i18n"], l10nify(function (l10n) {
    var opts = {
        locals: l10nObj[l10n]
    };
    
    opts.locals.i = IMAGES + "_/";
    opts.locals.I = IMAGES +  l10n + "/";
    opts.locals.gakey = process.env.GANALYTICS_KEY;
    
    return gulp.src(["page/!(global).jade", "l10n/" + l10n + ".*.jade"])
        .pipe(jade(opts))
        .pipe(hl())
        .doto(function (file) {
            var name = file.relative.split(".");
            
            if (name.length === 2) {
                file.path = file.base + name[0];
            } else if (name.length === 3) {
                file.path = file.base + "event/" + name[1];
            }
        })
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("upload", ["styles", "scripts", "pages"], l10nify(function (l10n) {
    var type = {
        "": "text/html; charset=UTF-8",
        ".css": "text/css",
        ".js": "application/javascript"
    };
    
    return gulp.src("dist/" + l10n + "/**/*")
        .pipe(gzip({ append: false }))
        .pipe(hl())
        .flatMap(function (file) {
            return putObject({
                Bucket: l10nObj[l10n].meta.bucket,
                Key: file.relative,
                Body: file.contents,
                CacheControl: "public, max-age=7200",
                ContentEncoding: "gzip",
                ContentLanguage: l10nObj[l10n].meta.code,
                ContentType: type[(file.relative.match(/\.[^.]+/) || [""])[0]]
            });
        });
}));

gulp.task("files", function () {
    del.sync("file/**/.DS_Store");
    
    return gulp.src("file/*/**")
        .pipe(imagemin())
        .pipe(gulp.dest("file"))
        .pipe(hashsum({ dest: "file", filename: "index.txt" }));
});

gulp.task("watch", ["styles", "scripts", "pages"], function () {
    gulp.watch("l10n/*.*", ["styles", "pages"]);
    gulp.watch("page/*.less", ["styles"]);
    gulp.watch("page/*.js", ["scripts"]);
    gulp.watch("page/*.jade", ["pages"]);
    
    express()
        .use(express.static("dist/" + process.env.L10N, {
            index: "index",
            setHeaders: function (res, path) {
                if (!/\./.test(path)) {
                    res.type("html");
                }
            }
        }))
        .use(IMAGES, express.static("file"))
        .listen(9100);
});
