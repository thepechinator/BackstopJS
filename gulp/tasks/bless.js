const gulp = require('gulp');
const paths = require('../util/paths');
const rename = require('gulp-rename');


// BLESS THE CURRENT CAPTURE CONFIG
gulp.task('bless', () => {
  return gulp.src(paths.activeCaptureConfigPath)
    .pipe(rename(paths.captureConfigFileNameCache))
    .pipe(gulp.dest('/'));
});
