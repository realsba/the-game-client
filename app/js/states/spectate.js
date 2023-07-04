/* global app */

app.config(["$stateProvider", function ($stateProvider) {
  $stateProvider.state('spectate', {
    url: '/spectate',
    templateUrl: 'views/spectate.html',
    controller: ["$scope", "game", function ($scope, game) {
      $scope['players'] = game.getPlayers();
      $scope['spectate'] = function (playerId) {
        game.actionSpectate(playerId);
      };
    }]
  });
}]);
