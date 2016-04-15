// controls the view when a test is running
export class RunTestController {
    constructor ($routeParams, setupTest, $log, $rootScope, $location, $timeout) {
        'ngInject';
        this.$rootScope = $rootScope;
        this.$log = $log;
        // immediately send test name to server
        this.status = 'idle';
        this.stream = [];
        this.runTest(setupTest, $routeParams.testName);
        this.completeTest($timeout, $location);
    }   

    runTest(setupTest, testName) {
        this.testName = testName;
        return setupTest.sendTestName(this.testName).then((data) => {
            this.$log.info(data);
            this.$rootScope.$on('stream', (event, args) => {
                this.stream.push(args);
                this.$rootScope.$apply();
            })
            this.status = 'ok';
            this.streamCalled = true;
        });
    }

    completeTest($timeout, $location) {
        this.$rootScope.$on('testCompleted', () => {
            $timeout(function() {  
                $location.path('/');
            });
        });
    }

}
