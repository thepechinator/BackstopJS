const gulp = require('gulp');
const paths = require('../util/paths');
// FORK: using run-sequence
const runSequence = require('run-sequence');

// FORK: removing 'start' as a task that must happen before
// 'report' because the user may not have the browser reporter
// enabled, which makes 'start' pointless for the CLI reporter.
gulp.task('report', (cb) => {
  // FORK: using run-sequence
  const tasks = [];

  if (!paths.report || paths.report.indexOf('browser') > -1) {
    tasks.push('start');
    tasks.push('openReport');
  }

  if (!paths.report || paths.report.indexOf('CLI') > -1) {
    tasks.push('compare');
  }

  setTimeout(() => {
    runSequence.apply(undefined, [tasks, cb]);
  }, 1000);
});
