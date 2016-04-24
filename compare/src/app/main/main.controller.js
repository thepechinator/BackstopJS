export class MainController {
  constructor ($log, $timeout, $anchorScroll, $location, webDevTec, toastr, testResults, bless, $stateParams, $state) {
    'ngInject';

    this.$log = $log;
    this.$anchorScroll = $anchorScroll;
    this.$location = $location;
    this.$state = $state;
    this.awesomeThings = [];
    this.classAnimation = '';
    this.creationDate = 1460406430773;
    this.toastr = toastr;
    this.activate($timeout, webDevTec, testResults);
    this.testResults;
    this.bless = bless;

    // controls what test statuses show
    this.statusFilter = $stateParams.status || 'fail';
    this.statusFilterOptions = [
      'all',
      'blessed', 
      'fail',
      'pass'
    ];
  }

  activate($timeout, webDevTec, testResults) {
    this.getWebDevTec(webDevTec);
    $timeout(() => {
      this.classAnimation = 'rubberBand';
    }, 4000);
    this.getTestResults(testResults);
  }

  getWebDevTec(webDevTec) {
    this.awesomeThings = webDevTec.getTec();

    angular.forEach(this.awesomeThings, (awesomeThing) => {
      awesomeThing.rank = Math.random();
    });
  }

  showToastr() {
    this.toastr.info('Fork <a href="https://github.com/Swiip/generator-gulp-angular" target="_blank"><b>generator-gulp-angular</b></a>');
    this.classAnimation = '';
  }

  getTestResults(testResults) {
      testResults.query().then(response => {
        this.testResults = response;
      });
  }

  gotoAnchor(id) {
    if (this.$location.hash() !== id) {
      // set the $location.hash to id and scroll to it
      // $anchorScroll will automatically scroll to it
      this.$location.hash(id);
    } else {
      // call $anchorScroll() explicitly,
      // since $location.hash hasn't changed
      this.$anchorScroll();
    }
  }

  blessScreenshot(status, testScreenshot) {
      for(let testPair of this.testResults.testPairs) {
        if(testPair.test === testScreenshot) {
          // set statusDirty on this changed screenshot
          // it will tell checkStatus not to filter this hidden for ux purposes
          // ex. you are filtering by 'fail', when you bless a screenshot...
          //     if not handled, it would disappear b/c the collection is
          //     currently showing only fails
          testPair.statusDirty = true;
          testPair.local_testStatus = status;
          break;
        }
      }
      // store on server
      this.bless.blessScreenshot(status, testScreenshot).then(() => {
        // TODO: Put visual feedback indicatino here        
      });
      
  }

  setStatus(status) {
    // sets just the url (without reload)
    // available so url reflects state so that you can share it with others
    this.$state.go('home', {status: status}, {notify: false});
    // clear all dirty statuses, we have reset, we want to show what we are filtering
    for(let testPair of this.testResults.testPairs) {
      testPair.statusDirty = false;
    }
  }

  // this will show an item if we return true
  checkStatus(status, dirty) {
    // if statusDirty for this item (it was blessed or unblessed) keep it showing no matter what
    // you don't want the current collection the filter to all of a sudden hide it
    if(dirty || this.statusFilter === 'all' || status === this.statusFilter) {
      return true;
    }
    return false;
  } 
}
