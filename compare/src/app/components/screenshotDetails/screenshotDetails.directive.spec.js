describe('directive screenshotDetails', function() {

  let element;

  beforeEach(angular.mock.module('compare'));

  beforeEach(inject(($compile, $rootScope) => {
    element = angular.element(`
      <screenshot-details></screenshot-details>
    `);
    $compile(element)($rootScope.$new());
    $rootScope.$digest();
  }));

  it('should be compiled', () => {
    expect(element.html()).not.to.equal(null);
  });

});
