var compareApp = angular.module('compareApp', ['ngRoute', 'fsm', 'ngProgress']);


compareApp.config( function( $routeProvider ){
  $routeProvider
    .when( '/running/:testName', {action: 'running'})
    .when( '/baseline/:testName', {action: 'baseline'})
    .when( "/compare", {redirect:'/url'} )
    .when( "/url", {action: 'url'} )
    .when( "/file", {action:'file'} )
    .otherwise( {action: "file"} );
});

compareApp.filter('anchor', function() {
  return function(input) {
    if (input) {
      return input.slice(0, -4);
    }
  }
});

compareApp.filter('testTitle', function() {
  return function(input, mod) {
    if (input) {
      var testName = input.split("*[data-test-name='")[1].split("']")[0];
      if (mod === 'removeHyphens') {
        return testName.replace(/-/g, ' ');
      } else {
        return testName;
      }
    }
  }
});

compareApp.filter('scenarioTitle', function() {
  return function(input) {
    if (input) {
      return input.split('/mocks/pages/')[1];
    }
  }
});

compareApp.directive('testResultSummary', function() {
  return {
    restrict: 'EA',
    templateUrl: 'js/views/test-result-summary.html'
  }
});

compareApp.directive('baselineCheckbox', function() {
  return {
    restrict: 'EA',
    templateUrl: 'js/views/baseline-checkbox.html'
  }
});

// A directive to build a input box that autosuggests
// available directories to filter
compareApp.directive('completely', [function() {
  return {
    restrict: 'EA',
    link: function(scope, elem, attrs) {
      var directoryCompleter = completely(elem[0]);

      scope.$watch('directories', function(newVal) {
        var dirData = newVal;
        if(dirData) {
          // for dropdowns to work properly, the array must be ordered
          // with the nested directories on top
          // this is a dumb way of doing it, should count slashes
          dirData.sort(function(a, b){
            return b.id.length - a.id.length; // ASC -> a - b; DESC -> b - a
          });

          // force the first item of every option to be blank
          // this prevents pre-populating the first item and forces
          // use of the down arrow
          // will be less confusing since you can always filter for the current directory
          dirData.forEach(function(item) {
            if(item.options[0] !== "") {
              item.options.unshift('')
            }
          });
          
          directoryCompleter.onChange = function(text) { 
            scope.$apply(function() {
              scope.directoryFilter = text;
            });
            
            // search the matching dirDatanation.
            for (var i = 0; i < dirData.length; i++) {
              if (text.indexOf(dirData[i].id) === 0) {
                directoryCompleter.startFrom = dirData[i].id.length;
                directoryCompleter.options =   dirData[i].options;
                directoryCompleter.repaint();
                return;
              }  
            }
          };

          // store the text so that if user clicks back you can resume
          var storedText = [];

          // on click and focus show the dropdown
          function initDropdown() {
            // init if blank else input stored text
            if(!directoryCompleter.getText()) {
              // on click populate the dropdown with the first level (last item in dirData)
              directoryCompleter.options = dirData[dirData.length -1].options;
            } else {
              directoryCompleter.options = storedText;
            }
            directoryCompleter.repaint();
          }

          // on blur remove the dropdown
          function removeDropdown() {
            storedText = directoryCompleter.options;
            directoryCompleter.options = [];
            directoryCompleter.repaint();
          }

          elem.bind('click', initDropdown);

          // because of weird html in completely, need to go through this painful
          // dom selection to get stuff to happen on focus
          var secondInput = elem[0].querySelectorAll('input')[1];
          angular.element(secondInput).bind('focus', initDropdown);

          elem.find('input').bind('blur', removeDropdown);
        }

      });
    }
  };
}]);

