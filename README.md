# FeedHenry RainCatcher mediator [![Build Status](https://travis-ci.org/feedhenry-raincatcher/raincatcher-mediator.png)](https://travis-ci.org/feedhenry-raincatcher/raincatcher-mediator)

An implementation of the mediator pattern for use with RainCatcher modules.

## API
| Method | Description |
| --- | --- |
| `mediator#publish( channel, [data] )` | Publish data to a channel |
| `mediator#subscribe( channel, callback )` | Subscribe to events in a channel |
| `mediator#remove( channel, [identifier] )` | Unsubscribe to events in a channel |
| `mediator#once( channel, callback )` | A one-time subscribtion to events in a channel |
| `mediator#promise( channel )` | A promise-based API for `mediator#once` |


### Subscription Callbacks

When passing a `callback` to a `mediator.subscribe` function, it is necessary to return a `Promise` if the operation is asynchronous or if the response from the subscriber is required.

```javascript
var mediator = require('fh-wfm-mediator');
var Promise = require('bluebird');

mediator.subscribe("wfm:topic", function(topicData) {

  return new Promise(function(resolve, reject) {
    doSomeAyncFunction(topicData, function(err, result){
      err ? reject(err) : resolve(result);
    });
  });

});

//The published topic will not resolve until all of the asynchronous subscribers have resolved / rejected
//The `result` is the resolved value of the highest priority subscriber.
mediator.publish("wfm:topic").then(function(result) {
  console.log("All of the subscribers have resolved.", result);
}).catch(function(err) {
  console.error("An error occurred when executing topic wfm:topic", err);
});

```

### `Topics` utilities

This module also provides a fluent, promise-based API for subscribing to convention and adhering to the request-response pattern used throughout the RainCatcher modules and available through `mediator#request`.

#### Example

```javascript
var mediator = require('fh-wfm-mediator');
var Topic = require('fh-wfm-mediator/lib/topics');

//A set of topics for saving user data
var userDataTopics = new Topic(mediator)
  .prefix('wfm:data')
  .entity('user')
  .on('read', function(id) {
    //asyncReadUser returns a Promise
    return asyncReadUser(id);
  }).on('update', function(userToUpdate) {
    //asyncReadUser returns a Promise
    return asyncUpdateUser(userToUpdate);
  });


new Topic(mediator)
  .prefix('wfm')
  .entity('user')
  // This will subscribe to wfm:user:read
  .on('read', function(id) {
    // will publish to 'wfm:user:data:read', which returns a Promise.
    return userDataTopics.publish('read', id).then(function(user) {
      //We have retrieved the user, we can apply any additional asynchronous operations we need when the resolving the user
      return readUserGroupInformation(user.id).then(function(groupInformation) {
        user.groupName = groupInformation.name;
        return user;
      });
    });
  })
  .on('update_location', function(id, location) {
    //If we don't want to wait for the subscribers to resolve, just return null.
    userDataTopics.publish('read', id).then(function(user) {
      //We have retrieved the user, we can apply any additional asynchronous operations we need when the resolving the user
      user.location = location;
      userDataTopics.publish('update', user);
    });

    return null;
  });


mediator.publish('wfm:user:read', "userid1234").then(function(user) {
  //All of the subscribers have resolved.
  console.log("User read with id " + user.id + " and group name " + user.groupName);
}).catch(function(err) {
  console.log("Error reading user information", err);
});
```

## Usage in an Angular.js client

### API

Besides the above operations, the current operations are available :

| Method | Description |
| --- | --- |
| `mediator#subscribeForScope( channel, scope, callback )` | Subscribe to events in a channel and unsubscribe when the scope is destroyed|

### Setup
This module is packaged in a CommonJS format, exporting the name of the Angular namespace.  The module can be included in an angular.js as follows:

```javascript
angular.module('app', [
, require('fh-wfm-mediator')
...
])
```

### Integration
Inject the `mediator` service to broadcast and subscribe to events

```javascript
.controller('MyController', function (mediator) {
  ...
}
```

## Usage in an node.js backend
Require the module to get an instance of the mediator.  Be sure to use that same instance throughout the application to maintain a single list of subscribers.

```javascript
mediator = require('fh-wfm-mediator/lib/mediator')
```
