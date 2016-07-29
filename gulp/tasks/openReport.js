var gulp  = require('gulp');
var open  = require("gulp-open");
var isWin = require('../util/isWin');
var paths = require('../util/paths');
var rename = require('gulp-rename');
var jeditor = require("gulp-json-editor");

var referenceDir = './bitmaps_reference/';
var testDir = './bitmaps_test/';

var runSequence = require('run-sequence');

gulp.task("bitmaps-reference", function() {
  // cache bitmaps_reference files locally
  return gulp.src(paths.bitmaps_reference + '/**/*')
    .pipe(gulp.dest(referenceDir));
});

gulp.task("bitmaps-test", function() {
  return gulp.src(paths.bitmaps_test + '/**/*')
    .pipe(gulp.dest(testDir));
});

gulp.task("openReport:do", function() {
  console.log('\nTesting with ',paths.compareConfigFileName);
  console.log('Opening report -> ',paths.compareReportURL + '\n');

  var options = {
    url: paths.compareReportURL
    ,app: isWin ? "chrome" : "Google Chrome"
  };

  return gulp.src(paths.compareConfigFileName)
    .pipe(jeditor(function(json) {
      json.testPairs.forEach(function(item){
        var rFile = referenceDir + item.reference.split('/').slice(-1)[0];
        var tFile = testDir + item.test.split('/').slice(-2).join('/');
        item.local_reference = rFile;
        item.local_test = tFile;
      })
      return json;
    }))
    .pipe(rename('compare/config.json'))
    .pipe(gulp.dest('.'))
    .pipe(open("",options));
});

gulp.task("openReport", function(cb) {
  runSequence("bitmaps-reference", "bitmaps-test", "openReport:do", cb);
});
