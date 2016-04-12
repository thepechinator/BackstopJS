describe('controllers', () => {
  let vm;
  let sandbox;
  let route;

  beforeEach(angular.mock.module('compare'));

  beforeEach(inject(($controller, $route, webDevTec, toastr) => {

    sandbox = sinon.sandbox.create();

    route = $route;

    sandbox.stub(webDevTec, 'getTec', function() {
      return [{}, {}, {}, {}, {}];
    });

    sandbox.stub(toastr, 'info', function() {
      return;
    });

    vm = $controller('MainController');

  }));
  
  afterEach(() => {
    sandbox.restore();
  });

  it('should have home route with right template, controller and a resolve block', function () {
    var mainRoute = route.routes['/'];
    expect(mainRoute).to.be.defined;
    expect(mainRoute.controller).to.equal('MainController');
    expect(mainRoute.templateUrl).to.equal('app/main/main.html');
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
});