// A service to build directory data for completely directive
compareApp.factory('Directories', function() {
    
  function getPrevDirPaths(url, level) {
    // level is how many preceding levels to join
    // ex. if level is 2 (0 based) then you get: health/wellness/diet
    var directories = [];
    for(var i = 0; i < level; i++) {
      directories.push(url[i] + '/');
    }
    return directories.join(''); // url.slice(0, level).join('/')    
  }

  function isDirectory(urlSegment) {
    return urlSegment.indexOf('.html') === -1;
  }

  function buildData(rawUrls) {
    var urlSegments = rawUrls.map(function(url) {
      // remove the beginning of the url (http and mocks/pages)
      // TODO: use the custom filter
      var paths = url.split('mocks/pages/')[1];
      return paths.split('/');
    });
    
    // storing output
    var data = [];
    var firstLevel = [];

    // create an object {id: DIR_PATHS, options: NEXT_AVAILABLE_DIRS}
    function addToObj(urlSegs) {
      // urlSegs is a url split into array, ex. ["health", "health-care", "portal.html"]
      for (var i = 0; i < urlSegs.length; i++) {
        var obj = {};
        var currSeg = urlSegs[i]; // 'health'
        var nextSeg = urlSegs[i + 1]; // 'health-care'

        if (isDirectory(currSeg)) {
          obj.id = getPrevDirPaths(urlSegs, i) + currSeg + '/';
          if(i === 0) {
            firstLevel.push(obj.id);    
          }
          if(isDirectory(nextSeg)) {
            obj.options = nextSeg + '/';
          } else {
            // if the nextSeg is a url just pass in an empty string
            obj.options = '';
          }
            data.push(obj);
        }
      }
    }
    
    // create useable object for every url
    urlSegments.forEach(addToObj);
    
    // add in the initial firstLevel paths where the id is empty
    data.push({id: '', options: firstLevel.filter(function(item, i, ar){ return ar.indexOf(item) === i; })})

    // merge repeated id's placing their option into an options array
    var seen = {};
    data = data.filter(function(entry) {
      var previous;

      // have we seen this label before?
      if (seen.hasOwnProperty(entry.id)) {
        // yes, grab it and add this data to it
        previous = seen[entry.id];
        if(previous.options.indexOf(entry.options) === -1) {
          previous.options.push(entry.options);
        }

        // don't keep this entry, we've merged it into the previous one
        return false;
      }

      // make entry.data an array if it is not
      if (!Array.isArray(entry.options)) {
        entry.options = [entry.options];
      }

      // Remember that we've seen it
      seen[entry.id] = entry;

      // keep this one, we'll merge any others that match into it
      return true;
    });

    return data;
  }
  
  return {
    query: function(list) {
      return buildData(list);
    }
  }
  
});

