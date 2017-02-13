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

### `Topics` utilities

This module also provides a fluent, promise-based API for subscribing to convention and adhering to the request-response pattern used throughout the RainCatcher modules and available through `mediator#request`.
Namely if a `data:read` topic that is used to provide a feature such as reading data from a remote source asyncronously, the result of the operation is by convention published in the `done:data:read` topic, and if it results in an error, it is published to the `error:data:read` topic.

This utility module helps with enforcing the same namespace for a set of related topics without repeating string literals or constants, and adhering to the convention above. It is available under [`lib/topics`](./lib/topics/index.js) with jsdoc comments.

#### Example

```javascript
var mediator = require('fh-wfm-mediator');
var Topics = require('fh-wfm-mediator/lib/topics');

var topics = new Topics(mediator)
  .withPrefix('wfm')
  .withEntity('user')
  // This will subscribe to wfm:user:read
  // and publish results to done:wfm:user:read:{id}
  // and errors to error:wfm:user:read:{id}
  .on('read', function(id) {
    // will request to 'data:user:read'
    return this.mediator.request(['data', this.entity, 'read'].join(':'), id);
  })
  // If you do not return a Promise from the handler function,
  // you must manually publish the result to another topic so it can be consumed
  .on('delete', function(id) {
    var self = this;
    this.mediator.request(this.entity + ':delete', id).then(function() {
      self.mediator.publish('done:ui:user:deleted:' + id);
    }).catch(function(e) {
      self.mediator.publish('error:ui:user:deleted:' + id, e);
    });
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
})
```

## Usage in an node.js backend
Require the module to get an instance of the mediator.  Be sure to use that same instance throughout the application to maintain a single list of subscribers.

```javascript
mediator = require('fh-wfm-mediator/lib/mediator')
```

# NPM Publishing

This module is written in TypeScript, in order to publish it to npm as compiled JavaScript files along with TypeScript typings and source maps, run `npm run build` before `npm publish`.