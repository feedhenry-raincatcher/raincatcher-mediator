import * as angular from 'angular';
import mediator = require('../mediator');

angular.module('wfm.core.mediator', ['ng'])

.factory('mediator', function mediatorService($q: angular.IQService) {
  let originalRequest = mediator.request;

  // monkey patch the request function, wrapping the returned promise as an angular promise
  mediator.request = function() {
    let promise = originalRequest.apply(mediator, arguments);
    return $q.when(promise);
  };

  mediator.subscribeForScope = function(topic, scope, fn) {
    let subscriber = mediator.subscribe(topic, fn);
    scope.$on('$destroy', function() {
      mediator.remove(topic, subscriber.id);
    });
    return subscriber;
  };

  return mediator;
});

export default 'wfm.core.mediator';
