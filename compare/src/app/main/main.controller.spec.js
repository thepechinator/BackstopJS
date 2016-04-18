describe('main controller', () => {
  let vm;
  let sandbox;

  beforeEach(angular.mock.module('compare'));

  beforeEach(inject(($controller, $rootScope, webDevTec, toastr, testResults, $q) => {

    sandbox = sinon.sandbox.create();

    sandbox.stub(webDevTec, 'getTec', function() {
      return [{}, {}, {}, {}, {}];
    });

    sandbox.stub(testResults, 'query', function() {
      return $q.when([{}, {}, {}]);
    });

    sandbox.stub(toastr, 'info', function() {
      return;
    });

    vm = $controller('MainController');
    $rootScope.$digest();

  }));
  
  afterEach(() => {
    sandbox.restore();
  });
  
  it('should have a timestamp creation date', () => {
    expect(vm.creationDate).to.be.a('number');
  });

  it('should define animate class after delaying timeout', inject($timeout => {
    $timeout.flush();
    expect(vm.classAnimation).to.equal('rubberBand');
  }));

  it('should show a Toastr info and stop animation when invoke showToastr()', inject(toastr => {
    vm.showToastr();
    expect(toastr.info).to.have.been.called;
    expect(vm.classAnimation).to.equal('');
  }));

  it('should define more than 5 awesome things', () => {
    expect(angular.isArray(vm.awesomeThings)).to.be.ok;
    expect(vm.awesomeThings.length === 5).to.be.ok;
  });

  it('should define at least 3 testPairs', () => {
    //console.info('vm: ', JSON.stringify(vm, null, 2)); //wf
    expect(vm.testResults).to.be.an('array');
    expect(vm.testResults.length).to.equal(3);
  });

});
