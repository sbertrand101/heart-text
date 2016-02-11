var bandwidth = require('node-bandwidth');
var Promise = require('bluebird');
var states = require('./states.json').states;
var areacodes = require('./areacodes.json').codes;
bandwidth.Client.globalOptions.userId = process.env.CATAPULT_USER_ID;
bandwidth.Client.globalOptions.apiToken = process.env.CATAPULT_API_TOKEN;
bandwidth.Client.globalOptions.apiSecret = process.env.CATAPULT_API_SECRET;
var AvailableNumber = Promise.promisifyAll(bandwidth.AvailableNumber);

var print = function(res) {
  if (res.length > 0) {
    console.log(res);
  }
};

var getNumber = function (areaCode, phrase) {
  //console.log(areaCode);
  AvailableNumber.searchLocalAsync({
    areaCode: areaCode,
    quantity: 10,
    pattern: phrase
  })
  .then(print);
};

var searchNumbers = function(phrase) {
  console.log('Searching for phrase: ' + phrase);
  function search() {
    getNumber(areacodes.pop(), phrase);
    if (areacodes.length > 0) {
      setTimeout(search, 100);
    }
    else {
      return true;
    }
  }
  search();
};

//searchNumbers('*298329*'); //18166298329
searchNumbers('*4588968*');
//searchNumbers('*4432788*');
