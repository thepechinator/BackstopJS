describe('setupTest service', () => {

    beforeEach(angular.mock.module('compare'));

    it('should be registered', inject(setupTest => {
        expect(setupTest).to.not.equal(null);
    }));

    describe('send test name to server', () => {
        it('should make http request to server', inject((setupTest, $httpBackend) => {
            $httpBackend.when('POST', '/backstop-test-prep').respond(200, 'ok');
            let data;
            setupTest.sendTestName('a-test').then(function(status) {
                data = status;
            })
            $httpBackend.flush();
            expect(data).to.be.an('object');
            expect(data.testNameSent).to.equal('ok');
            expect(data.streamRequested).to.be.true;
        }));

        it('should log a error', inject((setupTest, $httpBackend, $log) => {
          $httpBackend.when('POST', '/backstop-test-prep').respond(500);
          setupTest.sendTestName('all-for-not');
          $httpBackend.flush();
          $log.info(setupTest);
          expect($log.error.logs[0][0]).to.include('XHR Failed for');
        }));
    });
});