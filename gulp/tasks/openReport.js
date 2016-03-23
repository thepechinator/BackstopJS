var gulp  = require('gulp');
var open  = require("gulp-open");
var isWin = require('../util/isWin');
var paths = require('../util/paths');
//var rename = require('gulp-rename');
//var jeditor = require("gulp-json-editor");

var referenceDir = './bitmaps_reference/';
var testDir = './bitmaps_test/';

gulp.task("openReport", function(){

  console.log('\nTesting with ',paths.compareConfigFileName);
  console.log('Opening report -> ',paths.compareReportURL + '\n');

  var options = {
    url: paths.compareReportURL
    ,app: isWin ? "chrome" : "Google Chrome"
  };

  // cache bitmaps_reference files locally
  gulp.src(paths.bitmaps_reference + '/**/*')
    .pipe(gulp.dest(referenceDir));

  // cache bitmaps_test files locally
  gulp.src(paths.bitmaps_test + '/**/*')
    .pipe(gulp.dest(testDir));

  gulp.src(paths.compareConfigFileName)
    .pipe(open("",options));

});
