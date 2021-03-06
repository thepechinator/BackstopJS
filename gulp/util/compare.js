// const gulp = require('gulp');
// const open = require('gulp-open');
// const rename = require('gulp-rename');
// const jeditor = require('gulp-json-editor');

const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const resemble = require('node-resemble-js');
const paths = require('./paths');
const fs = require('fs');
const path = require('path');
const _ = require('underscore');


const failsStorage = [];
// const compareConfig = JSON.parse(fs.readFileSync(paths.compareConfigFileName, 'utf8'));
let numberOfTests = 0;
let passed = 0;
let failed = 0;
let startDiffStore = false;
let testPairs = null;

// FORK: This is what compare.js uses.
// const resembleTestConfig = {
//   errorColor: { red: 244, green: 67, blue: 54 },
//   errorType: 'movement',
//   transparency: 0.1,
//   largeImageThreshold: 1200,
// };
// resemble.outputSettings(resembleTestConfig);

function checkQueue() {
  // console.info('checkQueue', numberOfTests, !startDiffStore);
  if (numberOfTests === 0 && !startDiffStore) {
    // console.log('COMPARE : ALL DONE FOR THIS PROCESS, sending message', testPairs);

    process.send({ testPairs, passed, failed, failFiles: failsStorage, shouldExit: true });
  }
}

function getDiffFilename(testPath, status) {
  const prefix = status === 'fail' ? 'failed_diff_' : 'passed_diff_';
  const dirname = path.dirname(testPath);
  let partial = `.${testPath.split('test/css')[1]}`;
  const splitPartial = partial.split('mocks_pages_');
  const basename = path.basename(testPath);
  partial = splitPartial[0] + prefix + basename;
  console.info('testPath: ', testPath); // wf
  return {
    full: path.join(dirname, prefix + basename),
    partial,
    basename,
  };
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
    failsStorage.push(diffFilename.basename);
  }

  const writeStream = fs.createWriteStream(diffFilename.full);
  writeStream.on('close', () => {
    startDiffStore = false;
    numberOfTests -= 1;
    checkQueue();
  });
  data.pack().pipe(writeStream);
}

const runPixelmatch = (referencePath, testPath, pair) => {
  let filesRead = 0;
  let refImg = null;
  let testImg = null;

  const doneReading = () => {
    filesRead += 1;
    if (filesRead < 2) {
      return;
    }

    const diff = new PNG({ width: refImg.width, height: refImg.height });
    //
    // console.info('pixelmatch!');
    // try {
    //
    // Make it return a promise.. maybe that will make it actually
    // faster.
    const result = pixelmatch(
      refImg.data,
      testImg.data,
      diff.data,
      refImg.width,
      refImg.height,
      { threshold: pair.misMatchThreshold, includeAA: true }
    )

    console.info('pixelmatch done');
    if (result > 0) {
      // If there are some mismatches
      pair.testStatus = 'fail';
      failed += 1;
      console.log('ERROR:', pair.label, pair.fileName);
      // console.info('pair: ', pair); // wf
    } else {
      // No errors
      pair.testStatus = 'pass';
      passed += 1;
      console.log('OK:', pair.label, pair.fileName);
    }

    storeDiffImage(pair, testPath, diff, pair.fileName, pair.testStatus);
  };

  refImg = fs.createReadStream(referencePath).pipe(new PNG()).on('parsed', doneReading);
  testImg = fs.createReadStream(testPath).pipe(new PNG()).on('parsed', doneReading);
};

const resembleConfig = {
  errorColor: { red: 244, green: 67, blue: 54 },
  errorType: 'movement',
  transparency: 0.1,
  largeImageThreshold: 1200,
};

resemble.outputSettings(resembleConfig);
const runResemble = (referencePath, testPath, pair) => {
  resemble(referencePath).compareTo(testPath)
    .onComplete((diff) => {
      const imageComparisonFailed = !diff.isSameDimensions ||
        (diff.misMatchPercentage > pair.misMatchThreshold);

      if (imageComparisonFailed) {
        pair.testStatus = 'fail';
        failed += 1;
      } else {
        pair.testStatus = 'pass';
        passed += 1;
      }

      storeDiffImage(pair, testPath, diff.getDiffImage(), pair.fileName, pair.testStatus);
    });
};

function compareImages(referencePath, testPath, pair) {
  if (typeof pair.misMatchThreshold === 'undefined') {
    pair.misMatchThreshold = 0.1;
  }

  // runPixelmatch(referencePath, testPath, pair);
  runResemble(referencePath, testPath, pair);
}

function test() {
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
}

process.on('message', (data) => {
  // do something
  numberOfTests = data.testPairs.length;
  testPairs = data.testPairs;
  test();
});

// process.on('error', (err) => {
//   console.error('Child error:', err.toString());
//   process.send(err);
// });
//
// process.on('uncaughtException', function(e){
//     process.send(e);
// })
