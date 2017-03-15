import * as Promise from 'bluebird';
import { assert } from 'chai';
import * as sinon from 'sinon';
import IErrorWithDataId from './IErrorWithDataId';
import mediator = require('../mediator');
import Topics = require('./index');

const PREFIX = 'wfm:cloud';
const ENTITY = 'user';

describe('Topics', function () {
  let topics: Topics;
  beforeEach(function() {
    topics = new Topics(mediator).prefix(PREFIX).entity(ENTITY);
  });
  afterEach(function() {
    topics.unsubscribeAll();
  });
  describe('#getTopic', function() {
    it('should return a namespaced topic', function() {
      assert.equal(topics.getTopic('create'), 'wfm:cloud:user:create');
    });
    it('should take an optional prefix', function() {
      assert.equal(topics.getTopic('create', 'done'), 'done:wfm:cloud:user:create');
    });

    it('should take an optional topic UID', function() {
      assert.equal(topics.getTopic('create', 'done', 'topicuid'), 'done:wfm:cloud:user:create:topicuid');
    });
  });

  describe('#on', function() {
    it('should subscribe to a namespaced topic', function(done) {
      topics.on('create', function(user) {
        assert.equal(user.id, 'trever');
        done();
      });
      mediator.publish(topics.getTopic('create'), {id: 'trever'});
    });

    it('should publish a done: event for a successful promise', function(done) {
      topics.on('create', function(user) {
        assert.equal(user.id, 'trever');
        return Promise.resolve(user);
      });
      topics.onDone('create:trever', function(user) {
        assert.equal(user.id, 'trever');
        done();
      });
      mediator.publish(topics.getTopic('create'), {id: 'trever'});
    });
    it('should use result.id as a uid for request calls', function(done) {
      topics.on('create', function(user) {
        assert.equal(user.id, 'trever');
        return Promise.resolve(user);
      });
      topics.onDone('create:trever', function(user) {
        assert.equal(user.id, 'trever');
        done();
      });
      mediator.publish(topics.getTopic('create'), {id: 'trever'});
    });
    it('should use result as a uid for request calls if result is a string', function(done) {
      topics.on('create', function(user) {
        assert.equal(user.id, 'trever');
        return Promise.resolve('trever');
      });
      topics.onDone('create:trever', function(name) {
        assert.equal(name, 'trever');
        done();
      });
      mediator.publish(topics.getTopic('create'), {id: 'trever'});
    });
    it('should publish an error: event for a unsuccessful promise', function(done) {
      topics.on('create', function() {
        return Promise.reject(new Error('kaboom'));
      });
      topics.onError('create', function(e) {
        assert.equal(e.message, 'kaboom');
        done();
      });
      mediator.publish(topics.getTopic('create'), {id: 'trever'});
    });
    it('should use error.id as a uid for request error calls', function(done) {
      topics.on('create', function() {
        let e: IErrorWithDataId = new Error('kaboom');
        // add metadata to error object
        e.id = 'trever';
        return Promise.reject(e);
      });
      topics.onError('create:trever', function(e) {
        assert.equal(e.message, 'kaboom');
        done();
      });
      mediator.publish(topics.getTopic('create'), {id: 'trever'});
    });
    it('should provide a context containing the prefix, entity, topic and mediator', function(done) {
      topics.on('create', function() {
        assert.equal(this.prefix, PREFIX);
        assert.equal(this.entity, ENTITY);
        assert.equal(this.topic, `${PREFIX}:${ENTITY}:create`);
        done();
      });
      mediator.publish(topics.getTopic('create'), {id: 'trever'});
    });
    it('should allow for async handlers that do not return anything', function(done) {
      let otherTopicSubscriber = sinon.spy();
      let sameTopicSubscriber = sinon.spy();

      topics.on('create', function() {
        setTimeout(function() {
          mediator.publish('some:other:topic', {id: 'trever'});
        }, 0);
      });
      mediator.subscribe('some:other:topic', otherTopicSubscriber);
      topics.onDone('create', sameTopicSubscriber);
      mediator.publish(topics.getTopic('create'));
      setTimeout(function() {
        sinon.assert.calledWith(otherTopicSubscriber, {id: 'trever'});
        sinon.assert.notCalled(sameTopicSubscriber);
        done();
      }, 2);
    });
  });

  describe('#onDone', function() {
    it('should subscribe to a namespaced done: topic', function(done) {
      topics.onDone('create', function(user) {
        assert.equal(user.id, 'trever');
        done();
      });
      mediator.publish(topics.getTopic('create', 'done'), {id: 'trever'});
    });
  });

  describe('#onError', function() {
    it('should subscribe to a namespaced error: topic', function(done) {
      topics.onError('create', function(e) {
        assert.equal(e.message, 'kaboom');
        done();
      });
      mediator.publish(topics.getTopic('create', 'error'), new Error('kaboom'));
    });
  });

  describe('#request', function() {
    it('should request a namespaced topic', function(done) {
      topics.on('find', function() {
        return {id: 'trever'};
      });
      topics.request('find', 'trever').then(function(user) {
        assert.equal(user.id, 'trever');
        done();
      });
    });
  });
});
