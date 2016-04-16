describe('testResults service', () => {

    beforeEach(angular.mock.module('compare'));

    it('should be registered', inject(testResults => {
        expect(testResults).to.not.equal(null);
    }));

    it('should fetch the test results config.json file', inject((testResults, $httpBackend) => {
        $httpBackend.when('GET', './compare/config.json').respond(200, []);
        let results;
        testResults.query().then((data) => {
            results = data;
        });
        $httpBackend.flush();
        expect(results).to.be.an('array');
    }));

    it('should log a error', inject((testResults, $httpBackend, $log) => {
        $httpBackend.when('GET', './compare/config.json').respond(500);
        testResults.query();
        $httpBackend.flush();
        expect($log.error.logs[0][0]).to.include('operation failed at config file');
    }));

});
