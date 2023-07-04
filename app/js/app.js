/* global angular, PIXI, colors */

'use strict';

var app = angular.module(
  'thegame',
  [
    'ui.router',
    'ui.bootstrap',
    'ngjsColorPicker',
    'ngStorage'
  ]
);

window['app'] = app;

app.config(['$locationProvider', '$urlRouterProvider', function ($locationProvider, $urlRouterProvider) {
  $locationProvider.hashPrefix('!');
  $urlRouterProvider.otherwise('/');
}]);

app.run(['$rootScope', '$state', '$window', '$uibModal', '$localStorage', 'config', 'game', function ($rootScope, $state, $window, $uibModal, $localStorage, config, game) {
  function onResize() {
    var width = $window.innerWidth;
    var height = $window.innerHeight;
    game.resize(width, height);
    $rootScope['pixiRenderer'].resize(width, height);
    $rootScope['pixi'].hitArea = new PIXI.Rectangle(0, 0, width, height);
  }
  angular.element($window).bind('resize', onResize);

//  var stopped = 1;
  var startDialog;
  function toggleStartDialog() {
    if (startDialog) {
      startDialog['dismiss']('cancel');
//      --stopped;
//      game.stop(!!stopped);
      return;
    }
//    ++stopped;
//    game.stop(!!stopped);
    $rootScope['keyDown'] = dialogKeyDown;
    startDialog = $uibModal.open({
      'animation': true,
      'templateUrl': 'startDialog.html',
      'controller': 'startDialogCtrl',
      'size': 'sm',
      'keyboard': false
    });
    startDialog['result']['then'](function (options) {
      $rootScope['keyDown'] = keyDown;
      startDialog = null;
      if (options.action == 'play') {
        game.actionPlay(options['name'], colors.indexOf(parseInt(options.color.substring(1), 16)));
        $state.go('play');
      } else {
        game.actionSpectate(0);
        $state.go('spectate');
      }
    }, function () {
      $rootScope['keyDown'] = keyDown;
      startDialog = null;
    });
  }

  $rootScope['pixiInitHandler'] = function () {
    onResize();
    $rootScope['pixiRenderer'].backgroundColor = config['bgcolor'];
    var pixi = $rootScope['pixi'];
    pixi.interactive = true;
    pixi.on('mousedown', function (mouse) {
      var event = mouse.data.originalEvent;
      if (event.ctrlKey) {
        game.paint(mouse.data.global);
      }
    });
    pixi.on('mousemove', function (mouse) {
//      if (!stopped) {
      game.setMousePosition(mouse.data.global);
//      }
    });
// TODO: розібратись чому не працює в мінімізованому вигляді
//    pixi.on('mouseover', function (mouse) {
//      --stopped;
//      game.stop(!!stopped);
//      game.setMousePosition(false);
//    });
//    pixi.on('mouseout', function (mouse) {
//      ++stopped;
//      game.stop(!!stopped);
//      game.setMousePosition(true);
//    });
    game.setDisplayContainer(pixi);
  };

  $rootScope['pixiRenderHandler'] = function () {
    game.update();
    return true;
  };

  $rootScope['chatHistory'] = [];
  $rootScope['chatInput'] = '';
  $rootScope['chatMode'] = false;
  $rootScope['toggleChat'] = function () {
    $rootScope['chatMode'] = !$rootScope['chatMode'];
    if ($rootScope['chatMode']) {
      setTimeout(function() {
        document.getElementById('chat-input').focus();
      }, 50);
//      ++stopped;
    } else {
//      --stopped;
    }
//    game.stop(!!stopped);
  };
  $rootScope['chatMessages'] = [];
  $rootScope['closeMessage'] = function (index) {
    $rootScope['chatMessages'].splice(index, 1);
  };

  function keyUp(event) {
    if (!event.ctrlKey) {
      game.setMousePosition(false);
    }
  }

  function keyDown(event) {
    if (event.repeat) {
      return;
    }
    if (event.ctrlKey) {
      game.setMousePosition(true);
    }
    var keyCode = event.keyCode;
    if (keyCode == 13) {
      if ($rootScope['chatMode']) {
        var text = $rootScope['chatInput'];
        if (text.length > 0) {
          game.chatMessage(text);
          $rootScope['chatInput'] = '';
        }
      }
      $rootScope['toggleChat']();
      return;
    }
    if ($rootScope['chatMode']) {
      if (keyCode == 27) {
        $rootScope['toggleChat']();
      }
      return;
    }
    if (keyCode == 27) {
      toggleStartDialog();
    } else if (keyCode == 32) {
      game.actionSplit($rootScope['pixiInteractionManager'].mouse.global);
    } else if (keyCode == 48) {
      game.resetScale();
    } else if (keyCode == 81 || keyCode == 87) {
      game.actionEject($rootScope['pixiInteractionManager'].mouse.global);
    } else if (keyCode == 187) {
      game.incScale();
    } else if (keyCode == 189) {
      game.decScale();
    }
  }

  function dialogKeyDown(event) {
    if (event.repeat) {
      return;
    }
    var keyCode = event.keyCode;
    if (keyCode == 27) {
      toggleStartDialog();
    }
  }

  $rootScope['keyUp'] = keyUp;
  $rootScope['keyDown'] = keyDown;
  $rootScope['pixiOptions'] = {
    'transparent': false,
    'antialias': true
  };

  game.onPlay = function () {
    $rootScope.$apply(function() {
      $rootScope['playStatus'] = false;
    });
  };
  game.onSpectate = function () {
    $rootScope.$apply(function() {
      $rootScope['playStatus'] = true;
    });
  };
  game.onFinish = function () {
    $rootScope.$apply(function() {
      $rootScope['playStatus'] = true;
      toggleStartDialog();
    });
  };
  game.onConnectionLoss = function () {
    if (startDialog) {
      startDialog['dismiss']('cancel');
    }
    var modalInstance = $uibModal.open({
      'animation': true,
      'templateUrl': 'connectionLossDialog.html',
      'controller': 'connectionLossDialogCtrl',
      'size': 'sm',
      'keyboard': false
    });
    modalInstance['result']['then'](function (options) {
      game.startConnection(config['server']);
    }, function () {
    });
  };

  game.startConnection(config['server']);
}]);

app.controller('startDialogCtrl', ['$scope', '$state', '$uibModalInstance', '$localStorage', function ($scope, $state, $uibModalInstance, $localStorage) {
  $scope['name'] = $localStorage['name'];
  $scope['color'] = $localStorage['color'];
  $scope['colorPickerOptions'] = {
    'columns': 4,
    'roundCorners': true
  };
  $scope['play'] = function () {
    $localStorage['name'] = $scope['name'];
    $localStorage['color'] = $scope['color'];
    $uibModalInstance.close({action: 'play', name: $scope['name'], color: $scope['color']});
  };
  $scope['spectate'] = function () {
    $uibModalInstance.close({action: 'spectate'});
  };
  $scope['settings'] = function () {
    $uibModalInstance['dismiss']('cancel');
    $state.go('settings');
  };
}]);

app.controller('connectionLossDialogCtrl', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
  $scope['ok'] = function () {
    $uibModalInstance.close();
  };
}]);

app.controller('chatHistoryCtrl', function () {
});
