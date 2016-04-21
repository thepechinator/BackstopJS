export class MainController {
  constructor ($log, $timeout, $anchorScroll, $location, webDevTec, toastr, testResults, bless) {
    'ngInject';

    this.$log = $log;
    this.$anchorScroll = $anchorScroll;
    this.$location = $location;
    this.awesomeThings = [];
    this.classAnimation = '';
    this.creationDate = 1460406430773;
    this.toastr = toastr;
    this.activate($timeout, webDevTec, testResults);
    this.testResults;
    this.bless = bless;
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
          testPair.local_testStatus = status;
          break;
        }
      }
      this.bless.blessScreenshot(status, testScreenshot).then(() => {
        // TODO: Put visual feedback indicatino here        
      });
      
  }
}
