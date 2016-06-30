// The fs here actually refers to http://phantomjs.org/api/fs/
var fs = require('fs');
var utils = require('utils');


// Fork Stuff
// var bitmaps_reference = 'bitmaps_reference';
// var bitmaps_test = 'bitmaps_test';
// var compareConfigFileName = 'compare/config.json';
// var genConfigPath = 'capture/config.json';

var selectorNotFoundPath = 'capture/resources/selectorNotFound_noun_164558_cc.png'
var hiddenSelectorPath = 'capture/resources/hiddenSelector_noun_63405.png'

// TODO: relocate the fetching of the settings to some
// centralized location.
var genConfigPath = 'capture/config.json'

var configJSON = fs.read(genConfigPath);

var config = JSON.parse(configJSON);
if (!config.paths) {
  config.paths = {};
}

// All of the options we need to look at
var bitmaps_reference = config.paths.bitmaps_reference || 'bitmaps_reference';
var bitmaps_test = config.paths.bitmaps_test || 'bitmaps_test';
var casper_scripts = config.paths.casper_scripts || null;
var compareConfigFileName = config.paths.compare_data || 'compare/config.json';
var viewports = config.viewports;
var scenarios = config.scenarios||config.grabConfigs;
var blacklistedRequests = config.blacklistedRequests || [];

//.Methods you want to execute for ALL pages
var executeExternalJSMethods = config.executeExternalJSMethods || [];

var compareConfig = {testPairs:[]};

// so here, we can define the number of our casper processes and then loop through the scenarios
// smartly
// console.log('scenarios', scenarios);
//
// var casperKlass = require("casper");
//
// var maxThreadsDefault = 8;
//
// var casperProcesses = [];
//
// console.log('scenarios.length', scenarios.length);
// // Figure out how many casper processes to spawn
// if (scenarios.length <= maxThreadsDefault) {
//   // This means we need to set a cap
//   maxThreadsDefault = scenarios.length;
// }
// console.log('maxThreadsDefault', maxThreadsDefault);
//
// var maxThreads = maxThreadsDefault;
//
// // Create a bunch of new casper instances
// while (maxThreads > 0) {
//   console.log('create casper');
//   var kasper = casperKlass.create({
//       verbose: true,
//       logLevel: "debug"
//   });
//   bootstrapCasper(kasper);
//   casperProcesses.push(kasper);
//   maxThreads--;
// }
// // reset
// maxThreads = maxThreadsDefault;


// This is where casper gets initialized
// var casper = casperKlass.create({
//   // clientScripts: ["jquery.js"] // uncomment to add jQuery if you need that.
// });
// var options = kasper.cli.options;
//
// bootstrapCasper(casper);

// var casper = casperProcesses[0];
var casper = require('casper').create({});
var options = casper.cli.options;
bootstrapCasper(casper);

// console.log('casper options', options['scenario-start-index'], options['scenario-end-index']);
// console.log('hum');

// console.log('scenarios', scenarios.length);
// we need to split the scenarios up... like so
scenarios = scenarios.slice(options['scenario-start-index'], options['scenario-end-index']);
// console.log('casper.cli.options', JSON.stringify(casper.cli.options));
// console.log('after setting scenarios..', scenarios.length);
// Helper functions
//
// Keep a list of blacklist functions to run against certain types.
var _isBlacklisted = function(requestData, request, regex) {
    return (regex.test(requestData.url));
}

// Each type may have an associated method to determine whether
// the incoming request should be blacklisted
var _requestHash = {
    'default': _isBlacklisted
};


function bootstrapCasper(casperInstance) {
    if (config.debug) {
      console.log('Debug is enabled!');

      casperInstance.on("page.error", function(msg, trace) {
          this.echo("Remote Error >    " + msg, "error");
          this.echo("file:     " + trace[0].file, "WARNING");
          this.echo("line:     " + trace[0].line, "WARNING");
          this.echo("function: " + trace[0]["function"], "WARNING");
      });
    }

    casperInstance.on('remote.message', function(message) {
      this.echo('remote console > ' + message);
    });

    casperInstance.on('resource.received', function(resource) {
      var status = resource.status;
      if(status >= 400) {
        casperInstance.log('remote error > ' + resource.url + ' failed to load (' + status + ')', 'error');
      }
    });

    // Block certain requests.
    casperInstance.on('resource.requested', function(requestData, request) {
        var abort = false,
            i = 0;

        // Look for certain patterns to determine if they are of that type.
        while(i < blacklistedRequests.length) {
            var obj = blacklistedRequests[i],
                type = obj.type;
                regex = new RegExp(obj.regex, obj.regexFlags);

            if (typeof _requestHash[type] === 'undefined') {
                type = 'default';
            }

            try {
                abort = _requestHash[type](requestData, request, regex);
            } catch(e) {
                casperInstance.echo(e);
            }
            if (abort) {
                casperInstance.echo('Aborting request: ' + requestData.url);
                request.abort();
                break;
            }

            i++;
        }
    });
}

