## heart-text
text a number, get a sweet heart phrase
![Screen Shot](/readme_images/demo.png?raw=true)


Demos uses of the:
* [Catapult Node SDK](https://github.com/bandwidthcom/node-bandwidth)
* [Creating Application](http://ap.bandwidth.com/docs/rest-api/applications/?utm_medium=social&utm_source=github&utm_campaign=dtolb&utm_content=_)
* [BXML](http://ap.bandwidth.com/docs/xml/?utm_medium=social&utm_source=github&utm_campaign=dtolb&utm_content=_)
* [Searching for Phone Number](http://ap.bandwidth.com/docs/rest-api/available-numbers/#resourceGETv1availableNumberslocal/?utm_medium=social&utm_source=github&utm_campaign=dtolb&utm_content=_)
* [Ordering Phone Number](http://ap.bandwidth.com/docs/rest-api/phonenumbers/#resourcePOSTv1usersuserIdphoneNumbers/?utm_medium=social&utm_source=github&utm_campaign=dtolb&utm_content=_)
* [Sending MMS](http://ap.bandwidth.com/docs/rest-api/messages/#resourcePOSTv1usersuserIdmessages/?utm_medium=social&utm_source=github&utm_campaign=dtolb&utm_content=_)
* [Sending SMS](http://ap.bandwidth.com/docs/rest-api/messages/#resourcePOSTv1usersuserIdmessages/?utm_medium=social&utm_source=github&utm_campaign=dtolb&utm_content=_)

## Prerequisites
- Configured Machine with Ngrok/Port Forwarding -OR- Heroku Account
  - [Ngrok](https://ngrok.com/)
  - [Heroku](https://www.heroku.com/)
- [Catapult Account](http://ap.bandwidth.com/?utm_medium=social&utm_source=github&utm_campaign=dtolb&utm_content=_)
- [Node 4.2+](https://nodejs.org/en/download/releases/)

## Deploy To PaaS

#### Env Variables Required To Run
* ```CATAPULT_USER_ID```
* ```CATAPULT_API_TOKEN```
* ```CATAPULT_API_SECRET```

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

#### Once deployed, visit the site to view phone number!

## How it works
Heart Text has two different catapult callback routes ```/msgcallback``` & ```/callcallback```

### Incoming messages
![Basic Flow](/readme_images/Heart-Text - Auto-Respond-SMS.png?raw=true)
```Javascript
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
```

### Incoming Calls
![Basic Flow](/readme_images/Heart-Text - Incoming call.png?raw=true)
```Javascript
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
```
