var gulp  = require('gulp');
var paths = require('../util/paths');
var rename = require('gulp-rename');
var jeditor = require("gulp-json-editor");

gulp.task('reset', function (done) {
    gulp.src(paths.compareConfigFileName)
        .pipe(jeditor(function(json) {
          json.testPairs.forEach(function(item, idx){
            if (item.local_testStatus === 'blessed') {
                item.local_testStatus = 'fail';
            }
          })
          return json;
        }))
        .pipe(rename('compare/config.json'))
        .pipe(gulp.dest('.'))
});
