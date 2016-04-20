export function ScreenshotDetailsDirective() {
  'ngInject';

  let directive = {
    restrict: 'EA',
    templateUrl: 'app/components/screenshotDetails/screenshotDetails.html',
/*    scope: {
        creationDate: '='
    },*/
    controller: screenshotDetailsController,
    controllerAs: 'vm',
    bindToController: true
  };

  return directive;
}

class screenshotDetailsController {
  constructor () {
    'ngInject';

    // "this.creationDate" is available by directive option "bindToController: true"
    //this.relativeDate = moment(this.creationDate).fromNow();
  }
}