compareApp.controller('MainCtrl', function ($scope, $route, $routeParams, $q, $http, $filter, $location, $anchorScroll, Directories, ngProgressFactory, $timeout) {

  var resembleTestConfig = {
    errorColor: {red: 255, green: 0, blue: 255},
    errorType: 'movement',
    transparency: 0.1,
    largeImageThreshold: 1200
  };

  var defaultMisMatchThreshold = 1;

  //A TEST PAIR ARE TWO IMAGE OBJECTS PLUS THEIR META DATA WHICH WILL BE COMPARED BY RESEMBLE
  $scope.testPairs = [];

  $scope.testPairsCompleted = 0;
  $scope.passedCount = 0;
  $scope.failedCount = 0;
  $scope.blessedCount = 0;
  $scope.testDuration = 0;
  $scope.testIsRunning = true;


  $scope.detailFilterOptions = ['all','failed','passed','none'];
  $scope.statusFilter = 'all';

  $scope.displayOnStatusFilter = function(o){
    if(o.processing)return false;
    //console.log($scope.statusFilter,o)
    if($scope.statusFilter=='all'){
      return true;
    }else if($scope.statusFilter=='failed'){
      if(!o.passed){return true;}
    }else if($scope.statusFilter=='passed'){
      if(o.passed){return true;}
    }else{
      return false;
    }
  };



  // pass in testStatus from the already completed CLI tests if possible
  var testPairObj = function(a,b,c,o,testStatus){
    this.a={src:a||'',srcClass:'reference'},
      this.b={src:b||'',srcClass:'test'},
      this.c={src:c||'',srcClass:'diff'},
      this.report=null;
    this.processing=true;
    this.passed=false;
    this.blessed=false;
    this.meta = o;
    this.meta.misMatchThreshold = (o && o.misMatchThreshold && o.misMatchThreshold >= 0) ? o.misMatchThreshold : defaultMisMatchThreshold;
    this.testStatus = testStatus;
  };

  $scope.$on("$routeChangeSuccess", function( $currentRoute, $previousRoute ){

    $scope.params = JSON.stringify($routeParams,null,2);
    $scope.action = $route.current.action;
    console.info('$scope.action: ', $scope.action); //wf
    // run the route based commands if not simply clicking an anchor link
    // wonder why we have to tie diff test stuff to the route?
    if(!$scope.anchoring) {
      if ($scope.action === 'running') {
        // this triggers test running UI
        $scope.testRunning = true;
        $scope.runTest($routeParams, false);
      } else if ($scope.action === 'baseline') {
        // this triggers test running UI
        $scope.testRunning = true;
        $scope.runTest($routeParams, true);
      } else if ($scope.action=='url') {
        $scope.runUrlConfig($routeParams);
      }
      else {
        $scope.runFileConfig($routeParams);
      }
    }


  });

  // Makes a request to post test name(s)
  // Sets up a new event source that triggers a gulp test by the same name(s)
  // Prints Server Sent Events from the gulp stdout
  $scope.backstopStdout = [];

  $scope.runTest = function(test, baseline) {

    $http({
        url: '/backstop-test-prep',
        method: 'POST',
        data: {
               'test_name' : test.testName,
               'baseline'  : baseline
              }
    }).success(function(data, status, headers, config) {
        // After successfully posting to /backstop-test-prep
        // to store tests to run, connect to SSE stream
        // TODO: shouldn't have DOM stuff in controller
        // TODO: 

        if(data.status === 'busy') {
          $scope.isError = true;
          return;
        }

        // START progress bar
        $scope.progressbar = ngProgressFactory.createInstance();
        $scope.progressbar.setHeight('40px');
        $scope.progressbar.setColor('#64B5F6');
        
        var container = $('#runningBlock')[0];
        function printCommand () {
          var gulpCommand = '$ gulp backstop ';
          if(test.testName === 'all') {
            gulpCommand += '--path=ALL';
          } else if (baseline) {
            gulpCommand += '--baseline ';
          } else {
            gulpCommand += '--name=';
            gulpCommand += test.testName;
          }
          return gulpCommand;
        }

        $scope.runningCommand = printCommand();

        // TODO: dynamically include port
        var evtSource = new EventSource('http://' + window.location.hostname + ':3033/backstop');
        
        // init progress bar and stages
        $scope.progress = 0;
        $scope.prepStage = false;
        $scope.scenarioStage = false;
        $scope.compareStage = false;

        // increments progress bar an amt
        function progressStage(increment) {
          $scope.progress += (increment);
          $scope.progressbar.set($scope.progress);
        }

        function prepStage(msg) {          
          // 10%
          var stageDur = 10; // how many percent the whole stage takes
          var numExtraLines = 106; // TODO: 106 is a bs number, there are just 106 lines in the prepstage at the moment
          progressStage(stageDur/numExtraLines)
        }

        $scope.capturesCompleted = 0;
        function scenarioStage(msg) {
          // 60%
          var stageDur = 60;
          if(msg.indexOf('Screenshots for ') !== -1) {
            $scope.capturesCompleted++;
            progressStage(stageDur/($scope.numScenarios * 3));
          }
        }

        function compareStage(msg) {
          // 30%
          var stageDur = 30;
          if(msg.indexOf('FAILED:' || 'PASSED:') !== -1) {
            $scope.testPairsCompleted++;
            progressStage(stageDur/($scope.numScenarios * 3)); 
          }

          if(msg.indexOf('PASSED:') !== -1) {
              $scope.testPairsCompleted++;
              $scope.passedCount++;
            }
          
        }

        // this is where the data comes in
        evtSource.onmessage = function(e) {

          // Detect the 3 different stages of progress for the gulp backstop process
          // TODO: consolidate this crap
          if (e.data.indexOf('ngProgress') !== -1) {
            // if the data has something like ngProgress|compareStage|43
            // we split it to grab usedata from it
            var stage = e.data.split('|')[1];

            if (stage === 'prepStage') {
              $scope.progressbar.start();
              $scope.prepStage = true;
              console.info('prepStage started!'); //wf
            } else if (stage === 'scenarioStage') {
              $scope.prepStage = false;
              $scope.scenarioStage = true;
              // this is where we get the important info of how many tests
              $scope.numScenarios = parseInt(e.data.split('|')[2]);
              console.info('scenarioStage started!'); //wf
            } else if (e.data.indexOf('compareStage')) {
              $scope.scenarioStage = false; 
              $scope.compareStage = true;
              console.info('compareStage started!'); //wf
            }
          }

          // watch for scope changes
          if ($scope.prepStage) {            
            prepStage(e.data);
          }
          if ($scope.scenarioStage) {
            scenarioStage(e.data);
          }
          if ($scope.compareStage) {
            compareStage(e.data);
          }

          $scope.backstopStdout.push(e.data);
          // TODO: shouldn't have DOM stuff in controller
          container.scrollTop = container.scrollHeight;
          $scope.$apply();
        };      

        evtSource.onerror = function(e) {
          console.log(e);
        };

        evtSource.addEventListener('done', function(e) {
          //var obj = JSON.parse(e.data);
          // close the connection and redirect to compare page
          // TODO: can't we use $location?
          evtSource.close();
          //alert('done');
          $scope.progressbar.set(100);

          // only works with a timeout
          $timeout(function() {  
            $location.path('/');
            $scope.testRunning = false;
          });

          //window.location.href = '/compare';
        }, false);

        console.log(evtSource);
    
    }).error(function(data, status, headers, config) {
        // TODO: take response and give feedback
        $scope.status = status;
    });

  };

  //TAKES PARAMETERS FROM URL AND RUNS IMG DIFF TEST
  $scope.runUrlConfig = function(params){
    //console.log(params);
    $scope.testPairs.push(new testPairObj('../'+params.a, '../'+params.b, null));
    $scope.compareTestPair($scope.testPairs[0]);
  };

  //READS CONFIG FROM FILE AND RUNS IMG DIFF TEST
  $scope.runFileConfig = function(params){
    $http.get('./config.json')
      .success(function(data, status) {
        var rawDirectoriesList = [];
        // console.log('got data!',status,data);
        data.testPairs.forEach(function(o,i,a){
          // collect scenario urls
          rawDirectoriesList.push(o.scenario);
          $scope.testPairs.push(new testPairObj('../'+o.local_reference, '../'+o.local_test, '../'+o.local_diff, o, o.local_testStatus));
        });
        $scope.displayTestPairs($scope.testPairs);
        //$scope.compareTestPairs($scope.testPairs);
        
        // send raw rawDirectoriesList to get back directories data
        // for use in the input filter
        $scope.directories = Directories.query(rawDirectoriesList);

      })
      .error(function(data, status) {
        console.log('config file operation failed '+status);
      });
  };


  // JUST DISPLAYS THE TEST DATA
  // TODO: This is just copied from compareTestPairs, simplify
  $scope.displayTestPairs = function displayTestPairs(testPairs){

    // reset
    $scope.passedCount = 0;
    $scope.failedCount = 0;
    $scope.blessedCount = 0; 
    $scope.testPairsCompleted = 0;
    var startTs = new Date();

    async.eachLimit(
      testPairs
      ,1
      ,function(testPair,cb){
        $scope.displayTestPair(testPair,function(o){
          console.info('o: ', o); //wf
          if (o.passed) {
            $scope.passedCount++;
          }
          if (o.testStatus === 'blessed') {
            $scope.blessedCount++;
          }
          $scope.testPairsCompleted++;
          $scope.testDuration = (new Date()-startTs);
          //$scope.$digest();
          cb();
        });
      }
    );
    // if we are not running the comparison client-side,
    // no need for time info
    $displayMode = true;
    $scope.testIsRunning = false;
  };


  //LOOPS THROUGH TEST PAIR CONFIG AND CALLS compareTestPair(testPair) ON EACH ONE
  $scope.compareTestPairs = function compareTestPairs(testPairs){
    var startTs = new Date();

    async.eachLimit(
      testPairs
      ,1
      ,function(testPair,cb){
        $scope.compareTestPair(testPair,function(o){
          if(o.passed)$scope.passedCount++;
          $scope.testPairsCompleted++;
          $scope.testDuration = (new Date()-startTs);
          $scope.$digest();
          cb();
        });
      }
      ,function(){
        $scope.testIsRunning = false;
        if($scope.passedCount == $scope.testPairsCompleted)
          $scope.statusFilter='passed';
        else
          $scope.statusFilter='failed';
        $scope.$digest();
      }
    );



  };

  // JUST DISPLAY INDIVIDUAL testPair OBJECT (does not call resemble to save time)
  $scope.displayTestPair = function compareTestPair(testPair,cb){
    testPair.processing=false;
    // set passed based on testStatus
    testPair.passed = testPair.testStatus === 'pass' ? true : false;
    testPair.blessed = testPair.testStatus === 'blessed' ? true : false;
    if(cb)cb(testPair);
  };


  //TEST AN INDIVIDUAL testPair OBJECT.  UPDATES THE OBJECT WITH RESULTS AND THEN RETURNS THE OBJECT WITH THE CALLBACK
  $scope.compareTestPair = function compareTestPair(testPair,cb){
    testPair.processing=true;

    resemble.outputSettings(resembleTestConfig);

    var diff = resemble(testPair.a.src).compareTo(testPair.b.src).onComplete(function(diffData){
      testPair.report = JSON.stringify(diffData,null,2);
      testPair.c.src = diffData.getImageDataUrl();
      testPair.processing=false;
      testPair.passed=(diffData.isSameDimensions && diffData.misMatchPercentage<testPair.meta.misMatchThreshold)?true:false;
      if(cb)cb(testPair);
    });
  };//scope.compareTestPair()


  // initially no one is scrolling
  $scope.anchoring = false;

  // this is angular's way to allow in page anchor links
  $scope.scrollTo = function (id) {
    // when this is true you are in anchor clicking mode
    // the routes to do comparison should be done
    $scope.anchoring = true;
    if (id.indexOf('.png') > 0) {
      id = id.slice(0, -4);
    }
    $location.hash(id);
    $anchorScroll();
  }

  $scope.selection = [];
  $scope.toggleSelection = function toggleSelection(name) {
    var idx = $scope.selection.indexOf(name);

    // is currently selected
    if (idx > -1) {
      $scope.selection.splice(idx, 1);
    }

    // is newly selected
    else {
      $scope.selection.push(name);
    }

    var selections = $scope.selection.map(function(n) {
      return $filter('testTitle')(n);
    });

    $scope.gulpCommand = '$ gulp backstop --baseline --name=' + selections.join(',');
  };

  $scope.handleToggleAll = function(filtered) {
    if(filtered) {
      console.info('filtered.length: ', filtered.length); //wf
      console.info('$scope.selection.length: ', $scope.selection.length); //wf  
    }
  };

  $scope.toggleAllViewable = function(filtered, allToggled) {
    if ($scope.selection.length && !allToggled) {
      $scope.selection = [];
    } else {
      for (var i = 0; i < filtered.length; i++) {
        if($scope.selection.indexOf(filtered[i].meta.selector) === -1) {
          $scope.selection.push(filtered[i].meta.selector)
        }
      }
    }


    var selections = $scope.selection.map(function(n) {
      return $filter('testTitle')(n);
    });

    $scope.testNames = selections.join(',');
    $scope.gulpCommand = '$ gulp backstop --baseline --name=' + $scope.testNames;
  };

  $scope.bless = function(image, index) {
    var toBless = $scope.testPairs[index].blessed;
    $http({
        url: '/baseline',
        method: 'POST',
        data: {
               'toBless' : toBless,
               'blessed' : image,
               'index': index
              }
    }).success(function(data, status, headers, config) {
        var testPairToUpdate = $scope.testPairs[data.testPairToUpdate];
        console.log(data);
        if (toBless) {
          testPairToUpdate.testStatus = 'blessed';
          $scope.blessedCount++;
          console.info('$scope.blessedCount: ', $scope.blessedCount); //wf
        } else {
          testPairToUpdate.testStatus = 'fail';
          $scope.blessedCount--;
        }
        //testPairToUpdate.passed = true;
        //$scope.passedCount++;
        //$scope.msg = TODO;
    }).error(function(data, status, headers, config) {
        $scope.status = status;
    });

  };

  // TODO: this is so wrong, should be a directive
  // TODO: Add toggle to remove
  $scope.slideDiff = function(selector, state) {
    var $selector = $(selector);
    if (!$selector.hasClass('twentytwenty-container')) {
      $(selector).twentytwenty();
    }
  }

  $scope.viewports = ['SMALL', 'MEDIUM', 'LARGE'];

  $scope.includeViewport = function(viewport) {
    var i = $.inArray(viewport, $scope.viewports);
    if (i > -1) {
        $scope.viewports.splice(i, 1);
    } else {
        $scope.viewports.push(viewport);
    }
  };

  $scope.viewportFilter = function(viewport) {
    if ($scope.viewports.length > 0) {
      if ($.inArray(viewport.meta.viewport, $scope.viewports) < 0)
          return;
      }
    return viewport;
  };

});
