var http = require("http");
var fs = require("fs");
var rl = require("readline");
var exec = require("child_process").exec;
var downloadBase = "http://en.honeyscreen.com/i-v2/";
var outputBase = "./file/";

var perLine = function(file, lineFn) {
    var lineReader = rl.createInterface({
        input: require("fs").createReadStream(file)
    });
    lineReader.on("line", lineFn);
};

perLine("file/index.txt", function(line) {
    var filepath = line.split("  ")[1];
    var outputDir = filepath.split("/");
    outputDir = outputBase + outputDir.slice(0, outputDir.length - 1).join("/");
    exec("mkdir -p " + outputDir, function(err) {
        if (err) {
            throw err;
        }
        var file = fs.createWriteStream(outputBase + filepath);
        var request = http.get(downloadBase + filepath, function(response) {
            response.pipe(file);
        });
    });
});
