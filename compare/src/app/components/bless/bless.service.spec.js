describe('bless service', () => {

    beforeEach(angular.mock.module('compare'));

    it('should be registered', inject(bless => {
        expect(bless).to.not.equal(null);
    }));

    describe('when bless a screenshot', () => {
        it('should make http request to server', inject((bless, $httpBackend) => {
            $httpBackend.when('POST', '/baseline').respond(200, {
                status: 'blessed',
                blessedId: 'test_mock'
            });
            let data;
            bless.blessScreenshot('blessed','screenshot').then(function(screenshot) {
                data = screenshot;
            })
            $httpBackend.flush();
            expect(data).to.be.an('object');
            expect(data.blessedId).to.equal('test_mock');
            expect(data.status).to.equal('blessed');
        }));

        it('should log a error', inject((bless, $httpBackend, $log) => {
            $httpBackend.when('POST', '/baseline').respond(500);
            bless.blessScreenshot('all-for-not');
            $httpBackend.flush();
            $log.info(bless);
            expect($log.error.logs[0][0]).to.include('XHR Failed for');
        }));
    });
});
