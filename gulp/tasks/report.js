var gulp = require('gulp');
var paths = require('../util/paths');
// FORK: using run-sequence
var runSequence = require('run-sequence');

// FORK: removing 'start' as a task that must happen before
// 'report' because the user may not have the browser reporter
// enabled, which makes 'start' pointless for the CLI reporter.
gulp.task('report',function(cb){
  // FORK: using run-sequence
  var tasks = [];

  if (!paths.report || paths.report.indexOf( 'browser' ) > -1 ){
    tasks.push('start');
    tasks.push('openReport');
  }

  if (!paths.report || paths.report.indexOf( 'CLI' ) > -1 ){
    tasks.push('compare');
  }

  setTimeout(function() {
    runSequence.apply(undefined, [tasks, cb]);
  }, 1000);
});