// FORK: Keeps track of all the filenames.
var scenarioRegistry = {};

function capturePageSelectors(url,casper,scenarios,viewports,bitmaps_reference,bitmaps_test,isReference){

  // console.log('hmm', casperProcesses.length);
  // console.log('casperProcesses', JSON.stringify(casperProcesses));
  // each scenario should go into its own separate process
  // var casper = kasper;

  var screenshotNow = new Date();
  var screenshotDateTime = screenshotNow.getFullYear() + pad(screenshotNow.getMonth() + 1) + pad(screenshotNow.getDate()) + '-' + pad(screenshotNow.getHours()) + pad(screenshotNow.getMinutes()) + pad(screenshotNow.getSeconds());

  var consoleBuffer = '';
  var scriptTimeout = 20000;

  casper.on('remote.message', function(message) {
      this.echo(message);
      consoleBuffer = consoleBuffer + '\n' + message;
  });

  casper.start();

  casper.each(scenarios,function(casper, scenario, scenario_index){
    // BEGIN FORK
    // If no label is present, default to normal labeling procedure.
    if ( !scenario.hasOwnProperty('label') ) {
      scenario.label = scenario_index;
    }
    // Replace certain special characters with underscores so
    // we don't end up creating subdirectories.
    scenario.label = scenario.label.replace(/[\/\.]/g, '_');

    // To guarantee file name uniqueness, we need to perform this check.
    // If the label is not unique, then we need to make it unique
    // and then register that label to the registry.
    if (scenarioRegistry[scenario.label]) {
      var i = 1;
      while (scenarioRegistry[scenario.label]) {
        scenario.label = scenario.label + i;
      }
    }
    scenarioRegistry[scenario.label] = true;
    // END FORK

    if (scenario.cookiesJsonFile && fs.isFile(scenario.cookiesJsonFile)) {
      var cookiesJson = fs.read(scenario.cookiesJsonFile);
      var cookies = JSON.parse(cookiesJson);
      for (var i = 0; i < cookies.length; i++) {
        phantom.addCookie(cookies[i]);
      }
    }

    casper.each(viewports, function(casper, vp, viewport_index) {
      this.then(function() {
        this.viewport(vp.width||vp.viewport.width, vp.height||vp.viewport.height);
      });

      // console.log('open scenario.url', scenario.url);
      this.thenOpen(scenario.url, function() {

        casper.waitFor(
          function(){ //test
            if(!scenario.readyEvent)return true;
            var regExReadyFlag = new RegExp(scenario.readyEvent,'i');
            return consoleBuffer.search(regExReadyFlag)>=0;
          }
          ,function(){//on done
            consoleBuffer = '';
            casper.echo('Ready event received.');
          }
          ,function(){casper.echo('ERROR: casper timeout.')} //on timeout
          ,scriptTimeout
        );

        casper.wait(scenario.delay||1);

      });

      casper.then(function() {
        this.echo('Current location is ' + scenario.url, 'info');

        if (config.debug) {
          var src = this.evaluate(function() {return document.body.outerHTML; });
          this.echo(src);
        }
      });

      // Custom casperjs scripting after ready event and delay
      casper.then(function() {

        // onReadyScript files should export a module like so:
        //
        // module.exports = function(casper, scenario) {
        //   // run custom casperjs code
        // };
        //
        if ( scenario.onReadyScript ) {

          casper.echo('Running custom scripts.');

          // Ensure a `.js` file suffix
          var script_path = scenario.onReadyScript.replace(/\.js$/, '') + '.js';
          // if a casper_scripts path exists, append the onReadyScript soft-enforcing a single slash between them.
          if ( casper_scripts ) {
            script_path = casper_scripts.replace(/\/$/, '') + '/' + script_path.replace(/^\//, '');
          }

          // make sure it's there...
          if ( !fs.isFile( script_path ) ) {
            casper.echo("FYI: onReadyScript was not found.");
            return;
          }

          // the require() call below is relative to this file `genBitmaps.js` (not CWD) -- therefore relative paths need shimmimg
          var require_script_path = script_path.replace(/^\.\.\//, '../../../').replace(/^\.\//, '../../');

          require(require_script_path)(casper, scenario, vp);

        }
      });

      this.then(function(){

        this.echo('Screenshots for ' + vp.name + ' (' + (vp.width||vp.viewport.width) + 'x' + (vp.height||vp.viewport.height) + ')', 'info');

        //HIDE SELECTORS WE WANT TO AVOID
            if ( scenario.hasOwnProperty('hideSelectors') ) {
              scenario.hideSelectors.forEach(function(o,i,a){
                casper.evaluate(function(o){
                  Array.prototype.forEach.call(document.querySelectorAll(o), function(s, j){
                    s.style.visibility='hidden';
                  });
                },o);
              });
            }

        //REMOVE UNWANTED SELECTORS FROM RENDER TREE
            if ( scenario.hasOwnProperty('removeSelectors') ) {
              scenario.removeSelectors.forEach(function(o,i,a){
                casper.evaluate(function(o){
                  Array.prototype.forEach.call(document.querySelectorAll(o), function(s, j){
                    s.style.display='none';
                  });
                },o);
              });
            }

            executeExternalJSMethods.forEach(function(methodKey,index,array){
              casper.evaluate(function(methodKey){
                USN.CSS_REGRESSION.JS_METHODS[methodKey]();
                // in some namespace, there will be on window something we can
                // access and execute
                // Array.prototype.forEach.call(document.querySelectorAll(o), function(s, j){
                //   s.style.display='none';
                // });
              },methodKey);
            });

            if ( scenario.hasOwnProperty('executeExternalJSMethods') ) {
              scenario.executeExternalJSMethods.forEach(function(methodKey,index,array){
                casper.evaluate(function(methodKey){
                  USN.CSS_REGRESSION.JS_METHODS[methodKey]();
                  // in some namespace, there will be on window something we can
                  // access and execute
                  // Array.prototype.forEach.call(document.querySelectorAll(o), function(s, j){
                  //   s.style.display='none';
                  // });
                },methodKey);
              });
            }

        //CREATE SCREEN SHOTS AND TEST COMPARE CONFIGURATION (CONFIG FILE WILL BE SAVED WHEN THIS PROCESS RETURNS)
            // If no selectors are provided then set the default 'body'
            if ( !scenario.hasOwnProperty('selectors') ) {
              scenario.selectors = [ 'body' ];
            }
        scenario.selectors.forEach(function(o,i,a){
          // FORK: remove anything that's not a letter or a number
          var cleanedSelectorName = o.replace(/[\]\[=]/g, '--').replace(/[^a-zA-Z\d-_]/g,'');

          // FORK: replace scenario_index with scenario.label
          var fileName = scenario.label + '_' + i + '_' + cleanedSelectorName + '_' + viewport_index + '_' + vp.name + '.png';;

          var reference_FP  = bitmaps_reference + '/' + fileName;
          // FORK
          var reference_tmp_FP = bitmaps_reference + '/.tmp/' + fileName;
          var test_FP       = bitmaps_test + '/' + screenshotDateTime + '/' + fileName;

          var filePath      = (isReference)?reference_FP:test_FP;

          if (casper.exists(o)) {
            if (casper.visible(o)) {
              // FORK: Check for the flag, options.sync. If passed in, copy over
              // the file from .tmp if it exists there. Otherwise, create
              // the file. We need to look up the image based on the selector name
              // and label.
              if (!options.baseline && options.sync && fs.exists(reference_tmp_FP) && !fs.exists(reference_FP)) {
                  // If we don't catch the exception here, it will cause the backstop process
                  // to just hang-- which sucks.
                  try {
                      fs.move(reference_tmp_FP, reference_FP);
                  } catch(e) {
                      that.echo(e);
                  }
              } else {
                  // that.echo('capture');
                  casper.captureSelector(filePath, o);
              }
            } else {
              var assetData = fs.read(hiddenSelectorPath, 'b');
              fs.write(filePath, assetData, 'b');
            }
          } else {
            var assetData = fs.read(selectorNotFoundPath, 'b');
            fs.write(filePath, assetData, 'b');
          }


          if (!isReference) {
            compareConfig.testPairs.push({
              reference:reference_FP,
              test:test_FP,
              selector:o,
              fileName:fileName,
              label:scenario.label,
              misMatchThreshold: scenario.misMatchThreshold
            });
          }

          //casper.echo('remote capture to > '+filePath,'info');

        });//end topLevelModules.forEach

      });

    });//end casper.each viewports

  });//end casper.each scenario
}


//========================
//this query should be moved to the prior process
//`isReference` could be better passed as env parameter
var exists = fs.exists(bitmaps_reference);
var isReference = false;
if(!exists || options.genReferenceMode){isReference=true; console.log('CREATING NEW REFERENCE FILES')}
//========================

capturePageSelectors(
  'index.html'
  ,casper
  ,scenarios
  ,viewports
  ,bitmaps_reference
  ,bitmaps_test
  ,isReference
);

// console.log('running against scenarios', JSON.stringify(scenarios));
casper.run(function(){
  complete();
  this.exit();
});

// We only do this once everything is complete...
// and the compareConfig is something that gets added to
// over the course of our runs
function complete(){
  console.log('[DATA]' + JSON.stringify(compareConfig) + '[/DATA]');
  console.log('\n[END_OF_BUFFER]\n');
}

function pad(number) {
  var r = String(number);
  if ( r.length === 1 ) {
    r = '0' + r;
  }
  return r;
}
