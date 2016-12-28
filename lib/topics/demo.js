var ArrayStore;
try {
  ArrayStore = require('fh-wfm-simple-store/lib/array-store');
} catch (e) {
  console.error('ERROR: Please install the optionalDependencies to run this demo');
  process.exit(1);
}
const Topics = require('./index');
const mediator = require('../mediator');
const store = new ArrayStore('user');
const topics = new Topics(mediator);
const _ = require('lodash');
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
    .then(_.partialRight(_.map, 'username'))
    .then(console.log)
    .catch(console.error);
}
