var compareApp = angular.module('compareApp', ['ngRoute']);


compareApp.config( function( $routeProvider ){
  $routeProvider
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
      return input.split('/mocks/pages')[1];
    }
  }
});

compareApp.directive('testResultSummary', function() {
  return {
    restrict: 'EA',
    templateUrl: 'js/views/test-result-summary.html'
  }
});

compareApp.controller('MainCtrl', function ($scope, $route, $routeParams, $q, $http, $filter, $location, $anchorScroll) {

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
  $scope.testDuration = 0;
  $scope.testIsRunning = true;


  $scope.detailFilterOptions = ['failed','passed','all','none'];
  $scope.statusFilter = 'none';

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
    this.meta = o;
    this.meta.misMatchThreshold = (o && o.misMatchThreshold && o.misMatchThreshold >= 0) ? o.misMatchThreshold : defaultMisMatchThreshold;
    this.testStatus = testStatus;
  };

  $scope.$on("$routeChangeSuccess", function( $currentRoute, $previousRoute ){
    $scope.params = JSON.stringify($routeParams,null,2);
    $scope.action = $route.current.action;
    // run the route based commands if not simply clicking an anchor link
    // wonder why we have to tie diff test stuff to the route?
    if(!$scope.anchoring) {
      if($scope.action=='url') {
        $scope.runUrlConfig($routeParams);
      }
      else {
        $scope.runFileConfig($routeParams);
      }
    }


  });


  //TAKES PARAMETERS FROM URL AND RUNS IMG DIFF TEST
  $scope.runUrlConfig = function(params){
    console.log(params);
    $scope.testPairs.push(new testPairObj('../'+params.a, '../'+params.b, null));
    $scope.compareTestPair($scope.testPairs[0]);
  };

  //READS CONFIG FROM FILE AND RUNS IMG DIFF TEST
  $scope.runFileConfig = function(params){
    $http.get('./config.json')
      .success(function(data, status) {
        // console.log('got data!',status,data);
        data.testPairs.forEach(function(o,i,a){
          $scope.testPairs.push(new testPairObj('../'+o.local_reference, '../'+o.local_test, '../'+o.local_diff, o, o.local_testStatus));
        });
        $scope.displayTestPairs($scope.testPairs);
        //$scope.compareTestPairs($scope.testPairs);

      })
      .error(function(data, status) {
        console.log('config file operation failed '+status);
      });
  };


  // JUST DISPLAYS THE TEST DATA
  // TODO: This is just copied from compareTestPairs, simplify
  $scope.displayTestPairs = function displayTestPairs(testPairs){
    var startTs = new Date();

    async.eachLimit(
      testPairs
      ,1
      ,function(testPair,cb){
        $scope.displayTestPair(testPair,function(o){
          if(o.passed)$scope.passedCount++;
          $scope.testPairsCompleted++;
          $scope.testDuration = (new Date()-startTs);
          //$scope.$digest();
          cb();
        });
      }
      ,function(){
        $scope.testIsRunning = false;
        if($scope.passedCount == $scope.testPairsCompleted)
          $scope.statusFilter='passed';
        else
          $scope.statusFilter='failed';
        //$scope.$digest();
      }
    );
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
    testPair.passed=testPair.testStatus === 'fail' ? false : true;
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


});
