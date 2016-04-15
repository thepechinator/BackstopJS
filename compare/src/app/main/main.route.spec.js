describe('main page', () => {
    let route;

    beforeEach(angular.mock.module('compare'));

    beforeEach(inject($route => {
        route = $route;
    }));

    it('should have home route with right template, controller and a resolve block', function () {
        var mainRoute = route.routes['/'];
        expect(mainRoute).to.not.be.undefined;
        expect(mainRoute.controller).to.equal('MainController');
        expect(mainRoute.templateUrl).to.equal('app/main/main.html');
    });
});
