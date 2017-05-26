const gulp = require('gulp');
const open = require('gulp-open');
const isWin = require('../util/isWin');
const paths = require('../util/paths');
const rename = require('gulp-rename');
const jeditor = require('gulp-json-editor');

const referenceDir = './bitmaps_reference/';
const testDir = './bitmaps_test/';

const runSequence = require('run-sequence');

const genConfigPath = '../../capture/config.json';
const config = require(genConfigPath);

const maxStoredRuns = config.maxStoredRuns || 5;

const exec = require('child_process').exec;

gulp.task('bitmaps-reference:copy', () => {
  // cache bitmaps_reference files locally
  return gulp.src(`${paths.bitmaps_reference}/**/*`)
    .pipe(gulp.dest(referenceDir));
});

gulp.task('bitmaps-test:remove-old-runs', (cb) => {
  const myProcess = exec(`rm -rf \`ls -1dt * | tail -n +${maxStoredRuns + 1}\``,
    { cwd: paths.bitmaps_test }, (err, stdout, stderr) => {
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

gulp.task('bitmaps-test:copy', ['bitmaps-test:remove-old-runs'], () => {
  return gulp.src(`${paths.bitmaps_test}/**/*`)
    .pipe(gulp.dest(testDir));
});

gulp.task('openReport:do', () => {
  console.log('\nTesting with ', paths.compareConfigFileName);
  console.log('Opening report -> ', `${paths.compareReportURL}\n`);

  const options = {
    url: paths.compareReportURL,
    app: isWin ? 'chrome' : 'Google Chrome',
  };

  console.info('compareConfigFileName', paths.compareConfigFileName);
  return gulp.src(paths.compareConfigFileName)
    .pipe(jeditor((json) => {
      json.testPairs.forEach((item) => {
        const rFile = referenceDir + item.reference.split('/').slice(-1)[0];
        const tFile = testDir + item.test.split('/').slice(-2).join('/');
        item.local_reference = rFile;
        item.local_test = tFile;
      });
      return json;
    }))
    .pipe(rename('compare/config.json'))
    .pipe(gulp.dest('.'))
    .pipe(open('', options));
});

gulp.task('openReport', (cb) => {
  runSequence('bitmaps-reference:copy', 'bitmaps-test:copy', 'openReport:do', cb);
});
