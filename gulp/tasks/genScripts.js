const gulp = require('gulp');
const rename = require('gulp-rename');
const paths = require('../util/paths');

gulp.task('genScripts', () => {
  if (paths.casper_scripts) {
    return gulp.src([`${paths.casper_scripts_default}/*.js`])
        .pipe(gulp.dest(paths.casper_scripts));
  }
  console.log("ERROR: Can't generate a scripts directory. No 'casper_scripts' path property was found in backstop.json.");
});
