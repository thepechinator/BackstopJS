var gulp = require('gulp');
var resemble = require('node-resemble-js');
var paths = require('../util/paths');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var rename = require('gulp-rename');
var jeditor = require("gulp-json-editor");

// TODO This needs to move after we understand ln 56
var referenceDir = './bitmaps_reference/';
var testDir = './bitmaps_test/';

gulp.task('compare', function (done) {
  var compareConfig = JSON.parse(fs.readFileSync(paths.compareConfigFileName, 'utf8'));

  // FORK: This is what compare.js uses.
  var resembleTestConfig = {
    errorColor: {red: 244, green: 67, blue: 54},
    errorType: 'movement',
    transparency: 0.1,
    largeImageThreshold: 1200
  };
  resemble.outputSettings(resembleTestConfig);

  function updateProgress() {
    var results = {};
    _.each(compareConfig.testPairs, function (pair) {
      if (!results[pair.testStatus]) {
        results[pair.testStatus] = 0;
      }
      !results[pair.testStatus]++;
    });
    if (!results.running) {
      console.log ("\nTest completed...");
      console.log ((results.pass || 0) + " Passed");
      console.log ((results.fail || 0) + " Failed\n");

      if (results.fail) {
        console.log ("*** Mismatch errors found ***");
        console.log ("For a detailed report run `gulp openReport`\n");
        if (paths.cliExitOnFail) {
          done(new Error('Mismatch errors found.'));
        }
      } else {
        done();
      }

      // takes original config file
      // it matches the index of the original config file
      // and passes is it to the current testpairs to get back testStatus
      // TODO: THIS NEEDS TO MOVE, it is making a file every update
      gulp.src(paths.compareConfigFileName)
        .pipe(jeditor(function(json) {
          json.testPairs.forEach(function(item, idx){
            var rFile = referenceDir + item.reference.split('/').slice(-1)[0];
            var tFile = testDir + item.test.split('/').slice(-2).join('/');
            // make a local_diff datapoint and instead of doing the compare on the frontend
            // we just show the results
            // it will save tons of time and improve the UX
            item.local_testStatus = compareConfig.testPairs[idx].testStatus;
            if (item.local_testStatus === 'fail') {
              item.local_diff = getDiffFilename(compareConfig.testPairs[idx].test, item.local_testStatus);
            } else if (item.local_testStatus === 'pass') {
              item.local_diff = getDiffFilename(compareConfig.testPairs[idx].test, item.local_testStatus);
            }
            item.local_reference = rFile;
            item.local_test = tFile;
          })
          return json;
        }))
        .pipe(rename('compare/config.json'))
        .pipe(gulp.dest('.'))
    }
  }

  // store failed images
  var failedImages = [];

  _.each(compareConfig.testPairs, function (pair) {
    pair.testStatus = "running";

    var referencePath = path.join(paths.backstop, pair.reference);
    var testPath = path.join(paths.backstop, pair.test);

    resemble(referencePath).compareTo(testPath).onComplete(function (data) {
      // FORK: Set a default
      if (typeof pair.misMatchThreshold === 'undefined') {
        pair.misMatchThreshold = 1;
      }

      var imageComparisonFailed = !data.isSameDimensions || data.misMatchPercentage > pair.misMatchThreshold;

      if (imageComparisonFailed) {
        pair.testStatus = "fail";
        console.log('FAILED:', pair.scenario);
      } else {
        pair.testStatus = "pass";
        console.log('PASSED:', pair.scenario);
      }
      
      storeDiffImage(testPath, data, pair.testStatus);
      
      updateProgress();
    });
  });

  function storeDiffImage(testPath, data, status) {
    var diffFilename = getDiffFilename(testPath,status);
    if (status === 'fail') {      
      var failedDiffStream = fs.createWriteStream(diffFilename);
      data.getDiffImage().pack().pipe(failedDiffStream)  
    } else if (status === 'pass') {
      var passedDiffStream = fs.createWriteStream(diffFilename);
      data.getDiffImage().pack().pipe(passedDiffStream)  
    }
  }

  function getDiffFilename(testPath, status) {
    var prefix = status === 'fail' ? 'failed_diff_' : 'passed_diff_';
    var lastSlash = testPath.lastIndexOf('/');
    return testPath.slice(0, lastSlash + 1) + prefix + testPath.slice(lastSlash + 1, testPath.length);
  }

});
