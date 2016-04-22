describe('runTest controller', () => {
    let vm;
    let sandbox;
    
    beforeEach(angular.mock.module('compare'));

    beforeEach(inject((setupTest, $controller, $stateParams, $rootScope, $q) => {
        sandbox = sinon.sandbox.create();

        sandbox.stub(setupTest, 'sendTestName', () => {
            return $q.when({});
        });

        $stateParams.testName = 'a-test';
        vm = $controller('RunTestController');

        $rootScope.$digest();
    }));

    afterEach(function() {
        sandbox.restore();
    });

    it('should have access to a testName', () => {
        expect(vm.testName).to.exist;
    });

    it('should post test name to server', () => {
        expect(vm.status).to.equal('ok');
    });

    it('should stream output from server', () => {
        expect(vm.streamCalled).to.equal(true);
    });

    it('should redirect to main page', inject(($timeout, $state, $location) => {
        vm.completeTest($timeout, $state);
        expect($location.path()).to.equal('/');
    }));

});
