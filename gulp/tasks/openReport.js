var gulp  = require('gulp');
var open  = require("gulp-open");
var isWin = require('../util/isWin');
var paths = require('../util/paths');
var rename = require('gulp-rename');
var jeditor = require('gulp-json-editor');

var referenceDir = './bitmaps_reference/';
var testDir = './bitmaps_test/';

var runSequence = require('run-sequence');

var genConfigPath = '../../capture/config.json'
var config = require(genConfigPath);

var maxStoredRuns = config.maxStoredRuns || 5;

var exec = require('child_process').exec;

gulp.task("bitmaps-reference:copy", function() {
  // cache bitmaps_reference files locally
  return gulp.src(paths.bitmaps_reference + '/**/*')
    .pipe(gulp.dest(referenceDir));
});

gulp.task("bitmaps-test:remove-old-runs", function(cb) {
  var myProcess = exec('rm -rf `ls -1dt * | tail -n +' + (maxStoredRuns+1) + '`',
    {cwd: paths.bitmaps_test}, function(err, stdout, stderr) {
      if (err) {
        console.error(err);

        cb();
      }

      cb();
    }
  );

  myProcess.stdout.on('data', (data) => {
    // don't use console.log, otherwise you'll get a bunch
    // of excess newslines per data piece coming in
    process.stdout.write(data);
  });

  myProcess.stderr.on('data', (data) => {
    console.error(data);
  });
});

gulp.task("bitmaps-test:copy", ["bitmaps-test:remove-old-runs"], function() {
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

  console.info('compareConfigFileName', paths.compareConfigFileName);
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
    .pipe(open("", options));
});

gulp.task("openReport", function(cb) {
  runSequence("bitmaps-reference:copy", "bitmaps-test:copy", "openReport:do", cb);
});
