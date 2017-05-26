const gulp = require('gulp');
const spawn = require('child_process').spawn;


gulp.task('echo', () => {
  const genReferenceMode = false;

  const tests = ['capture/echoFiles.js'];

  const args = ['--ssl-protocol=any'];// added for https compatibility for older versions of phantom

  const casperArgs = tests.concat(args);

  // var args = ['test'].concat(tests); //this is required if using casperjs test option

  const casperProcess = (process.platform === 'win32' ? 'casperjs.cmd' : 'casperjs');
  const casperChild = spawn(casperProcess, casperArgs); // use args here to add test option to casperjs execute stmt

  casperChild.stdout.on('data', (data) => {
    console.log('CasperJS:', data.toString().slice(0, -1)); // Remove \n
  });


  casperChild.on('close', (code) => {
    const success = code === 0; // Will be 1 in the event of failure
    const result = (success) ? 'Echo files completed.' : `Echo files failed with code: ${code}`;

    console.log(`\n${result}`);

    // exit if there was some kind of failure in the casperChild process
    if (code != 0) return false;
  });
});
