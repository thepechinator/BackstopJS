const gulp = require('gulp');
const del = require('del');
const paths = require('../util/paths');
const genDefaultCompareConfig = require('../util/genDefaultCompareConfig');


// CLEAN THE bitmaps_reference DIRECTORY
gulp.task('clean', (cb) => {
  del([
    `${paths.bitmaps_reference}/**`,
  ], { force: true }, cb);
  genDefaultCompareConfig();
  console.log('bitmaps_reference was cleaned.');
});
