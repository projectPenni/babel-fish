/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express'),
    cfenv = require('cfenv'),
    fs = require('fs-extra'),
    formidable = require('formidable');

// create a new express server
var app = express(),
    appEnv = cfenv.getAppEnv(),
    fromAudio,
    fromText;

// APIs
var speechToText = require('./src/speech-to-text'),
    translateToSpeech = require('./src/translate-to-speech');

var clean = require('./src/clean');

// Ensure TMP exists
fs.ensureDirSync('./tmp');
fs.ensureDirSync('./public/responses');

// Start cleaning
clean();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

//////////////////////////////
// From Audio
//////////////////////////////
fromAudio = function fromAudio(input, res) {
  var params,
      output = {};

  params = {
    'audio': fs.createReadStream(input.file.path),
    'content_type': 'audio/wav'
  };

  // Speech to Text
  speechToText.recognize(params, function (err, response) {
    if (err) {
      res.send(500, {
        'error': err
      });
    }
    else {
      output.speechToText = response.results[response.result_index].alternatives[0];
      output.speechToText.file = input.file.path;

      translateToSpeech(output, res);
    }
  });
}

fromText = function fromText(input, res) {
  var output = {};

  output.speechToText = {
    'confidence': 1,
    'transcript': input.text
  };

  translateToSpeech(output, function (err, response) {
    if (err) {
      res.send(500, {
        'error': err
      });
    }
    else {
      res.send(JSON.stringify(response));
    }
  });
}

//////////////////////////////
// Get Languages
//////////////////////////////
app.get('/languages/:from', function languageEndpoint (req, res) {
  var from = req.params.from;

  if (from === 'audio') {

  }
  else if (from == 'text') {

  }
  else {
    res.send(501, {
      'error': 'Translation from ' + from + ' not supported'
    });
  }
});

//////////////////////////////
// Translate Post
//////////////////////////////
app.post('/translate/:from', function translateEndpoint (req, res) {
  var result = {},
      from = req.params.from;

  var form = new formidable.IncomingForm();

  form.encoding = 'utf-8';
  form.uploadDir = './tmp';

  form.on('error', function (err) {
    console.log(err);
  });

  form.on('field', function (field, value) {
    result[field] = value;
  });

  form.on('file', function (field, file) {
    if (field === 'audio') {
      var path = file.path,
          size = file.size / 1000;

      fs.renameSync(path, path + '.wav');
      path += '.wav';
      // console.log(Object.keys(file));
      console.log(path);
      console.log(size);

      result.file = {
        'path': path,
        'size': size
      }
    }
  });

  form.on('end', function () {
    if (from === 'audio') {
      fromAudio(result, res);
    }
    else if (from === 'text') {
      fromText(result, res);
    }
    else {
      res.send(501, {
        'error': 'Translation from ' + from + ' not supported'
      });
    }
  });

  form.parse(req);
});

// start server on the specified port and binding host
app.listen(appEnv.port, function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
