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
var languageTranslation = require('./src/language-translation'),
    speechToText = require('./src/speech-to-text'),
    textToSpeech = require('./src/text-to-speech');

// Ensure TMP exists
fs.ensureDirSync('./tmp');

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
  speechToText(params, function (err, response) {
    if (err) {
      res.send(500, {
        'error': err
      });
    }
    else {
      output.speechToText = response.results[response.result_index].alternatives[0];

      params = {
        'text': output.speechToText.transcript,
        'source': 'en',
        'target': 'fr'
      };

      // Translate Text
      languageTranslation(params, function (err, response) {
        if (err) {
          res.send(500, {
            'error': err
          });
        }
        else {
          output.languageTranslation = response;

          res.send(JSON.stringify(output));
        }
      });
    }
  });
}

fromText = function fromText(input, res) {
  var params = {
    'text': 'My name is Sam Richard and I like chicken',
    'source': 'en',
    'target': 'es'
  }

  languageTranslation(params, function (err, translation) {
    if (err) {
      res.send(500, {
        'error': err
      });
    }
    else {
      res.send(JSON.stringify(translation));
    }
  });
}

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
