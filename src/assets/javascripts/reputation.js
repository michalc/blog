(function() {
  'use strict';

  var app = angular.module('reputation',['ngAnimate']);

  // Returns a notification with a cached value of results,
  // and then resolve with recent value
  app.factory('cacheNotification', function($window, $q, $rootScope) {
    return function() {
      var args = Array.prototype.slice.call(arguments, 2);
      if (!$window.sessionStorage) return func.apply(null, args);

      var deferred = $q.defer();
      var func = arguments[0];
      var baseKey = 'cache-notification-' + arguments[1];
      var cacheKey = baseKey + '-' + $window.JSON.stringify(args);
      var cached = $window.sessionStorage.getItem(cacheKey);

      if (cached !== null) {
        $rootScope.$evalAsync(function() {
          deferred.notify($window.JSON.parse(cached));
        });
      }

      func.apply(null, args).then(function(result) {
        $window.sessionStorage.setItem(cacheKey, $window.JSON.stringify(result));
        deferred.resolve(result);
      }, function(error) {
        $window.sessionStorage.removeItem(cacheKey);
        deferred.reject(error);
      });

      return deferred.promise;
    };
  });

  app.factory('stackexchange', function($http, $window, cacheNotification) {
    var base = 'http://api.stackexchange.com/2.1/';

    function get(path, site, key, extraParams) {
      var params = {
        site: site,
        key: key,
        pagesize: 10
      };
      angular.extend(params, extraParams || {});
      return $http({
        method: 'GET',
        url: base + path,
        params: params
      });
    };

    function getUserFromSE(userId, site, key) {
      return get('users/' + userId , site, key).then(function(results) {
        return results.data.items[0];
      });
    };

    function getUser(userId, site, key) {
      return cacheNotification(getUserFromSE, 'get-user', userId, site, key);
    };

    return {
      getUser: getUser
    };
  });

  app.directive('reputation', function($timeout, stackexchange) {
    return {
      template: '<span>' +
                  '<span ng-if="loaded" ng-class="{\'from-server\': !fromCache}">' +
                    '<a href="{{user.link}}"><i class="fa fa-stack-overflow"></i><span class="icon-link-text">{{user.reputation | number:0}}</span></a>' +
                  '</span>' +
                '</span>',
      controller: function($scope, $attrs) {
        var site = $attrs.site;
        var userId = $attrs.userId;
        var key = $attrs.key;
        $scope.fromCache = false;
        $scope.loaded = false;

        stackexchange.getUser(userId, site, key).then(function(user) {
          // Update of reputation from server deliberatly slightly
          // after display of cached results for less jarring UI
          return $timeout(function() {
            $scope.user = user;
            $scope.loaded = true;
          }, $scope.fromCache ? '1000': 0);
        }, null, function(cachedUser) {
          $scope.user = cachedUser;
          $scope.fromCache = true;
          $scope.loaded = true;
        });
      }
    };
  });

})();