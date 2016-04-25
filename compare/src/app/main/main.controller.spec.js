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
      return $q.when({
        "testPairs" : [
          {
            "test": "mock_screenshot_example_A",
            "local_testStatus": 'fail'
          },
          {
            "test": "mock_screenshot_example_B",
            "local_testStatus": 'fail'
          },
          {
            "test": "mock_screenshot_example_C",
            "local_testStatus": 'fail'
          }
        ]
      });
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
    expect(vm.testResults).to.be.an('object');
    expect(vm.testResults.testPairs).to.be.an('array');
    expect(vm.testResults.testPairs.length).to.equal(3);
  });

  it('should scroll page to anchor ', inject($location => {
    $location.hash('test');
    vm.gotoAnchor('test');
    expect($location.hash()).to.equal('test');
  }));

  it('should scroll page to anchor if list item is clicked', inject($location => {
    $location.hash('test');
    vm.gotoAnchor('test');
    expect($location.hash()).to.equal('test');
    $location.hash('something else');
    vm.gotoAnchor('test');
    expect($location.hash()).to.equal('test');
  }));

  describe('when setting a filter', () => {

    it('should filter by status', () => {
      expect(vm.checkStatus('blessed', true)).to.be.true;
      expect(vm.checkStatus('blessed', false)).to.be.false;
    });

    it('should default to filtering by "fail"', () => {
      expect(vm.statusFilter).to.equal('fail');
    });

    it('should be able to filter by all', () => {
      vm.statusFilter = 'all';
      expect(vm.checkStatus()).to.be.true;
    });

    it('should filter by specified filter', () => {
      vm.statusFilter = 'a-specific-filter';
      expect(vm.checkStatus('a-specific-filter')).to.be.true;
    });

    it('should filter by the "status" state parameter if specified in url', inject(($controller) => {
      vm = $controller('MainController', {$stateParams: {status: 'all'}});
      expect(vm.statusFilter).to.equal('all');
    }));

    it('should have the correct status options available to filter', () => {
      vm.statusFilterOptions = ['all','blessed','fail','pass'];
    });
  });
  
  describe('when blessing or unblessing a screenshot', () => {
    it('should toggle status of screenshot between blessed and fail', () => {
      expect(vm.testResults.testPairs[1].local_testStatus).to.equal('fail');
      vm.blessScreenshot('blessed', 'mock_screenshot_example_B');
      expect(vm.testResults.testPairs[1].local_testStatus).to.equal('blessed');
      vm.blessScreenshot('fail', 'mock_screenshot_example_B');
      expect(vm.testResults.testPairs[1].local_testStatus).to.equal('fail');
    });

    it('should not affect the visibility of the screenshot in current view', () => {
      vm.blessScreenshot('blessed', vm.testResults.testPairs[1].test);
      expect(vm.testResults.testPairs[1].statusDirty).to.be.true;
      vm.setStatus('whatever');
      expect(vm.testResults.testPairs[1].statusDirty).to.be.false;
    });
  });

});

