var aws = require("aws-sdk");
var crypto = require("crypto");
var del = require("del");
var express = require("express");
var fs = require("fs");
var gulp = require("gulp");
var hl = require("highland");
var jade = require("gulp-jade");
var less = require("gulp-less");
var path = require("path");
var zlib = require("zlib");

var l10nObj = {};
var fileObj = {};

var l10nAll = function (next) {
    hl(Object.keys(l10nObj))
        .map(this)
        .merge()
        .once("end", next)
        .stopOnError(next)
        .resume();
};

gulp.task("clean", function (next) {
    del("dist", next);
});

gulp.task("i18n", function () {
    (process.env.L10N || "en,ja,ko,zh-tw").split(",").forEach(function (key) {
        l10nObj[key] = JSON.parse(fs.readFileSync("l10n/" + key + ".json", "utf8"));
    });
});

gulp.task("styles", ["clean", "i18n"], l10nAll.bind(function (l10n) {
    var opts = {
        compress: true,
        globalVars: {
            l10n: l10n
        }
    };
    
    return gulp.src("page/*.less")
        .pipe(less(opts))
        .pipe(hl())
        .doto(function (file) {
            var type = path.extname(file.path);
            var name = path.basename(file.path, type);
            var hash = crypto
                .createHash("md5")
                .update(file.contents)
                .digest("hex")
                .slice(0, 12);
            
            file.path = path.dirname(file.path) + "/" + name + "-" + hash + type;
            fileObj[name + type.slice(1)] = "/" + file.relative;
        })
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("pages", ["clean", "i18n"], l10nAll.bind(function (l10n) {
    var opts = {};
    
    opts.locals = l10nObj[l10n];
    opts.locals.files = fileObj;
    opts.locals.gakey = process.env.GANALYTICS_KEY;
    
    return gulp.src("page/!(global).jade")
        .pipe(jade(opts))
        .pipe(hl())
        .doto(function (file) {
            file.path = file.path.slice(0, -5);
        })
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("upload", ["styles", "pages"], l10nAll.bind(function (l10n) {
    
}));

gulp.task("watch", function () {
    gulp.watch(["page/*.less"], ["styles"]);
    gulp.watch(["page/*.jade", "l10n/*.json"], ["pages"]);
});

gulp.task("default", ["styles", "pages"]);