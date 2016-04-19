export function TestMetaDirective() {
  'ngInject';

  let directive = {
    restrict: 'A',
    templateUrl: 'app/components/testMeta/testMeta.html',
/*    scope: {
        creationDate: '='
    },*/
    controller: TestMetaController,
    controllerAs: 'vm',
    bindToController: true
  };

  return directive;
}

class TestMetaController {
  constructor () {
    'ngInject';

    // "this.creationDate" is available by directive option "bindToController: true"
    //this.relativeDate = moment(this.creationDate).fromNow();
  }
}
