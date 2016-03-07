var express = require('express');
var Promise = require('bluebird');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var bandwidth = require('node-bandwidth');
var phrases = require('./configs/phrases.json').phrases;
var photos = require('./configs/photos.json').photos;
var bears = require('./configs/bears.json').photos;
var candy = require('./configs/candy.json').photos;
var xml = bandwidth.xml;
var Account = Promise.promisifyAll(bandwidth.Account);
var Application = Promise.promisifyAll(bandwidth.Application);
var PhoneNumber = Promise.promisifyAll(bandwidth.PhoneNumber);
var AvailableNumber = Promise.promisifyAll(bandwidth.AvailableNumber);
var Message = Promise.promisifyAll(bandwidth.Message);
var fs = require('fs');
var indexHTML = fs.readFileSync('./index.html', 'utf8');
var rootName = 'HeartText-';
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
		app.tn = numbers[0].number;
		console.log('Found Number: ' + app.tn);
		return app.tn;
	});
};

// Creates a new application then orders a number and assigns it to application
var newApplication =function (appName, url) {
	var applicationId;
	return Application.createAsync({
			name: appName,
			incomingMessageUrl: url + '/msgcallback/',
			incomingCallUrl: url + '/callcallback/',
			callbackHttpMethod: 'get',
			autoAnswer: true
		})
		.then(function(application) {
			//search an available number
			console.log('Created Application: ' + application.id);
			applicationId = application.id;
			return AvailableNumber.searchLocalAsync({
				areaCode: '919',
				quantity: 1
			});
		})
		.then(function(numbers) {
			// and reserve it
			console.log('Found Number: ' + numbers[0].number);
			app.tn = numbers[0].number;
			return PhoneNumber.createAsync({
				number: app.tn,
				applicationId: applicationId
			});
		});
};

//Checks the current Applications to see if we have one.
var configureApplication = function (appName, appCallbackUrl) {
	return Application.listAsync({
		size: 1000
	})
	.then(function (applications) {
		var applicationId = searchForApplication(applications, appName);
		if(applicationId !== false) {
			console.log('Application Found');
			return fetchTNByAppId(applicationId);
		}
		else {
			console.log('No Application Found');
			return newApplication(appName, appCallbackUrl);
		}
	});
};

var getBaseUrlFromReq = function (req) {
	return 'http://' + req.hostname;
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

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.get('/callcallback', function (req, res) {
	var response = new xml.Response();
	var playAudio = new xml.PlayAudio({
		url: 'https://s3.amazonaws.com/bwdemos/vday/vday.mp3'
	});
	var hangup = new xml.Hangup();
	response.push(playAudio);
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
			response.media = ['https://s3.amazonaws.com/bwdemos/vday/bw.jpg'];
			break;
		default:
			break;
	}
	console.log(response);
	Message.createAsync(response)
	.then(function (result) {
		//console.log(result);
	})
	.catch(function (e) {
		console.log(e);
	});
	res.sendStatus(201); //Immediately respond to request
});

var makeWebPage = function (phoneNumber, res) {
	phoneNumber = phoneNumber.replace('+1', '');
	phoneNumber =
		phoneNumber.substr(0,3) + '-' +
		phoneNumber.substr(3,3) + '-' +
		phoneNumber.substr(6,4);
	var html = indexHTML.replace('PHONE_NUMBER', phoneNumber);
	res.set('Content-Type', 'text/html');
	res.send(html);
};

app.get('/', function(req, res) {
	app.callbackUrl = getBaseUrlFromReq(req);
	var appName = rootName + app.callbackUrl;
	if (app.tn === undefined) {
		configureApplication(appName, app.callbackUrl)
		.then(function () {
			makeWebPage(app.tn, res);
		})
		.catch(function(e) {
			console.log(e);
			res.status(500).send(e);
		});
	}
	else {
		makeWebPage(app.tn, res);
	}
});

http.listen(app.get('port'), function(){
	console.log('listening on *:' + app.get('port'));
});
