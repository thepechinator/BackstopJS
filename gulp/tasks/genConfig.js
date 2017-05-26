const gulp = require('gulp');
const rename = require('gulp-rename');
const paths = require('../util/paths');


// GENERATE CAPTURE CONFIG
gulp.task('genConfig', ['genScripts'], () => {
  return gulp.src(paths.captureConfigFileNameDefault)
    .pipe(rename(paths.backstopConfigFileName))
    .pipe(gulp.dest('/'));
});
