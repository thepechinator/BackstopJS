export function routerConfig ($routeProvider) {
  'ngInject';
  $routeProvider
    .when('/', {
      templateUrl: 'app/main/main.html',
      controller: 'MainController',
      controllerAs: 'main'
    })
    .when('/runtest/:testName', {
      templateUrl: 'app/runTest/runTest.html',
      controller: 'RunTestController',
      controllerAs: 'runTest'
    })
    .otherwise({
      redirectTo: '/'
    });
}
