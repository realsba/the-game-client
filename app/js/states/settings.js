/* global app */

app.config(["$stateProvider", function ($stateProvider) {
  $stateProvider.state('settings', {
    url: '/settings',
    templateUrl: 'views/settings.html',
    controller: function () {
    }
  });
}]);
