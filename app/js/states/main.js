/* global app */

app.config(['$stateProvider', function ($stateProvider) {
  $stateProvider.state('main', {
    url: '/',
    controller: function () { }
  });
  $stateProvider.state('about', {
    url: '/about.html',
    templateUrl: 'views/about.html',
    controller: function () { }
  });
  $stateProvider.state('changelog', {
    url: '/changelog.html',
    templateUrl: 'views/changelog.html',
    controller: function () { }
  });
  $stateProvider.state('todo', {
    url: '/todo.html',
    templateUrl: 'views/todo.html',
    controller: function () { }
  });

}]);
