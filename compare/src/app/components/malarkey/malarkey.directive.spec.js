/**
 * @todo Complete the test
 * This example is not perfect.
 * The `link` function is not tested.
 * (malarkey usage, addClass, $watch, $destroy)
 */
describe('directive malarkey', function() {
  let vm;
  let element;
  let sandbox;

  beforeEach(angular.mock.module('compare'));

  beforeEach(inject(($compile, $rootScope, githubContributor, $q) => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(githubContributor, 'getContributors', function() {
      return $q.when([{}, {}, {}, {}, {}, {}]);
    });

    element = angular.element(`
      <acme-malarkey extra-values="['Poney', 'Monkey']"></acme-malarkey>
    `);

    $compile(element)($rootScope.$new());
    $rootScope.$digest();
    vm = element.isolateScope().vm;

  }));

  afterEach(function() {
    sandbox.restore();
  });

  it('should be compiled', () => {
    expect(element.html()).not.to.equal(null);
  });

  it('should have isolate scope object with instanciate members', () => {
    expect(vm).to.be.an('object');
    expect(vm.contributors).to.be.an('array');
    expect(vm.contributors.length).to.equal(6);
  });

  it('should log a info', inject($log => {
    expect($log.info.logs[0][0]).to.contain('Activated Contributors View');
  }));
});
