const gulp = require('gulp');
const paths = require('../util/paths');
const rename = require('gulp-rename');
const jeditor = require('gulp-json-editor');

gulp.task('reset', (done) => {
  gulp.src(paths.compareConfigFileName)
        .pipe(jeditor((json) => {
          json.testPairs.forEach((item, idx) => {
            if (item.local_testStatus === 'blessed') {
              item.local_testStatus = 'fail';
            }
          });
          return json;
        }))
        .pipe(rename('compare/config.json'))
        .pipe(gulp.dest('.'));
});
