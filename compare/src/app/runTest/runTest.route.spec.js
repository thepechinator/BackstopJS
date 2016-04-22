describe('run test page', () => {
    let state;
    let rootScope;

    beforeEach(angular.mock.module('compare'));

    beforeEach(inject(($rootScope, $state) => {
        state = $state;
        rootScope = $rootScope;
    }));

    it('should have runtest state with right controller and template', function () {
        state.go('runTest');
        rootScope.$digest();
        expect(state.current.name).to.equal('runTest');
        expect(state.current.controller).to.equal('RunTestController');
        expect(state.current.templateUrl).to.equal('app/runTest/runTest.html');
    });
});
