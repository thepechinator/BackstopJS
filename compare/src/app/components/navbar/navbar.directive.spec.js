/**
 * @todo Complete the test
 * This example is not perfect.
 * Test should check if MomentJS have been called
 */
describe('directive navbar', function() {
  let vm;
  let element;
  let timeInMs;

  beforeEach(angular.mock.module('compare'));

  beforeEach(inject(($compile, $rootScope) => {
    const currentDate = new Date();
    timeInMs = currentDate.setHours(currentDate.getHours() - 24);

    element = angular.element(`
      <acme-navbar creation-date="${timeInMs}"></acme-navbar>
    `);

    $compile(element)($rootScope.$new());
    $rootScope.$digest();
    vm = element.isolateScope().vm;
  }));

  it('should be compiled', () => {
    expect(element.html()).not.to.equal(null);
  });

  it('should have isolate scope object with instanciate members', () => {
    expect(vm).to.be.an('object');

    expect(vm.creationDate).to.be.a('number');
    expect(vm.creationDate).to.equal(timeInMs);

    expect(vm.relativeDate).to.be.a('string');
    expect(vm.relativeDate).to.equal('a day ago');
  });
});
