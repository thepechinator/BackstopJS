var gulp  = require('gulp');
var open  = require("gulp-open");
var rename = require('gulp-rename');
var jeditor = require("gulp-json-editor");

var resemble = require('node-resemble-js');
var paths = require('./paths');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');


var failsStorage = [];
var compareConfig = JSON.parse(fs.readFileSync(paths.compareConfigFileName, 'utf8'));

// FORK: This is what compare.js uses.
var resembleTestConfig = {
  errorColor: {red: 244, green: 67, blue: 54},
  errorType: 'movement',
  transparency: 0.1,
  largeImageThreshold: 1200
};
resemble.outputSettings(resembleTestConfig);

function test(testPairs) {
  var numberOfTests = testPairs.length;
  var passed = 0;
  var failed = 0;
  var startDiffStore = false;

  // The main code execution
  // The testPairs can't be mutated here...
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
        pair.testStatus = "fail";
        failed++;
        console.log('ERROR:', pair.label, pair.fileName);
        console.info("pair: ", pair); //wf
      } else {
        pair.testStatus = "pass";
        passed++;
        console.log('OK:', pair.label, pair.fileName);
      }

      storeDiffImage(pair, testPath, data, pair.fileName, pair.testStatus);

      numberOfTests--;
      checkQueue();
    });
  }

  function checkQueue() {
    if (numberOfTests === 0 && !startDiffStore) {
      console.log('COMPARE : ALL DONE FOR THIS PROCESS, sending message');
      process.send({ testPairs, passed, failed, failFiles: failsStorage });

      if (failed > 0) {
        process.exit(1);
      } else {
        process.exit();
      }
    }
  }

  function storeDiffImage(pair, testPath, data, testFile, status) {
    startDiffStore = true;
    var diffFilename = getDiffFilename(testPath, status);
    pair.diff = diffFilename;

    // hack this in until we find a good place to put it, to complete the merge.
    var rFile = './bitmaps_reference/' + pair.reference.split('/').slice(-1)[0];
    var tFile = './bitmaps_test/' + pair.test.split('/').slice(-2).join('/');
    pair.local_reference = rFile;
    pair.local_test = tFile;
    pair.local_diff = diffFilename.partial;
    pair.local_testStatus = pair.testStatus;

    console.log('Storing diff image in ', diffFilename.full);

    if (status === 'fail') {
      failsStorage.push(diffFilename.baseName);
      let failedDiffStream = fs.createWriteStream(diffFilename.full);
      failedDiffStream.on('close', function() {
        console.log('file done');
        startDiffStore = false;
        checkQueue();
      });
      data.getDiffImage().pack().pipe(failedDiffStream);
    } else if (status === 'pass') {
      var passedDiffStream = fs.createWriteStream(diffFilename);
      passedDiffStream.on('close', function() {
        console.log('file done');
        startDiffStore = false;
        checkQueue();
      });
      data.getDiffImage().pack().pipe(passedDiffStream);
    }
  }

  function getDiffFilename(testPath, status) {
    var prefix = status === 'fail' ? 'failed_diff_' : 'passed_diff_';
    var lastSlash = testPath.lastIndexOf('/');

    let partial = '.' + testPath.split('test/css')[1];
    const splitPartial = partial.split('mocks_pages_');
    const baseName = 'mocks_pages_' + splitPartial[1];
    partial = splitPartial[0] + prefix + baseName;
    console.info("testPath: ", testPath); //wf
    return {
      full: testPath.slice(0, lastSlash + 1) + prefix + testPath.slice(lastSlash + 1, testPath.length),
      partial,
      baseName,
    }
  }

}

process.on('message', function(data) {
  // do something
  test(data.testPairs);

  // send results back to parent process
  // process.send();
});
