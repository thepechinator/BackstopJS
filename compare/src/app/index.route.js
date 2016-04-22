export function routerConfig ($stateProvider, $urlRouterProvider) {
  'ngInject';
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'app/main/main.html',
      controller: 'MainController',
      controllerAs: 'main'
    })
    .state('runTest', {
      url: '/runtest/:testName',
      templateUrl: 'app/runTest/runTest.html',
      controller: 'RunTestController',
      controllerAs: 'runTest'
    });
    
    $urlRouterProvider.otherwise('/');
}
