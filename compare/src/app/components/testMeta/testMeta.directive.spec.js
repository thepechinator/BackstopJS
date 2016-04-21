describe('directive testMeta', function() {

  let element;

  beforeEach(angular.mock.module('compare'));

  beforeEach(inject(($compile, $rootScope) => {
    element = angular.element(`
      <div test-meta></div>
    `);
    $compile(element)($rootScope.$new());
    $rootScope.$digest();
  }));

  it('should be compiled', () => {
    expect(element.html()).not.to.equal(null);
  });

});
