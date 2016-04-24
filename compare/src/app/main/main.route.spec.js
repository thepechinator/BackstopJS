describe('main page', () => {
    let state;
    let rootScope;

    beforeEach(angular.mock.module('compare'));

    beforeEach(inject(($rootScope, $state) => {
        state = $state;
        rootScope = $rootScope;
    }));

    it('should have home state with right controller and template', function () {
        state.go('home');
        rootScope.$digest();
        expect(state.current.name).to.equal('home');
        expect(state.current.controller).to.equal('MainController');
        expect(state.current.templateUrl).to.equal('app/main/main.html');
    });

    it('should have status parameter ', inject(($location, $stateParams) => {
        $location.path('/blessed');
        rootScope.$digest();
        expect($stateParams.status).to.equal('blessed');
    }));
});
