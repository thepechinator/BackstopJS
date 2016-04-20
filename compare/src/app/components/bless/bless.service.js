// if toBless is true, sends the test screenshot to the backend
// the backend sets the test status to 'blessed'
// if toBless is false, the backend sets the test status back to 'fail'
export class BlessService {
    constructor($http, $log) {
        'ngInject';
        this.$http = $http;
        this.$log = $log;
    }

    blessScreenshot(screenshot) {
        return this.$http({
            method: 'POST',
            url: '/baseline',
            data: {
                'toBless' : true,
                'blessedId' : 'bitmaps_test/20160418-130025/mocks_pages_editorial_article-rail_html_0_--data-test-name--editorial-article-rail--_0_SMALL.png'
            }
        })
        .then((response) => {
            return {
                toBless: response.data.toBless,
                blessedId: response.data.blessedId
            }
        })
        .catch((error) => {
            this.$log.error('XHR Failed for blessScreenshot.\n' + angular.toJson(error.data, true));
        });
    }
}
