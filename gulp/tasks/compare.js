

const gulp = require('gulp');
const resemble = require('node-resemble-js');
const paths = require('../util/paths');
const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const childProcess = require('child_process');
const os = require('os');
const jsonfile = require('jsonfile');

const genConfigPath = '../../capture/config.json';
const config = require(genConfigPath);
// var config = JSON.parse(configJSON);

gulp.task('compare', (done) => {
  const compareConfig = JSON.parse(fs.readFileSync(paths.compareConfigFileName, 'utf8'));
  const testPairs = compareConfig.testPairs;

  // Set this based on a person's OS. We do one less than the amount of cores
  // because some people claim that it performs better since one core is needed
  // to handle runoff or something like that.
  let maxProcessesDefault = os.cpus().length - 1;

  if (config.maxProcesses) {
    maxProcessesDefault = config.maxProcesses;
  }

  // Figure out how many casper processes to spawn
  if (testPairs.length <= maxProcessesDefault) {
    // This means we need to set a cap
    maxProcessesDefault = testPairs.length;
  }
  let maxProcesses = maxProcessesDefault;

  const itemsPerArray = Math.floor(testPairs.length / maxProcesses);
  let currentIndex = 0;
  let i = 0;

  const workerResults = [];

  // Result parameters
  let failed = 0;
  let passed = 0;
  const failFiles = [];
  let testPairsToSave = [];

  console.log(`Running on ${maxProcesses} separate processes`);

  for (i = 0; i < maxProcesses; i++) {
    if ((i + 1) === maxProcesses) {
       // on the last index... so get the modulo to get the number of items
       // extra we need to account for
      const extra = testPairs.length % maxProcesses;

      forkWorker(testPairs.slice(currentIndex, currentIndex + itemsPerArray + extra));
    } else {
      forkWorker(testPairs.slice(currentIndex, currentIndex + itemsPerArray));
    }

    currentIndex += itemsPerArray;
  }

  function forkWorker(testPairs) {
    const child = childProcess.fork(path.join(__dirname, '../util/compare'));
    child.on('message', (result) => {
      workerResults.push(result);

      if (result.shouldExit) {
        // can pass a signal:
        // http://man7.org/linux/man-pages/man7/signal.7.html
        // https://nodejs.org/api/child_process.html#child_process_child_kill_signal
        child.kill();
      }
    });

    child.on('close', (code) => {
      maxProcesses--;

      if (maxProcesses === 0) {
        // Gather the results
        for (const result of workerResults) {
          passed += result.passed;
          failed += result.failed;

          failFiles.push(result.failFiles);

          testPairsToSave.push(result.testPairs);
        }
        console.info('failFiles: ', _.flatten(failFiles)); // wf
        console.log(`${passed || 0} Passed`);
        console.log(`${failed || 0} Failed\n`);

        const failsFile = `${paths.comparePath}/fails.json`;
        const failsObj = { fails: _.flatten(failFiles) };
        testPairsToSave = _.flatten(testPairsToSave);

        // Here we can somehow tap into the testpairs.
        jsonfile.writeFileSync(failsFile, failsObj, { spaces: 2 });
        jsonfile.writeFileSync(paths.compareConfigFileName, { testPairs: testPairsToSave }, { spaces: 2 });

        if (failed > 0) {
          console.log('*** Mismatch errors found ***');
          console.log('For a detailed report run `gulp openReport`\n');
          if (paths.cliExitOnFail) {
            done(new Error('Mismatch errors found.'));
          }
        } else {
          done();
        }
      }
    });

    child.send({ testPairs });
  }
});
