function OnConfig($stateProvider, $locationProvider, $urlRouterProvider, $compileProvider) {
  'ngInject';

  if (process.env.NODE_ENV === 'production') {
    $compileProvider.debugInfoEnabled(false);
  }

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  $stateProvider
  .state('home',{
    url: '/home',
    controller: 'HomeCtrl as homeCtrl',
    templateUrl: 'main/home.html',
    title: 'home'
  })
  .state('maps',{
    url: '/maps',
    controller: 'MapsCtrl as maps',
    templateUrl: 'widgets/maps/mapsGenerator.html',
    title: '통계지도'
  });

  $urlRouterProvider.otherwise('/home');

}

export default OnConfig;
