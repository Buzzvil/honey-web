var aws = require("aws-sdk");
var fs = require("fs");
var gulp = require("gulp");
var hl = require("highland");
var jade = require("gulp-jade");
var less = require("gulp-less");

var l10nObj = {};

var l10nAll = function () {
    return hl(Object.keys(l10nObj)).each(this);
};

gulp.task("i18n", function () {
    (process.env.L10N || "en,ja,ko,zh-tw").split(",").forEach(function (key) {
        l10nObj[key] = JSON.parse(fs.readFileSync("l10n/" + key + ".json", "utf8"));
    });
});

gulp.task("styles", ["i18n"], l10nAll.bind(function (l10n) {
    var opts = {
        compress: true,
        globalVars: {
            l10n: l10n
        }
    };
    
    return gulp.src("page/*.less")
        .pipe(less(opts))
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("pages", ["i18n"], l10nAll.bind(function (l10n) {
    var opts = {
        locals: l10nObj[l10n]
    };
    
    return gulp.src("page/!(global).jade")
        .pipe(jade(opts))
        .pipe(gulp.dest("dist/" + l10n));
}));

gulp.task("upload", ["default"], l10nAll.bind(function (l10n) {
    
}));

gulp.task("watch", function () {
    gulp.watch(["page/*.less"], ["styles"]);
    gulp.watch(["page/*.jade", "l10n/*.json"], ["pages"]);
});

gulp.task("default", ["styles", "pages"]);