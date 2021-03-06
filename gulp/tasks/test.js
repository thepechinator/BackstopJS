

const gulp = require('gulp');
const fs = require('fs');
const spawn = require('child_process').spawn;
const paths = require('../util/paths');
const argv = require('yargs').argv;
const os = require('os');


// This task will generate a date-named directory with DOM screenshot files as specified in `./capture/config.json` followed by running a report.
// NOTE: If there is no bitmaps_reference directory or if the bitmaps_reference directory is empty then a new batch of reference files will be generated in the bitmaps_reference directory.  Reporting will be skipped in this case.
gulp.task('test', ['init'], (cb) => {
  // genReferenceMode contains the state which switches test or reference file generation modes
  let genReferenceMode = argv.genReferenceMode || false;

  // THIS IS THE BLOCK WHICH SWITCHES US INTO "GENERATE REFERENCE" MODE.  I'D RATHER SOMETHING MORE EXPLICIT THO. LIKE AN ENV PARAMETER...
  if (!fs.existsSync(paths.bitmaps_reference)) {
    console.log('\nGenerating reference files.\n');
    genReferenceMode = true;
  }

  // IF WE ARE IN TEST GENERATION MODE -- LOOK FOR CHANGES IN THE 'CAPTURE CONFIG'.
  if (!genReferenceMode) {
    // TEST FOR CAPTURE CONFIG CACHE -- CREATE IF ONE DOESN'T EXIST (If a .cache file does not exist it is likely a scenario where the user is testing shared reference files in a new context. e.g different dev env.).
    if (fs.existsSync(paths.captureConfigFileNameCache)) {
      // COMPARE CAPTURE CONFIG AGAINST THE CACHED VERSION. PROMPT IF DIFFERENT.
      var config = fs.readFileSync(paths.activeCaptureConfigPath, 'utf8');
      const cache = fs.readFileSync(paths.captureConfigFileNameCache, 'utf8');
      if (config !== cache) {
        console.log('\nIt looks like the reference configuration has been changed since last reference batch.');
        console.log('Please run `$ gulp reference` to generate a fresh set of reference files');
        console.log('or run `$ gulp bless` then `$ gulp test` to enable testing with this configuration.\n\n');
        return;
      }
    } else {
      gulp.run('bless');
    }
  }


  // AT THIS POINT WE ARE EITHER RUNNING IN "TEST" OR "REFERENCE" MODE

  const tests = ['capture/genBitmaps.js'];

  let args = [];

  if (/slimer/.test(paths.engine)) {
    args = ['--engine=slimerjs'];
  }

  // FORK to make our stuff pass in.
  // We have to translate the arguments into the options we want
  let key,
    value;

  // Right now this only supports arguments that use '--'.
  // We propogate those arguments into a options array,
  // which we then pass to casperjs as options when we spawn
  // the process.
  for (key in argv) {
    if (key === '_' || key === '$0') {
      continue;
    }
    args.push(`--${key}=${argv[key]}`);
  }

  if (paths.casperFlags) {
    if (/--engine=/.test(paths.casperFlags.toString())) {
      args = paths.casperFlags; // casperFlags --engine setting takes presidence -- replace if found.
    } else {
      args.concat(paths.casperFlags);
    }
  }

  const casperArgs = tests.concat(args);

  // For x amount of scenarios, we need to start as many casper processes...
  const casperProcess = (process.platform === 'win32' ? 'casperjs.cmd' : 'casperjs');

  // TODO: relocate the fetching of the settings to some
  // centralized location.
  const genConfigPath = 'capture/config.json';
  const configJSON = fs.readFileSync(genConfigPath);
  var config = JSON.parse(configJSON);
  if (!config.paths) {
    config.paths = {};
  }

  const scenarios = config.scenarios || config.grabConfigs;
  const compareConfigFileName = config.paths.compare_data || 'compare/config.json';

  // Set this based on a person's OS. We do one less than the amount of cores
  // because some people claim that it performs better since one core is needed
  // to handle runoff or something like that.
  let maxProcessesDefault = os.cpus().length - 1;

  if (config.maxProcesses) {
    maxProcessesDefault = config.maxProcesses;
  }

  // console.log(`SCENARIOS.LENGTH ${scenarios.length}`);

  // Figure out how many casper processes to spawn
  if (scenarios.length <= maxProcessesDefault) {
    // This means we need to set a cap
    maxProcessesDefault = scenarios.length;
  }
  let maxProcesses = maxProcessesDefault;

  // Create a bunch of new casper instances
  // while (maxProcesses > 0) {
  //   console.log('create casper');
  //   var kasper = casperKlass.create({
  //       verbose: true,
  //       logLevel: "debug"
  //   });
  //   bootstrapCasper(kasper);
  //   casperProcesses.push(kasper);
  //   maxProcesses--;
  // }
  // reset
  // maxProcesses = maxProcessesDefault;

  const itemsPerArray = Math.floor(scenarios.length / maxProcesses);
  let currentIndex = 0;
  let i = 0;

  const workerResults = [];

  console.log(`Running on ${maxProcesses} separate processes!`);

  for (i = 0; i < maxProcesses; i++) {
    if ((i + 1) === maxProcesses) {
      // on the last index... so get the modulo to get the number of items
      // extra we need to account for
      const extra = scenarios.length % maxProcesses;

      spawnWorker({ scenarioStartIndex: currentIndex, scenarioEndIndex: currentIndex + itemsPerArray + extra });
    } else {
      spawnWorker({ scenarioStartIndex: currentIndex, scenarioEndIndex: currentIndex + itemsPerArray });
    }

    currentIndex += itemsPerArray;
  }

  const compareConfig = { testPairs: [] };

  function spawnWorker(opts) {
    // console.log('spawning worker with opts', JSON.stringify(opts));

    const extraArgs = [`--scenario-start-index=${opts.scenarioStartIndex}`, `--scenario-end-index=${opts.scenarioEndIndex}`];
    const casperChild = spawn(casperProcess, casperArgs.concat(extraArgs));
    let compiledData = '';

    // let code = 1;

    // we need to read in all of the data input into a string.. why not
    // just read in all of the data and then on close, parse the json then
    casperChild.stdout.on('data', (data) => {
      data = data.toString().trim();
      compiledData += data;

      console.log('CasperJS:', data);

      // if (data.indexOf('[END_OF_BUFFER]') !== -1) {
      //   code = 0;
      //   casperChild.kill();
      // }
    });

    casperChild.stderr.on('data', (data) => {
      console.log('ERROR:', data.toString().slice(0, -1));
    });

    casperChild.on('close', (code) => {
      const success = code === 0; // Will be 1 in the event of failure
      const result = (success) ? 'Bitmap file generation completed.' : `Testing script failed with code: ${code}`;

      console.log(`\n${result}`);
      // console.info('ngProgress|compareStage');

      // exit if there was some kind of failure in the casperChild process
      if (code !== 0) {
        console.log('\nLooks like an error occured. You may want to try running `$ gulp echo`. This will echo the requested test URL output to the console. You can check this output to verify that the file requested is indeed being received in the expected format.');
        return false;
      }

      // we need to grab the data
      const regexp = /\[DATA\](.+)\[\/DATA\]/g;
      const matches = regexp.exec(compiledData);

      if (matches !== null) {
        // console.log('parsing compiled data\n', compiledData, '\n');
        // parse the JSON and push it onto our results
        workerResults.push(JSON.parse(matches[1]).testPairs);
      }

      maxProcesses--;

      if (maxProcesses === 0) {
        console.log('all threads finished');

        // Always write to the config I guess.. we might not need to
        // if the config testPairs is empty
        //
        // Gather the results
        for (let i = 0; i < workerResults.length; i++) {
          compareConfig.testPairs = compareConfig.testPairs.concat(workerResults[i]);
        }

        const configData = JSON.stringify(compareConfig, null, 2);
        // console.log('writing config testPairs to compareConfig', compareConfigFileName, configData);

        fs.writeFileSync(compareConfigFileName, configData);

        const resultConfig = compareConfig;

        if (genReferenceMode || resultConfig.testPairs.length == 0) {
          console.log('\nRun `$ gulp test` to generate diff report.\n');

          cb();
        } else {
          console.log('Running report');

          // Shouldn't use run here, but oh well.
          gulp.run('report', (err) => {
            if (err) {
              return cb(err);
            }

            cb();
          });
        }
      }
    });
  }
});
