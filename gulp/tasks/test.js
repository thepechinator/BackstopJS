'use strict';

var gulp  = require('gulp');
var fs    = require('fs');
var spawn = require('child_process').spawn;
var paths = require('../util/paths');
var argv = require('yargs').argv;
var os = require('os');


//This task will generate a date-named directory with DOM screenshot files as specified in `./capture/config.json` followed by running a report.
//NOTE: If there is no bitmaps_reference directory or if the bitmaps_reference directory is empty then a new batch of reference files will be generated in the bitmaps_reference directory.  Reporting will be skipped in this case.
gulp.task('test',['init'], function (cb) {
  // genReferenceMode contains the state which switches test or reference file generation modes
  var genReferenceMode = argv.genReferenceMode || false;

  // THIS IS THE BLOCK WHICH SWITCHES US INTO "GENERATE REFERENCE" MODE.  I'D RATHER SOMETHING MORE EXPLICIT THO. LIKE AN ENV PARAMETER...
  if(!fs.existsSync(paths.bitmaps_reference)){
    console.log('\nGenerating reference files.\n');
    genReferenceMode = true;
  }

  //IF WE ARE IN TEST GENERATION MODE -- LOOK FOR CHANGES IN THE 'CAPTURE CONFIG'.
  if(!genReferenceMode){

    // TEST FOR CAPTURE CONFIG CACHE -- CREATE IF ONE DOESN'T EXIST (If a .cache file does not exist it is likely a scenario where the user is testing shared reference files in a new context. e.g different dev env.).
    if(fs.existsSync(paths.captureConfigFileNameCache)){

      //COMPARE CAPTURE CONFIG AGAINST THE CACHED VERSION. PROMPT IF DIFFERENT.
      var config = fs.readFileSync(paths.activeCaptureConfigPath, 'utf8');
      var cache = fs.readFileSync(paths.captureConfigFileNameCache, 'utf8');
      if(config !== cache){
        console.log('\nIt looks like the reference configuration has been changed since last reference batch.');
        console.log('Please run `$ gulp reference` to generate a fresh set of reference files');
        console.log('or run `$ gulp bless` then `$ gulp test` to enable testing with this configuration.\n\n');
        return;
      }

    }else{
      gulp.run('bless');
    }
  }


  // AT THIS POINT WE ARE EITHER RUNNING IN "TEST" OR "REFERENCE" MODE

  var tests = ['capture/genBitmaps.js'];

  var args = [];

  if (/slimer/.test(paths.engine)) {
    args = ['--engine=slimerjs'];
  }

  // FORK to make our stuff pass in.
  // We have to translate the arguments into the options we want
  var key, value;

  // Right now this only supports arguments that use '--'.
  // We propogate those arguments into a options array,
  // which we then pass to casperjs as options when we spawn
  // the process.
  for (key in argv) {
    if (key === '_' || key === '$0') {
      continue;
    }
    args.push('--' + key + '=' + argv[key])
  }

  if (paths.casperFlags) {
    if (/--engine=/.test(paths.casperFlags.toString())) {
      args = paths.casperFlags; // casperFlags --engine setting takes presidence -- replace if found.
    } else {
      args.concat(paths.casperFlags)
    }
  }

  var casperArgs = tests.concat(args);

  // For x amount of scenarios, we need to start as many casper processes...
  var casperProcess = (process.platform === "win32" ? "casperjs.cmd" : "casperjs");

  var genConfigPath = 'capture/config.json'
  var configJSON = fs.readFileSync(genConfigPath);
  var config = JSON.parse(configJSON);
  if (!config.paths) {
    config.paths = {};
  }


  var scenarios = config.scenarios||config.grabConfigs;
  var compareConfigFileName = config.paths.compare_data || 'compare/config.json';

  // Set this based on a person's OS. We do one less than the amount of cores
  // because some people claim that it performs better since one core is needed
  // to handle runoff or something like that.
  let maxProcessesDefault = os.cpus().length-1;
  if (maxProcessesDefault <= 1) {
    maxProcessesDefault = 2;
  }

  // Figure out how many casper processes to spawn
  if (scenarios.length <= maxProcessesDefault) {
    // This means we need to set a cap
    maxProcessesDefault = scenarios.length;
  }
  var maxProcesses = maxProcessesDefault;

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

  var itemsPerArray = Math.floor(scenarios.length/maxProcesses);
  var currentIndex = 0;
  var i = 0;

  var workerResults = [];

  console.log(`Using ${maxProcesses} separate processes`);

  for (i = 0; i < maxProcesses; i++) {
    if ( (i+1) === maxProcesses ) {
       // on the last index... so get the modulo to get the number of items
       // extra we need to account for
       let extra = scenarios.length % maxProcesses;

       spawnWorker({scenarioStartIndex: currentIndex, scenarioEndIndex: currentIndex+itemsPerArray+extra});
    } else {
      spawnWorker({scenarioStartIndex: currentIndex, scenarioEndIndex: currentIndex+itemsPerArray});
    }

    currentIndex += itemsPerArray;
  }

  var compareConfig = { testPairs: [] };

  function spawnWorker(opts) {
    // console.log('spawning worker with opts', JSON.stringify(opts));

    var extraArgs = ['--scenario-start-index=' + opts.scenarioStartIndex, '--scenario-end-index=' + opts.scenarioEndIndex];
    var casperChild = spawn(casperProcess, casperArgs.concat(extraArgs));

    casperChild.stdout.on('data', function (data) {
      var scrubbedData = '';
      data = data.toString();

      if (data.indexOf('[DATA]:') !== -1) {
        scrubbedData = data.replace('[DATA]:', '');
        data = JSON.parse(scrubbedData);

        if (data.testPairs.length) {
          workerResults.push(data.testPairs);
        }
      } else {
        console.log('CasperJS:', data.slice(0, -1)); // Remove \n
      }
    });

    casperChild.stderr.on('data', function(data) {
      console.log('ERROR:', data.toString().slice(0, -1));
    });

    casperChild.on('close', function (code) {
      var success = code === 0; // Will be 1 in the event of failure
      var result = (success)?'Bitmap file generation completed.':'Testing script failed with code: '+code;

      console.log('\n'+result);

      //exit if there was some kind of failure in the casperChild process
      if(code !== 0) {
        console.log('\nLooks like an error occured. You may want to try running `$ gulp echo`. This will echo the requested test URL output to the console. You can check this output to verify that the file requested is indeed being received in the expected format.');
        return false;
      };

      maxProcesses--;

      if (maxProcesses === 0) {
        console.log('all threads finished');

        // Always write to the config I guess.. we might not need to
        // if the config testPairs is empty
        //
        // Gather the results
        for (var i = 0; i < workerResults.length; i++) {
          compareConfig.testPairs = compareConfig.testPairs.concat(workerResults[i]);
        }

        var configData = JSON.stringify(compareConfig,null,2);
        // console.log('writing config testPairs to compareConfig', compareConfigFileName, configData);

        fs.writeFileSync(compareConfigFileName, configData);

        var resultConfig = compareConfig;

        if(genReferenceMode || resultConfig.testPairs.length==0){
          console.log('\nRun `$ gulp test` to generate diff report.\n');

          // var configData = JSON.stringify(compareConfig,null,2);
          // fs.writeFileSync(compareConfigFileName, configData);

          cb();
        } else {
          console.log('Running report');

          // var configData = JSON.stringify(compareConfig,null,2);
          // fs.writeFileSync(compareConfigFileName, configData);

          // Shouldn't use run here, but oh well.
          gulp.run('report', function(err) {
            if (err) {
              return cb(err);
            }

            cb();
          });
        }
      }

      // if(genReferenceMode || !resultConfig.testPairs||resultConfig.testPairs.length==0){
      //   maxProcesses--;
      //
      //   if (maxProcesses === 0) {
      //     console.log('all threads finished');
      //     console.log('\nRun `$ gulp test` to generate diff report.\n');
      //
      //     var configData = JSON.stringify(compareConfig,null,2);
      //     fs.writeFileSync(compareConfigFileName, configData);
      //
      //     cb();
      //   }
      // }else{
      //   maxProcesses--;
      //
      //   if (maxProcesses === 0) {
      //     console.log('all threads finished... running report');
      //
      //     var configData = JSON.stringify(compareConfig,null,2);
      //     fs.writeFileSync(compareConfigFileName, configData);
      //
      //     // Shouldn't use run here, but oh well.
      //     gulp.run('report', function(err) {
      //       if (err) {
      //         return cb(err);
      //       }
      //
      //       cb();
      //     });
      //   }
      // }

    });
  }


});
