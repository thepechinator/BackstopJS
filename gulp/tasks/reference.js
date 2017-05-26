const gulp = require('gulp');


// FIRST CLEAN REFERENCE DIR.  THEN TEST
gulp.task('reference', ['clean', 'bless'], () => {
  gulp.run('test');
  console.log('reference has run.');
});
