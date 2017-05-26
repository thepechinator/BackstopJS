const gulp = require('gulp');
const fs = require('fs');
const exec = require('child_process').exec;
const paths = require('../util/paths');


gulp.task('stop', () => {
  fs.readFile(paths.serverPidFile, (err, pid) => {
    if (pid) {
      exec(`kill ${pid}`, (error, stdout, stderr) => {
        console.log(`Stopped PID:${pid}`);
        fs.unlinkSync(paths.serverPidFile);
      });
    }
  });
});
