var mediator = require('../lib/mediator');
var Promise = require('bluebird');
var assert = require('chai').assert;

var sinon = require('sinon');
describe('mediator', function() {
  describe('#subscribe',function() {
    const TEST_CHANNEL = "test_channel";
    it('Should call callback',function() {
      var subscribeCallback = sinon.spy();
      mediator.subscribe(TEST_CHANNEL,subscribeCallback);
      mediator.publish(TEST_CHANNEL,"my_data");
      sinon.assert.calledOnce(subscribeCallback);
      mediator.publish(TEST_CHANNEL,"another");
      sinon.assert.calledTwice(subscribeCallback);
    });
    it('Should accept args',function() {
      var subscribeCallback = sinon.stub();
      mediator.subscribe(TEST_CHANNEL,subscribeCallback);
      mediator.publish(TEST_CHANNEL,false);
      sinon.assert.calledOnce(subscribeCallback);
      sinon.assert.calledWith(subscribeCallback,false);
    });
    it('Should return args',function() {
      var subscribeCb = sinon.stub().returnsArg(0);
      var testNumber = 123456789;
      var testArray = ['Hello','mediator',', ','how','are','you?'];
      var testString = "Hello World!";
      var testObject = {
        name: 'Testing Object',
        value: undefined
      };
      mediator.subscribe(TEST_CHANNEL,subscribeCb);

      mediator.publish(TEST_CHANNEL,false);
      mediator.publish(TEST_CHANNEL,testNumber);
      mediator.publish(TEST_CHANNEL,testString);
      mediator.publish(TEST_CHANNEL,testArray);
      mediator.publish(TEST_CHANNEL,testObject);

      assert.equal(subscribeCb.getCall(0).returnValue, false);
      assert.equal(subscribeCb.getCall(1).returnValue, testNumber);
      assert.equal(subscribeCb.getCall(2).returnValue, testString);
      assert.equal(subscribeCb.getCall(3).returnValue, testArray);
      assert.equal(subscribeCb.getCall(4).returnValue, testObject);
    });
  });
  describe('#once',function() {
    const TEST_CHANNEL = "once:channel";

    it('Should be registered only once',function() {
      var CB = sinon.spy();
      mediator.once(TEST_CHANNEL,CB);
      mediator.publish(TEST_CHANNEL,"sample_data");
      sinon.assert.calledOnce(CB);
      mediator.publish(TEST_CHANNEL,"should not be subscribed");
      sinon.assert.calledOnce(CB);
      mediator.publish("not:even:valid:channel",{
        username: 'Gandalf',
        message: 'You shall not pass'
      });
      sinon.assert.calledOnce(CB);
    });
  });
  describe('#promise',function() {
    const TEST_CHANNEL = "promise:channel";

    it('Should call delayed callback',function(done) {
      var promiseCB = sinon.stub();
      mediator.promise(TEST_CHANNEL).then(promiseCB);
      var promised = Promise.delay(1, "WUHU");
      mediator.publish(TEST_CHANNEL, promised);
      setTimeout(function() {
        sinon.assert.called(promiseCB);
        sinon.assert.calledWith(promiseCB.getCall(0),"WUHU");
        done();
      }, 3);
    });

    it('Should be called only once',function(done) {
      var promiseCB = sinon.stub();
      mediator.promise(TEST_CHANNEL).then(promiseCB);
      var promised = Promise.delay(1, {
        goodCharacters: ['Frodo','Aragorn','Legolas'],
        evilOnes: ['Sauron','Saruman']
      });
      mediator.publish(TEST_CHANNEL, promised);
      mediator.publish(TEST_CHANNEL, ['Another','Set','Of','Data','That','Should','Not','Be','Accepted']);
      setTimeout(function() {
        sinon.assert.callCount(promiseCB,1);
        done();
      }, 3);
    });

    it('Should call error callback',function(done) {
      var successCB = sinon.spy();
      var errorCB = sinon.spy();
      mediator.promise(TEST_CHANNEL).then(successCB, errorCB);
      var rejectedData = Promise.reject(new Error('Boromir died')).delay(1);
      mediator.publish(TEST_CHANNEL,rejectedData);
      setTimeout(function() {
        sinon.assert.notCalled(successCB);
        sinon.assert.callCount(errorCB,1);
        done();
      }, 3);
    });
  });
  describe('#remove',function() {
    const TEST_CHANNEL = "remove:channel";

    it('Should remove all callbacks', function() {
      var firstSpy = sinon.spy();
      var secondSpy = sinon.spy();
      mediator.subscribe(TEST_CHANNEL,firstSpy);
      mediator.subscribe(TEST_CHANNEL,secondSpy);
      mediator.publish(TEST_CHANNEL,"data");
      sinon.assert.calledOnce(firstSpy);
      sinon.assert.calledOnce(secondSpy);
      mediator.remove(TEST_CHANNEL);
      mediator.publish(TEST_CHANNEL,"another-data");
      sinon.assert.calledOnce(firstSpy);
      sinon.assert.calledOnce(secondSpy);
    });

    it('Should remove specific callback', function() {
      var firstCB = sinon.spy();
      var secondCB = sinon.spy();
      mediator.subscribe(TEST_CHANNEL,firstCB);
      mediator.subscribe(TEST_CHANNEL,secondCB);
      mediator.publish(TEST_CHANNEL,123456);
      sinon.assert.calledOnce(firstCB);
      sinon.assert.calledOnce(secondCB);
      mediator.remove(TEST_CHANNEL,secondCB);
      mediator.publish(TEST_CHANNEL,"another portion of data");
      sinon.assert.calledTwice(firstCB);
      sinon.assert.calledOnce(secondCB);
    });
  });
});
