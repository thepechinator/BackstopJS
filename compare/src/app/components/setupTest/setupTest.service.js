// sends the test name to kickoff the testing process
export class SetupTestService {
    constructor($log, $http, $window, $rootScope) {
        'ngInject';
        this.$http = $http;
        this.$log = $log;
        this.$window = $window;
        this.$rootScope = $rootScope;
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
                return {
                    testNameSent: response.data,
                    streamRequested: this.startTest()
                }
            })
            .catch((error) => {
                this.$log.error('XHR Failed for sendTest.\n' + angular.toJson(error.data, true));
            });
    }

    startTest() {
        let testOutputStream = new EventSource('http://' + this.$window.location.hostname + ':3033/backstop');

        testOutputStream.onmessage = e => {
            this.$rootScope.$broadcast('stream', e.data);
        }

        testOutputStream.addEventListener('done', () => {
            testOutputStream.close();
            this.$rootScope.$broadcast('testCompleted', 'done');
        }, false);

        return true;
    }
}