describe('run test page', () => {
    let route;

    beforeEach(angular.mock.module('compare'));

    beforeEach(inject($route => {
        route = $route;
    }));

    it('should have runtest route with right template and controller', function () {
        var runTestRoute = route.routes['/runtest/:testName'];
        expect(runTestRoute).to.be.defined;
        expect(runTestRoute.controller).to.equal('RunTestController');
        expect(runTestRoute.templateUrl).to.equal('app/runTest/runTest.html');
    });
});
