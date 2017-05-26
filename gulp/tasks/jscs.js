const gulp = require('gulp');
var jscs = require('gulp-jscs');
const jshint = require('gulp-jshint');
const stylish = require('gulp-jscs-stylish');

var jscs = require('gulp-jscs');

gulp.task('jscs', () => {
  gulp.src(['./{,*/}*.js'])
        .pipe(jshint())
        .pipe(jscs())
        .pipe(stylish.combineWithHintResults())
        .pipe(jshint.reporter('jshint-stylish'));
});
