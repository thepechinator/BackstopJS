const gulp = require('gulp');
const open = require('gulp-open');
const rename = require('gulp-rename');
const jeditor = require('gulp-json-editor');

const resemble = require('node-resemble-js');
const paths = require('./paths');
const fs = require('fs');
const path = require('path');
const _ = require('underscore');


const failsStorage = [];
const compareConfig = JSON.parse(fs.readFileSync(paths.compareConfigFileName, 'utf8'));

// FORK: This is what compare.js uses.
const resembleTestConfig = {
  errorColor: { red: 244, green: 67, blue: 54 },
  errorType: 'movement',
  transparency: 0.1,
  largeImageThreshold: 1200,
};
resemble.outputSettings(resembleTestConfig);

function test(testPairs) {
  let numberOfTests = testPairs.length;
  let passed = 0;
  let failed = 0;
  let startDiffStore = false;

  // The main code execution
  // The testPairs can't be mutated here...
  _.each(testPairs, (pair) => {
    pair.testStatus = 'running';

    // need the pair, referencePath, and testPath...
    // pass those in, set testStatus on the outside

    // For updating the pair properties, pass those back in your
    // message

    const referencePath = path.join(paths.backstop, pair.reference);
    const testPath = path.join(paths.backstop, pair.test);

    compareImages(referencePath, testPath, pair);
  });

  function compareImages(referencePath, testPath, pair) {
    resemble(referencePath).compareTo(testPath).onComplete((data) => {
      // FORK: Set a default
      if (typeof pair.misMatchThreshold === 'undefined') {
        pair.misMatchThreshold = 1;
      }

      const imageComparisonFailed = !data.isSameDimensions ||
        (data.misMatchPercentage > pair.misMatchThreshold);

      const testStatus = '';
      if (imageComparisonFailed) {
        pair.testStatus = 'fail';
        failed++;
        console.log('ERROR:', pair.label, pair.fileName);
        console.info('pair: ', pair); // wf
      } else {
        pair.testStatus = 'pass';
        passed++;
        console.log('OK:', pair.label, pair.fileName);
      }

      storeDiffImage(pair, testPath, data, pair.fileName, pair.testStatus);
    });
  }

  function checkQueue() {
    // console.info('checkQueue', numberOfTests, !startDiffStore);
    if (numberOfTests === 0 && !startDiffStore) {
      // console.log('COMPARE : ALL DONE FOR THIS PROCESS, sending message', testPairs);

      process.send({ testPairs, passed, failed, failFiles: failsStorage, shouldExit: true });
    }
  }

  function storeDiffImage(pair, testPath, data, testFile, status) {
    startDiffStore = true;
    const diffFilename = getDiffFilename(testPath, status);
    pair.diff = diffFilename;

    // hack this in until we find a good place to put it, to complete the merge.
    const rFile = `./bitmaps_reference/${pair.reference.split('/').slice(-1)[0]}`;
    const tFile = `./bitmaps_test/${pair.test.split('/').slice(-2).join('/')}`;
    pair.local_reference = rFile;
    pair.local_test = tFile;
    pair.local_diff = diffFilename.partial;
    pair.local_testStatus = pair.testStatus;

    console.log('Storing diff image in ', diffFilename.full);

    if (status === 'fail') {
      failsStorage.push(diffFilename.baseName);
      const failedDiffStream = fs.createWriteStream(diffFilename.full);
      failedDiffStream.on('close', () => {
        startDiffStore = false;
        numberOfTests--;
        checkQueue();
      });
      data.getDiffImage().pack().pipe(failedDiffStream);
    } else if (status === 'pass') {
      const passedDiffStream = fs.createWriteStream(diffFilename.full);
      passedDiffStream.on('close', () => {
        startDiffStore = false;
        numberOfTests--;
        checkQueue();
      });
      data.getDiffImage().pack().pipe(passedDiffStream);
        // .on('finish', () => {
        //   console.log('ON PASS file done');
        //   startDiffStore = false;
        //   checkQueue();
        // });
    }
  }

  function getDiffFilename(testPath, status) {
    const prefix = status === 'fail' ? 'failed_diff_' : 'passed_diff_';
    const lastSlash = testPath.lastIndexOf('/');

    let partial = `.${testPath.split('test/css')[1]}`;
    const splitPartial = partial.split('mocks_pages_');
    const baseName = `mocks_pages_${splitPartial[1]}`;
    partial = splitPartial[0] + prefix + baseName;
    console.info('testPath: ', testPath); // wf
    return {
      full: testPath.slice(0, lastSlash + 1) + prefix + testPath.slice(lastSlash + 1, testPath.length),
      partial,
      baseName,
    };
  }
}

process.on('message', (data) => {
  // do something
  test(data.testPairs);
});
