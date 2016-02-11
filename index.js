var express = require('express');
var Promise = require('bluebird');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var tn;
var bandwidth = require('node-bandwidth');
var phrases = require('./phrases.json').phrases;
var photos = require('./photos.json').photos;
var Application = Promise.promisifyAll(bandwidth.Application);
var PhoneNumber = Promise.promisifyAll(bandwidth.PhoneNumber);
var AvailableNumber = Promise.promisifyAll(bandwidth.AvailableNumber);
var Message = Promise.promisifyAll(bandwidth.Message);

var appName = 'HeartText';
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
			incomingMessageUrl: url + '/callback/',
			callbackHttpMethod: 'post',
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
			return newApplication('http://b6085a61.ngrok.io');
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

app.use(express.static('static'));
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

//three sets of each number
app.post('/callback', function(req, res) {
	var hasBody = (typeof req.body !== 'undefined' && req.body !== null);
	if (hasBody) {
		var hasEvent = (typeof req.body.eventType !== 'undefined');
		if (hasEvent) {
			if (req.body.eventType === 'sms') {
				var response = {
					to: req.body.from,
					from: req.body.to,
					text: getPhrase()
				};
				var text = req.body.text.toLowerCase();
				if(req.body.text === 'I <3 u') {
					response.media = [getPhoto()];
				}
				Message.createAsync(response)
				.then(function (result) {
					console.log(result);
				})
				.catch(function (e) {
					console.log(e);
				});
			}
		}
	}
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
