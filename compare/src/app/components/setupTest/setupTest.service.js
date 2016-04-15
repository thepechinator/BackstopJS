// sends the test name to kickoff the testing process
export class SetupTestService {
    constructor($log, $http) {
        'ngInject';
        this.$http = $http;
        this.$log = $log;
    }

    sendTestName(testName) {
        return this.$http({
                method: 'POST',
                url: '/backstop-test-prep',
                data: {
                    'test_name' : testName,
                    'baseline'  : false
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                this.$log.error('XHR Failed for sendTest.\n' + angular.toJson(error.data, true));
            });
    }
}