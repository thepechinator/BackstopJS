// if toBless is true, sends the test screenshot to the backend
// the backend sets the test status to 'blessed'
// if toBless is false, the backend sets the test status back to 'fail'
export class BlessService {
    constructor($http, $log) {
        'ngInject';
        this.$http = $http;
        this.$log = $log;
    }

    blessScreenshot(status, testScreenshot) {
        return this.$http({
            method: 'POST',
            url: '/baseline',
            data: {
                status : status,
                blessedId : testScreenshot
            }
        })
        .then((response) => {
            return {
                status: response.data.status,
                blessedId: response.data.blessedId
            }
        })
        .catch((error) => {
            this.$log.error('XHR Failed for blessScreenshot.\n' + angular.toJson(error.data, true));
        });
    }
}
