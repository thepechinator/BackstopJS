// controls the view when a test is running
export class RunTestController {
    constructor ($routeParams, setupTest, $log) {
        'ngInject';
        // immediately send test name to server
        this.sendTestName($log, setupTest, $routeParams.testName);
        this.status = 'idle';
    }

    sendTestName($log, setupTest, testName) {
        this.testName = testName;
        return setupTest.sendTestName(this.testName).then((data) => {
            $log.info(data);
            this.status = 'ok';
            return this.status;
        });
    }
}
