/* global app, PIXI */

'use strict';

app.directive('pixi', ["$parse", function ($parse) {
  return {
    restrict: 'A',
    scope: false,
    controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
      var containerAttr = $parse($attrs['pixi'] || 'pixi');
      var container = containerAttr($scope);
      if (!container) {
        container = new PIXI.Container();
        containerAttr.assign($scope, container);
      }

      var width = $scope.$eval($attrs['pixiWidth'] || 'pixiWidth');
      var height = $scope.$eval($attrs['pixiHeight'] || 'pixiHeight');
      var renderHandler = $scope.$eval($attrs['pixiRenderHandler'] || 'pixiRenderHandler');
      var initHandler = $scope.$eval($attrs['pixiInitHandler'] || 'pixiInitHandler');
      var rendererType = $scope.$eval($attrs['pixiRendererType'] || 'pixiRendererType');
      var options = $scope.$eval($attrs['pixiOptions'] || 'pixiOptions');

      var renderer;
      switch (rendererType) {
        case 'canvas':
          renderer = new PIXI.CanvasRenderer(width, height, options);
          break;
        case 'webgl':
          try {
            renderer = new PIXI.WebGLRenderer(width, height, options);
          } catch (e) {
            $scope.$emit('pixi.webgl.init.exception', e);
            return;
          }
          break;
        default:
          rendererType = 'auto';
          renderer = PIXI.autoDetectRenderer(width, height, options);
      }

      $element[0].appendChild(renderer.view);

      var rendererAttr = $parse($attrs['pixiRenderer'] || 'pixiRenderer');
      rendererAttr.assign($scope, renderer);

      var interactionManagerAttr = $parse($attrs['pixiInteractionManager'] || 'pixiInteractionManager');
      interactionManagerAttr.assign($scope, renderer.plugins.interaction);

      function renderLoop() {
        var doRender = true;
        if (renderHandler) {
          doRender = renderHandler(container, renderer);
        }
        if (doRender) {
          renderer.render(container);
        }
        requestAnimationFrame(renderLoop);
      }

      if (initHandler) {
        initHandler();
      }

      renderLoop();
    }]
  };
}]);