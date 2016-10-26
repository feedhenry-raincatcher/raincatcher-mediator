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
, require('raincatcher-mediator')
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
mediator = require('raincatcher-mediator/lib/mediator')
```
