var express = require('express');
var Promise = require('bluebird');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var tn;
var bandwidth = require('node-bandwidth');
var phrases = require('./phrases.json').phrases;
var photos = require('./photos.json').photos;
var bears = require('./bears.json').photos;
var candy = require('./candy.json').photos;
var xml = bandwidth.xml;
var Application = Promise.promisifyAll(bandwidth.Application);
var PhoneNumber = Promise.promisifyAll(bandwidth.PhoneNumber);
var AvailableNumber = Promise.promisifyAll(bandwidth.AvailableNumber);
var Message = Promise.promisifyAll(bandwidth.Message);

var appName = 'HeartText';
var baseURL = process.env.baseURL;
bandwidth.Client.globalOptions.userId = process.env.CATAPULT_USER_ID;
bandwidth.Client.globalOptions.apiToken = process.env.CATAPULT_API_TOKEN;
bandwidth.Client.globalOptions.apiSecret = process.env.CATAPULT_API_SECRET;

// Searches through application names and returns ID if matched
var searchForApplication = function (applications, name) {
	for (var i = 0; i < applications.length; i+=1) {
			if ( applications[i].name === name) {
				return applications[i].id;
			}
		}
	return false;
};

// Gets the first number associated with an application
var fetchTNByAppId = function (applicationId) {
	return PhoneNumber.listAsync({
		applicationId: applicationId
	})
	.then(function (numbers) {
		tn = numbers[0].number;
	});
};

// Creates a new application then orders a number and assigns it to application
var newApplication =function (url) {
	var applicationId;
	return Application.createAsync({
			name: appName,
			incomingMessageUrl: url + '/msgcallback/',
			incomingCallUrl: url + '/callcallback/',
			callbackHttpMethod: 'get',
			autoAnswer: false
		})
		.then(function(application) {
			//search an available number
			applicationId = application.id;
			return AvailableNumber.searchLocalAsync({
				areaCode: '415',
				quantity: 1
			});
		})
		.then(function(numbers) {
			// and reserve it
			tn = numbers[0].number;
			return PhoneNumber.createAsync({
				number: tn,
				applicationId: applicationId
			});
		});
};

//Checks the current Applications to see if we have one.
var configureApplication = function () {
	return Application.listAsync({
		size: 1000
	})
	.then(function (applications) {
		var applicationId = searchForApplication(applications, appName);
		if(applicationId !== false) {
			return fetchTNByAppId(applicationId);
		}
		else {
			return newApplication(baseURL);
		}
	});
};

var getPhrase = function () {
	return phrases[Math.floor(Math.random() * phrases.length)];
};

var getPhoto = function () {
	var photo = photos[Math.floor(Math.random() * photos.length)];
	return photo;
};

var getBear = function () {
	return bears[Math.floor(Math.random() * bears.length)];
};

var getCandy = function () {
	return candy[Math.floor(Math.random() * candy.length)];
};

app.use(express.static('static'));
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.get('/callcallback', function (req, res) {
	var response = new xml.Response();
	var speakSentence = new xml.SpeakSentence({
		sentence: 'Happy valentines day from Bandwidth',
		voice: 'susan',
		gender: 'female',
		locale: 'en_US'
	});
	var hangup = new xml.Hangup();
	response.push(speakSentence);
	response.push(hangup);
	res.send(response.toXml());
});

//three sets of each number
app.get('/msgcallback', function(req, res) {
	var response = {
		to: req.query.from,
		from: req.query.to,
		text: getPhrase()
	};
	var text = req.query.text.toLowerCase();
	switch(text) {
		case 'i luv u':
			response.media = [getPhoto()];
			break;
		case 'hugs':
			response.media = [getBear()];
			break;
		case 'kisses':
			response.media = [getCandy()];
			break;
		case 'bandwidth':
			response.media = [''];
			break;
		default:
			break;
	}
	Message.createAsync(response)
	.then(function (result) {
		//console.log(result);
	})
	.catch(function (e) {
		console.log(e);
	});
	res.sendStatus(201); //Immediately respond to request
});

// app.get('/', function(req, res) {
// 	configureApplication(req)
// 	.then(function () {
//
// 	})
// });
configureApplication()
.then(function () {
	http.listen(app.get('port'), function(){
		console.log('listening on *:' + app.get('port'));
		console.log('Text #: '+ tn);
	});
});
