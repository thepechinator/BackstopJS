export class MainController {
  constructor ($log, $timeout, webDevTec, toastr, testResults) {
    'ngInject';

    this.$log = $log;
    this.awesomeThings = [];
    this.classAnimation = '';
    this.creationDate = 1460406430773;
    this.toastr = toastr;
    this.activate($timeout, webDevTec, testResults);
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
}
