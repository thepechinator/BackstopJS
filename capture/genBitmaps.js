// The fs here actually refers to http://phantomjs.org/api/fs/
var fs = require('fs');
var utils = require('utils');



var bitmaps_reference = 'bitmaps_reference';
var bitmaps_test = 'bitmaps_test';
var compareConfigFileName = 'compare/config.json';
var genConfigPath = 'capture/config.json';


var configJSON = fs.read(genConfigPath);
var config = JSON.parse(configJSON);

var viewports = config.viewports;
var scenarios = config.scenarios||config.grabConfigs;

var compareConfig = {testPairs:[]};

var casper = require("casper").create({
	// clientScripts: ["jquery.js"] //lets try not to use this it's friggin 2014 already people...
});
var options = casper.cli.options;

casper.on('resource.received', function(resource) {
		//casper.echo(resource.url);
});

casper.on("page.error", function(msg, trace) {
	// this.echo("Remote Error >    " + msg, "error");
	// this.echo("file:     " + trace[0].file, "WARNING");
	// this.echo("line:     " + trace[0].line, "WARNING");
	// this.echo("function: " + trace[0]["function"], "WARNING");
});

casper.on('remote.message', function(message) {
	this.echo('remote console > ' + message);
});

casper.on('resource.received', function(resource) {
	var status = resource.status;
	if(status >= 400) {
		casper.log('remote error > ' + resource.url + ' failed to load (' + status + ')', 'error');
	}
});


// Keep a list of blacklist functions to run against certain types.
var _isBlacklisted = function(requestData, request, regex) {
    return (regex.test(requestData.url));
}

// Our list of types to blacklist functions.
var _requestHash = {
    'default': _isBlacklisted
}

// Block certain requests.
casper.on('resource.requested', function(requestData, request) {
    // Look for certain patterns to determine if they are of that type.
    var blacklistedRequests = [
        // {"type": "css", "regex": "https?:\/\/.+?\\.css", "regexFlags": "gi"}, 
        {"type": "ad",  "regex": "https?:\/\/.*?(ad\\.doubleclick\\.net)|(adserver)|(doubleclick)|(googleads).*", "regexFlags": "gi"}
    //     {"type": "social", "regex": "https?:\/\/.*?(tpc\\.googlesyndication\\.com)|((s-static|static)\\.ak\\.facebook\\.com\/connect)|(facebook\\.com).*", "regexFlags": "gi"},
    //     {"type": "youtube", "regex": "https?:\/\/.*?(youtube\\.com).*", "regexFlags": "gi"}
    ];

    var abort = false,
        i = 0;

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
            casper.echo(e);
        }
        if (abort) {
            casper.echo('Aborting request: ' + requestData.url);
            request.abort();
            break;
        }

        i++;
    }
});



function capturePageSelectors(url,scenarios,viewports,bitmaps_reference,bitmaps_test,isReference){

	var
		screenshotNow = new Date(),
		screenshotDateTime = screenshotNow.getFullYear() + pad(screenshotNow.getMonth() + 1) + pad(screenshotNow.getDate()) + '-' + pad(screenshotNow.getHours()) + pad(screenshotNow.getMinutes()) + pad(screenshotNow.getSeconds());


	var consoleBuffer = '';
	var scriptTimeout = 20000;

  // Keeps track of all the filenames.
  var scenarioRegistry = {};

	casper.on('remote.message', function(message) {
	    this.echo(message);
	    consoleBuffer = consoleBuffer + '\n' + message;
	});


	casper.start();
	// casper.viewport(1280,1024);



	casper.each(scenarios,function(casper, scenario, scenario_index){
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

		casper.each(viewports, function(casper, vp, viewport_index) {
			this.then(function() {
				this.viewport(vp.width||vp.viewport.width, vp.height||vp.viewport.height);
			});

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

				//var src = this.evaluate(function() {return document.body.outerHTML; });
				//this.echo(src);
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
                // this.echo('removeSelectors after');

				//CREATE SCREEN SHOTS AND TEST COMPARE CONFIGURATION (CONFIG FILE WILL BE SAVED WHEN THIS PROCESS RETURNS)
                // If no selectors are provided then set the default 'body'
                if ( !scenario.hasOwnProperty('selectors') ) {
                  scenario.selectors = [ 'body' ];
                }

                var that = this;

				scenario.selectors.forEach(function(o,i,a){
                    // that.echo('something is fishy');
                    //remove anything that's not a letter or a number
					var cleanedSelectorName = o.replace(/[\]\[=]/g, '--').replace(/[^a-zA-Z\d-_]/g,'');
                    //var cleanedUrl = scenario.url.replace(/[^a-zA-Z\d]/,'');//remove anything that's not a letter or a number

                    var fileName = scenario.label + '_' + i + '_' + cleanedSelectorName + '_' + viewport_index + '_' + vp.name + '.png';


					var reference_FP 	= bitmaps_reference + '/' + fileName;
                    var reference_tmp_FP = bitmaps_reference + '/.tmp/' + fileName;
					var test_FP 			= bitmaps_test + '/' + screenshotDateTime + '/' + fileName;

					var filePath 			= (isReference)?reference_FP:test_FP;

				    if(!isReference) {
						compareConfig.testPairs.push({
							reference:reference_FP,
							test:test_FP,
							selector:o,
							fileName:fileName,
							label:scenario.label
						});
                    }

                    // Check for this is options.sync is passed in, and copy over
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
	,scenarios
	,viewports
	,bitmaps_reference
	,bitmaps_test
	,isReference
);

casper.run(function(){
	complete();
	this.exit();
});

function complete(){
	var configData = JSON.stringify(compareConfig,null,2);
	fs.write(compareConfigFileName, configData, 'w');
	console.log(
		'Comparison config file updated.'
		//,configData
	);
}

function pad(number) {
	var r = String(number);
	if ( r.length === 1 ) {
		r = '0' + r;
	}
	return r;
}
