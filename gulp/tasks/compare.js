'use strict';

let gulp = require('gulp');
let resemble = require('node-resemble-js');
let paths = require('../util/paths');
let fs = require('fs');
let path = require('path');
let _ = require('underscore');
let childProcess = require('child_process');
let os = require('os');
var jsonfile = require('jsonfile')

var genConfigPath = '../../capture/config.json'
var config = require(genConfigPath);
// var config = JSON.parse(configJSON);

gulp.task('compare', function (done) {
  let compareConfig = JSON.parse(fs.readFileSync(paths.compareConfigFileName, 'utf8'));
  let testPairs = compareConfig.testPairs;

  // Set this based on a person's OS. We do one less than the amount of cores
  // because some people claim that it performs better since one core is needed
  // to handle runoff or something like that.
  let maxProcessesDefault = os.cpus().length-1;

  if (config.maxProcesses) {
    maxProcessesDefault = config.maxProcesses;
  }

  // Figure out how many casper processes to spawn
  if (testPairs.length <= maxProcessesDefault) {
    // This means we need to set a cap
    maxProcessesDefault = testPairs.length;
  }
  var maxProcesses = maxProcessesDefault;

  var itemsPerArray = Math.floor(testPairs.length/maxProcesses);
  var currentIndex = 0;
  var i = 0;

  var workerResults = [];

  // Result parameters
  let failed = 0;
  let passed = 0;
  let failFiles = [];
  let testPairsToSave = [];

  console.log(`Running on ${maxProcesses} separate processes`);

  for (i = 0; i < maxProcesses; i++) {
    if ( (i+1) === maxProcesses ) {
       // on the last index... so get the modulo to get the number of items
       // extra we need to account for
       let extra = testPairs.length % maxProcesses;

       forkWorker(testPairs.slice(currentIndex, currentIndex+itemsPerArray+extra));
    } else {
      forkWorker(testPairs.slice(currentIndex, currentIndex+itemsPerArray));
    }

    currentIndex += itemsPerArray;
  }

  function forkWorker(testPairs) {
    var child = childProcess.fork(path.join(__dirname, '../util/compare'));
    child.on('message', function(results) {
      workerResults.push(results);
    });

    child.on('close', function(code) {
      maxProcesses--;

      if (maxProcesses === 0) {
        // Gather the results
        for (let result of workerResults) {
          passed += result.passed;
          failed += result.failed;
          failFiles.push(result.failFiles);
          testPairsToSave.push(result.testPairs);
        }
        console.info("failFiles: ", _.flatten(failFiles)); //wf
        console.log((passed || 0) + " Passed");
        console.log((failed || 0) + " Failed\n");

        const failsFile = paths.comparePath + '/fails.json';
        const failsObj = {fails: _.flatten(failFiles)};
        testPairsToSave = _.flatten(testPairsToSave);

        // Here we can somehow tap into the testpairs.
        jsonfile.writeFileSync(failsFile, failsObj, {spaces: 2});
        jsonfile.writeFileSync(paths.compareConfigFileName, { testPairs: testPairsToSave }, { spaces: 2 });

        if (failed > 0) {
          console.log("*** Mismatch errors found ***");
          console.log("For a detailed report run `gulp openReport`\n");
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