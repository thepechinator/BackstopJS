export function ScreenshotDetailsDirective() {
  'ngInject';

  let directive = {
    restrict: 'EA',
    templateUrl: 'app/components/screenshotDetails/screenshotDetails.html',
    controller: screenshotDetailsController,
    controllerAs: 'vm',
    bindToController: true
  };

  return directive;
}

class screenshotDetailsController {
  constructor () {
    'ngInject';
  }
}
