// controls the view when a test is running
export class RunTestController {
    constructor ($stateParams, setupTest, $log, $rootScope, $state, $timeout) {
        'ngInject';
        this.$rootScope = $rootScope;
        this.$log = $log;
        // immediately send test name to server
        this.status = 'idle';
        this.stream = [];
        this.runTest(setupTest, $stateParams.testName);
        this.completeTest($timeout, $state);
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

    completeTest($timeout, $state) {
        this.$rootScope.$on('testCompleted', () => {
            $timeout(function() {  
                $state.go('home');
            });
        });
    }

}
