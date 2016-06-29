var resemble = require('node-resemble-js');
var paths = require('./paths');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var compareConfig = JSON.parse(fs.readFileSync(paths.compareConfigFileName, 'utf8'));

// FORK: This is what compare.js uses.
var resembleTestConfig = {
  errorColor: {red: 255, green: 0, blue: 255},
  errorType: 'movement',
  transparency: 0.1,
  largeImageThreshold: 1200
};
resemble.outputSettings(resembleTestConfig);

function test(testPairs) {
  var numberOfTests = testPairs.length;

  var passed = 0;
  var failed = 0;

  // The main code execution
  _.each(testPairs, function (pair) {
    pair.testStatus = "running";

    // need the pair, referencePath, and testPath...
    // pass those in, set testStatus on the outside

    // For updating the pair properties, pass those back in your
    // message

    var referencePath = path.join(paths.backstop, pair.reference);
    var testPath = path.join(paths.backstop, pair.test);

    compareImages(referencePath, testPath, pair);
  });

  function compareImages(referencePath, testPath, pair) {
    resemble(referencePath).compareTo(testPath).onComplete(function (data) {
      // FORK: Set a default
      if (typeof pair.misMatchThreshold === 'undefined') {
        pair.misMatchThreshold = 1;
      }

      var imageComparisonFailed = !data.isSameDimensions ||
        (data.misMatchPercentage > pair.misMatchThreshold);

      var testStatus = '';
      if (imageComparisonFailed) {
        // testStatus = "fail";
        failed++;
        console.log('ERROR:', pair.label, pair.fileName);
        storeFailedDiffImage(testPath, data);
      } else {
        // testStatus = "pass";
        passed++;
        console.log('OK:', pair.label, pair.fileName);
      }

      numberOfTests--;
      checkQueue();
    });
  }

  function checkQueue() {
    if (numberOfTests === 0) {
      console.log('ALL DONE FOR THIS PROCESS, sending message');
      process.send({ passed: passed, failed: failed });

      if (failed > 0) {
        process.exit(1);
      } else {
        process.exit();
      }
    }
  }
}

function storeFailedDiffImage(testPath, data) {
  var failedDiffFilename = getFailedDiffFilename(testPath);
  console.log('Storing diff image in ', failedDiffFilename);
  var failedDiffStream = fs.createWriteStream(failedDiffFilename);
  data.getDiffImage().pack().pipe(failedDiffStream)
}

function getFailedDiffFilename(testPath) {
  var lastSlash = testPath.lastIndexOf('/');
  return testPath.slice(0, lastSlash + 1) + 'failed_diff_' + testPath.slice(lastSlash + 1, testPath.length);
}

process.on('message', function(data) {
  // do something
  test(data.testPairs);

  // send results back to parent process
  // process.send();
});
