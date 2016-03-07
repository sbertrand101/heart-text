var bandwidth = require('node-bandwidth');
var Promise = require('bluebird');
var states = require('./states.json').states;
bandwidth.Client.globalOptions.userId = process.env.CATAPULT_USER_ID;
bandwidth.Client.globalOptions.apiToken = process.env.CATAPULT_API_TOKEN;
bandwidth.Client.globalOptions.apiSecret = process.env.CATAPULT_API_SECRET;
var AvailableNumber = Promise.promisifyAll(bandwidth.AvailableNumber);

var getNumber = function (areaCode, phrase) {
  AvailableNumber.searchLocalAsync({
    areaCode: areaCode,
    quantity: 10,
    pattern: phrase
  })
  .then(function (res) {
    if (res.length > 0) {
      console.log(res);
    }
  })
  .catch(function (e) {
    console.log(areaCode);
    console.log(e);
  });
};

//Pulled from http://www.csgnetwork.com/phonenumcvtrev.html
var convert = function (input) {
  var inputlength = input.length;
  input = input.toLowerCase();
  var phonenumber = '';
  for (var i = 0; i < inputlength; i = i+1) {
    var character = input.charAt(i);
    switch(character) {
      case '0': phonenumber+='0'; break;
      case '1': phonenumber+='1'; break;
      case '2': phonenumber+='2'; break;
      case '3': phonenumber+='3'; break;
      case '4': phonenumber+='4'; break;
      case '5': phonenumber+='5'; break;
      case '6': phonenumber+='6'; break;
      case '7': phonenumber+='7'; break;
      case '8': phonenumber+='8'; break;
      case '9': phonenumber+='9'; break;
      case '-': phonenumber+='-'; break;
      case  'a': case 'b': case 'c': phonenumber+='2'; break;
      case  'd': case 'e': case 'f': phonenumber+='3'; break;
      case  'g': case 'h': case 'i': phonenumber+='4'; break;
      case  'j': case 'k': case 'l': phonenumber+='5'; break;
      case  'm': case 'n': case 'o': phonenumber+='6'; break;
      case  'p': case 'q': case 'r': case 's': phonenumber+='7'; break;
      case  't': case 'u': case 'v': phonenumber+='8'; break;
      case  'w': case 'x': case 'y': case 'z': phonenumber+='9'; break;
    }
  }
  return phonenumber;
};


var searchNumbers = function(phrase) {
  console.log('Searching for phrase: ' + phrase);
  var areacodes = require('./areacodes.json').codes;
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


module.exports.findNumber = function (phrase) {
  var numberString = convert(phrase);

};
