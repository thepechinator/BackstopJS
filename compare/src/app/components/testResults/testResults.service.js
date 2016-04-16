export class TestResultsService {
    constructor($http, $log) {
        'ngInject';
        this.$http = $http;
        this.$log = $log;
    }

    query() {
        return this.$http.get('./compare/config.json')
          .then((response) => {
            return response.data;
          })
          .catch((error) => {
            this.$log.error(`operation failed at config file: ${error.config.url}`);
          });
    }
}
