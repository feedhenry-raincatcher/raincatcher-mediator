var ArrayStore;
try {
  ArrayStore = require('fh-wfm-simple-store/lib/array-store');
} catch (e) {
  console.error('ERROR: Please install the optionalDependencies to run this demo');
  process.exit(1);
}
var Topics = require('./index');

var mediator = require('../mediator');
var store = new ArrayStore('user');
var topics = new Topics(mediator);
store.init(require('../../test/fixtures.json')).then(setupTopics).then(runTopics);
function setupTopics() {
  topics.prefix('wfm:cloud')
  .entity('user')
  .on('create', store.create.bind(store))
  .on('read', store.read.bind(store))
  .on('update', store.update.bind(store))
  .on('list', store.list.bind(store))
  .on('delete', store.delete.bind(store));
}

function runTopics() {
  topics.request('read', 'rkX1fdSH')
   .then(console.log)
   .catch(console.error);

  topics.request('list')
    .then(items => items.map(i => i.username))
    .then(console.log)
    .catch(console.error);
}
