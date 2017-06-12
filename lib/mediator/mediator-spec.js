var mediator = require('./index');
var Mediator = mediator.Mediator;
var Promise = require('bluebird');
var assert = require('chai').assert;
var expect = require('chai').expect;
const CONSTANTS = require('../constants');

var sinon = require('sinon');
require('sinon-as-promised');

describe("Mediator", function() {
  var mediator;

  beforeEach(function() {
    mediator = new Mediator();
  });

  describe('#subscribe', function() {
    const TEST_CHANNEL = "test_channel";

    afterEach(function() {
      mediator.remove(TEST_CHANNEL);
    });

    it('Should call callback', function() {
      var subscribeCallback = sinon.spy();
      mediator.subscribe(TEST_CHANNEL, subscribeCallback);
      mediator.publish(TEST_CHANNEL, "my_data");
      sinon.assert.calledOnce(subscribeCallback);
      mediator.publish(TEST_CHANNEL, "another");
      sinon.assert.calledTwice(subscribeCallback);
    });

    it('Should accept args', function() {
      var subscribeCallback = sinon.stub();
      mediator.subscribe(TEST_CHANNEL, subscribeCallback);
      mediator.publish(TEST_CHANNEL, false);
      sinon.assert.calledOnce(subscribeCallback);
      sinon.assert.calledWith(subscribeCallback, false);
    });

    it('Should return args', function() {
      var subscribeCb = sinon.stub().returnsArg(0);
      var testNumber = 123456789;
      var testArray = ['Hello', 'mediator', ', ', 'how', 'are', 'you?'];
      var testString = "Hello World!";
      var testObject = {
        name: 'Testing Object',
        value: undefined
      };
      mediator.subscribe(TEST_CHANNEL, subscribeCb);

      mediator.publish(TEST_CHANNEL, false);
      mediator.publish(TEST_CHANNEL, testNumber);
      mediator.publish(TEST_CHANNEL, testString);
      mediator.publish(TEST_CHANNEL, testArray);
      mediator.publish(TEST_CHANNEL, testObject);

      assert.equal(subscribeCb.getCall(0).returnValue, false);
      assert.equal(subscribeCb.getCall(1).returnValue, testNumber);
      assert.equal(subscribeCb.getCall(2).returnValue, testString);
      assert.equal(subscribeCb.getCall(3).returnValue, testArray);
      assert.equal(subscribeCb.getCall(4).returnValue, testObject);
    });


    it('should publish done topics for completed handers', function() {
      var subscribeCallback = sinon.stub().resolves("VALUE");
      var subscribeDoneCallback = sinon.spy();

      var doneTestChannel = CONSTANTS.DONE_TOPIC_PREFIX + CONSTANTS.TOPIC_SEPERATOR + TEST_CHANNEL;
      mediator.subscribe(doneTestChannel, subscribeDoneCallback);
      mediator.subscribe(TEST_CHANNEL, subscribeCallback);

      return mediator.publish(TEST_CHANNEL, "my_data").then(function() {
        sinon.assert.calledOnce(subscribeCallback);
        sinon.assert.calledOnce(subscribeDoneCallback);
      });
    });
  });
  describe('#once', function() {
    const TEST_CHANNEL = "once:channel";

    it('Should be registered only once', function() {
      var CB = sinon.spy();
      mediator.once(TEST_CHANNEL, CB);
      mediator.publish(TEST_CHANNEL, "sample_data");
      sinon.assert.calledOnce(CB);
      mediator.publish(TEST_CHANNEL, "should not be subscribed");
      sinon.assert.calledOnce(CB);
      mediator.publish("not:even:valid:channel", {
        username: 'Gandalf',
        message: 'You shall not pass'
      });
      sinon.assert.calledOnce(CB);
    });
  });
  describe('#promise', function() {
    const TEST_CHANNEL = "promise:channel";

    it('Should call delayed callback', function(done) {
      var promiseCB = sinon.stub();
      mediator.promise(TEST_CHANNEL).then(promiseCB);
      var promised = Promise.delay(1, "WUHU");
      mediator.publish(TEST_CHANNEL, promised);
      setTimeout(function() {
        sinon.assert.called(promiseCB);
        sinon.assert.calledWith(promiseCB.getCall(0), "WUHU");
        done();
      }, 3);
    });

    it('Should be called only once', function(done) {
      var promiseCB = sinon.stub();
      mediator.promise(TEST_CHANNEL).then(promiseCB);
      var promised = Promise.delay(1, {
        goodCharacters: ['Frodo', 'Aragorn', 'Legolas'],
        evilOnes: ['Sauron', 'Saruman']
      });
      mediator.publish(TEST_CHANNEL, promised);
      mediator.publish(TEST_CHANNEL, ['Another', 'Set', 'Of', 'Data', 'That', 'Should', 'Not', 'Be', 'Accepted']);
      setTimeout(function() {
        sinon.assert.callCount(promiseCB, 1);
        done();
      }, 3);
    });

    it('Should call error callback', function(done) {
      var successCB = sinon.spy();
      var errorCB = sinon.spy();
      mediator.promise(TEST_CHANNEL).then(successCB, errorCB);
      var rejectedData = Promise.reject(new Error('Boromir died')).delay(1);
      mediator.publish(TEST_CHANNEL, rejectedData);
      setTimeout(function() {
        sinon.assert.notCalled(successCB);
        sinon.assert.callCount(errorCB, 1);
        done();
      }, 3);
    });
  });
  describe('#remove', function() {
    const TEST_CHANNEL = "remove:channel";

    it('Should remove all callbacks', function() {
      var firstSpy = sinon.spy();
      var secondSpy = sinon.spy();
      mediator.subscribe(TEST_CHANNEL, firstSpy);
      mediator.subscribe(TEST_CHANNEL, secondSpy);
      mediator.publish(TEST_CHANNEL, "data");
      sinon.assert.calledOnce(firstSpy);
      sinon.assert.calledOnce(secondSpy);
      mediator.remove(TEST_CHANNEL);
      mediator.publish(TEST_CHANNEL, "another-data");
      sinon.assert.calledOnce(firstSpy);
      sinon.assert.calledOnce(secondSpy);
    });

    it('Should remove specific callback', function() {
      var firstCB = sinon.spy();
      var secondCB = sinon.spy();
      mediator.subscribe(TEST_CHANNEL, firstCB);
      mediator.subscribe(TEST_CHANNEL, secondCB);
      mediator.publish(TEST_CHANNEL, 123456);
      sinon.assert.calledOnce(firstCB);
      sinon.assert.calledOnce(secondCB);
      mediator.remove(TEST_CHANNEL, secondCB);
      mediator.publish(TEST_CHANNEL, "another portion of data");
      sinon.assert.calledTwice(firstCB);
      sinon.assert.calledOnce(secondCB);
    });
  });


  describe('#mediator promises', function() {
    const TEST_CHANNEL = "test:channel";
    var value = {test: "val"};

    beforeEach(function() {
      mediator.remove(TEST_CHANNEL);
    });

    it('should handle a promise result', function(done) {
      mediator.subscribe(TEST_CHANNEL, function(param) {
        assert.equal(value, param);

        return Promise.resolve(param);
      });

      mediator.publish(TEST_CHANNEL, value).then(function(result) {
        assert.equal(value, result);
        done();
      });
    });

    it('should handle a promise error', function(done) {
      var expectedErr = new Error("Error Doing Something");
      mediator.subscribe(TEST_CHANNEL, function(param) {
        assert.equal(value, param);

        return Promise.reject(expectedErr);
      });

      mediator.publish(TEST_CHANNEL, value).then(function() {
        done(new Error("Did not expect to resolve"));
      }).catch(function(err) {
        assert.equal(expectedErr, err);
        done();
      });
    });

    it('should remove non-promise results', function(done) {
      mediator.subscribe(TEST_CHANNEL, function(param) {
        assert.equal(value, param);

        return param;
      });

      mediator.publish(TEST_CHANNEL, value).then(function(result) {
        assert.equal(undefined, result);
        done();
      });
    });

    it('should handle multiple subscribers', function(done) {
      mediator.subscribe(TEST_CHANNEL, function(param) {
        assert.equal(value, param);

        return param;
      });

      mediator.subscribe(TEST_CHANNEL, function(param) {
        assert.equal(value, param);

        return Promise.resolve(param);
      });

      mediator.publish(TEST_CHANNEL, value).then(function(result) {
        assert.equal(value, result);
        done();
      });
    });

    it('should only handle promises on the channel it published on. Parent channels should be published to but are not considered as part of resolution.' , function() {
      this.timeout(120);
      var channel1 = "test:channel:one";
      var channel2 = "test:channel:one:two";

      mediator.subscribe(channel1, function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, 200);
        });
      });

      mediator.subscribe(channel2, function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, 100);
        });
      });

      return mediator.publish(channel2, "TEST");

    });

    it('should not consider errors from parent channels', function() {
      this.timeout(120);
      var channel1 = "test:channel:one";
      var channel2 = "test:channel:one:two";

      mediator.subscribe(channel1, function() {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            reject(new Error("Some Error"));
          }, 200);
        });
      });

      mediator.subscribe(channel2, function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, 100);
        });
      });

      return mediator.publish(channel2, "TEST");
    });

  });

  describe("initializing", function() {
    it("should act like a constructor when called like a function", function() {
      var fnMediator = Mediator();
      expect(fnMediator).not.to.be.undefined;
    });

    it("should start with a channel", function() {
      expect(mediator.getChannel('')).not.to.be.undefined;
    });
  });

  describe("subscribing", function() {
    it("should subscribe to a given channel", function() {
      var spy = sinon.spy();
      mediator.subscribe("test", spy);
      expect(mediator.getChannel("test")._subscribers.length).to.equal(1);
    });

    it("should bind 'once'", function() {
      var spy = sinon.spy();
      mediator.once("test", spy);
      mediator.publish("test");
      mediator.publish("test");

      expect(spy).calledOnce;
    });

    it("should bind with arbitrary number of calls", function() {
      var spy = sinon.spy(), i;
      mediator.subscribe("test", spy, {calls: 3});

      for (i = 0; i < 5; i++) {
        mediator.publish("test");
      }

      expect(spy).calledThrice;
    });

    it("should bind with arbitrary number of calls when predicate matches", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy(),
        subscriber1 = mediator.subscribe("test", spy, {
          calls: 3, predicate: function(d) {
            return (d === 1);
          }
        }),
        subscriber2 = mediator.subscribe("test", spy2, {
          calls: 3, predicate: function(d) {
            return (d === 2);
          }
        });

      mediator.publish("test", 1);
      mediator.publish("test", 2);

      expect(spy).calledOnce;
      expect(subscriber1.options.calls).to.equal(2);
      expect(subscriber2.options.calls).to.equal(2);
    });

    it("should remove a subscriber in a list of others that's been called its maximum amount of times", function() {
      var spy = sinon.spy(), i;

      mediator.subscribe("test", function() {
      });
      mediator.subscribe("test", spy, {calls: 3});
      mediator.subscribe("test", function() {
      });

      for (i = 0; i < 5; i++) {
        mediator.publish("test");
      }

      expect(spy).calledThrice;
    });
  });

  describe("publishing", function() {
    it("should call a subscriber for a given channel", function() {
      var spy = sinon.spy();

      mediator.subscribe("testX", spy);
      mediator.publish("testX");

      expect(spy).called;
    });

    it("should stop propagation if requested", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy(),
        subscriber = function(c) {
          c.stopPropagation();
          spy();
        },
        subscriber2 = function() {
          spy2();
        };

      mediator.subscribe("testX", subscriber);
      mediator.subscribe("testX", subscriber2);
      mediator.publish("testX");

      expect(spy).called;
      expect(spy2).not.called;
    });


    it("should call subscribers for all functions in a given channel", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy();

      mediator.subscribe("test", spy);
      mediator.subscribe("test", spy2);
      mediator.publish("test");

      expect(spy).called;
      expect(spy2).called;
    });

    it("should pass arguments to the given function", function() {
      var spy = sinon.spy(),
        channel = "test",
        arg = "arg1",
        arg2 = "arg2";

      mediator.subscribe(channel, spy);
      mediator.publish(channel, arg, arg2);

      expect(spy).calledWith(arg, arg2, mediator.getChannel(channel));
    });

    it("should call all matching predicates", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy(),
        spy3 = sinon.spy();

      var predicate = function(data) {
        return data.length === 4;
      };

      var predicate2 = function(data) {
        return data[0] === "Y";
      };

      mediator.subscribe("test", spy, {predicate: predicate});
      mediator.subscribe("test", spy2, {predicate: predicate2});
      mediator.subscribe("test", spy3);

      mediator.publish("test", "Test");

      expect(spy).called;
      expect(spy2).not.called;
      expect(spy3).called;
    });

  });

  describe("removing", function() {
    it("should remove subscribers for a given channel", function() {
      var spy = sinon.spy();

      mediator.subscribe("test", spy);
      mediator.remove("test");
      mediator.publish("test");

      expect(spy).not.called;
    });

    it("should allow subscriber to remove itself", function() {
      var removerCalled = false;
      var predicate = function() {
        return true;
      };
      var remover = function() {
        removerCalled = true;
        mediator.remove("test", sub.id);
      };

      var spy1 = sinon.spy();

      var sub = mediator.subscribe("test", remover, {predicate: predicate});
      mediator.subscribe("test", spy1);
      mediator.publish("test");

      expect(removerCalled).to.be.true;
      expect(spy1).called;
      expect(mediator.getChannel("test")._subscribers.length).to.equal(1);
    });

    it("should remove subscribers for a given channel / named function pair", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy();

      mediator.subscribe("test", spy);
      mediator.subscribe("test", spy2);
      mediator.remove("test", spy);
      mediator.publish("test");

      expect(spy).not.called;
      expect(spy2).called;
    });

    it("should remove subscribers by calling from subscriber's callback", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy(),
        catched = false;
      mediator.subscribe("test", function() {
        mediator.remove("test");
      });
      mediator.subscribe("test", spy);
      mediator.subscribe("test", spy2);
      try {
        mediator.publish("test");
      } catch (e) {
        catched = true;
      }
      expect(catched).to.be.false;
      expect(spy).not.called;
      expect(spy2).not.called;
    });

    it("should remove subscriber by calling from its callback", function() {
      var remover = function() {
        mediator.remove("test", sub.id);
      };
      var spy = sinon.spy(),
        spy2 = sinon.spy(),
        catched = false;
      var sub = mediator.subscribe("test", remover);
      mediator.subscribe("test", spy);
      mediator.subscribe("test", spy2);
      try {
        mediator.publish("test");
      } catch (e) {
        catched = true;
      }
      expect(catched).to.be.false;
      expect(spy).to.called;
      expect(spy2).to.called;
      remover = sinon.spy(remover);
      mediator.publish("test");
      expect(remover).not.to.called;
      expect(spy).to.called;
      expect(spy2).to.called;
    });
  });

  describe("updating", function() {
    it("should update subscriber by identifier", function() {
      var spy = sinon.spy(),
        newPredicate = function(data) {
          return data;
        };

      var sub = mediator.subscribe("test", spy),
        subId = sub.id;

      var subThatIReallyGotLater = mediator.getSubscriber(subId, "test");
      subThatIReallyGotLater.update({options: {predicate: newPredicate}});
      expect(subThatIReallyGotLater.options.predicate).to.equal(newPredicate);
    });

    it("should update subscriber priority by identifier", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy(),
        sub = mediator.subscribe("test", spy),
        sub2 = mediator.subscribe("test", spy2);

      sub2.update({options: {priority: 0}});

      expect(mediator.getChannel("test")._subscribers[0].id).to.equal(sub2.id);
      expect(mediator.getChannel("test")._subscribers[1].id).to.equal(sub.id);
    });

    it("should update subscriber by fn", function() {
      var spy = sinon.spy(),
        newPredicate = function(data) {
          return data;
        };

      mediator.subscribe("test", spy);

      var subThatIReallyGotLater = mediator.getSubscriber(spy, "test");
      subThatIReallyGotLater.update({options: {predicate: newPredicate}});
      expect(subThatIReallyGotLater.options.predicate).to.equal(newPredicate);
    });
  });

  describe("namespaces", function() {
    it("should make subchannels", function() {
      var spy = sinon.spy();
      mediator.subscribe("test:subchannel", spy);
      expect(mediator.getChannel("test")._channels["subchannel"]._subscribers.length).to.equal(1);
    });

    it("should call all functions within a given channel namespace", function() {
      var spy = sinon.spy();
      var spy2 = sinon.spy();

      mediator.subscribe("test:channel", spy);
      mediator.subscribe("test", spy2);

      mediator.publish("test:channel");

      expect(spy).called;
      expect(spy2).called;
    });

    it("should call only functions within a given channel namespace", function() {
      var spy = sinon.spy();
      var spy2 = sinon.spy();

      mediator.subscribe("test", spy);
      mediator.subscribe("derp", spy2);

      mediator.publish("test");

      expect(spy).called;
      expect(spy2).not.called;
    });

    it("should remove functions within a given channel namespace", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy();

      mediator.subscribe("test:test1", spy);
      mediator.subscribe("test", spy2);

      mediator.remove("test:test1");

      mediator.publish("test:test1");

      expect(spy).not.called;
      expect(spy2).called;
    });

    it("should publish to specific namespaces", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy();

      mediator.subscribe("test:test1:test2", spy);
      mediator.subscribe("test", spy2);

      mediator.publish("test:test1", "data");

      expect(spy).not.called;
      expect(spy2).called;
    });

    it("should publish to parents of non-existing namespaces", function() {
      var spy = sinon.spy(),
        spy2 = sinon.spy();

      mediator.subscribe("test:test1:test2", spy);
      mediator.subscribe("test", spy2);

      mediator.publish("test:test1", "data");

      expect(spy).not.called;
      expect(spy2).called;
    });

  });

  describe("aliases", function() {
    it("should alias 'on' and 'bind'", function() {
      var spy = sinon.spy();

      mediator.on("test", spy);
      mediator.bind("test", spy);
      mediator.publish("test");

      expect(spy).calledTwice;
    });

    it("should alias 'emit' and 'trigger'", function() {
      var spy = sinon.spy();

      mediator.subscribe("test", spy);

      mediator.emit("test");
      mediator.trigger("test");

      expect(spy).calledTwice;
    });

    it("should alias 'off' for subscriptions", function() {
      var spy = sinon.spy(),
        sub;

      sub = mediator.subscribe("test", spy);
      mediator.off("test", sub.id);

      mediator.publish("test");
      expect(spy).not.called;
    });

    it("should alias 'off' for channels", function() {
      var spy = sinon.spy();

      mediator.subscribe("test", spy);
      mediator.off("test");

      mediator.publish("test");
      expect(spy).not.called;
    });
  });
});
