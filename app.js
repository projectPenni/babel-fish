/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express'),
    cfenv = require('cfenv'),
    watson = require('watson-developer-cloud'),
    fs = require('fs-extra'),
    formidable = require('formidable');

// create a new express server
var app = express(),
    appEnv = cfenv.getAppEnv(),
    services,
    fromAudio,
    fromVideo;

// APIs
var speechToText = appEnv.getServiceCreds('speech_to_text'),
    textToSpeech = appEnv.getServiceCreds('text_to_speech'),
    translation = appEnv.getServiceCreds('language_translation');

// Ensure TMP exists
fs.ensureDirSync('./tmp');

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

//////////////////////////////
// From Audio
//////////////////////////////
fromAudio = function fromAudio(input, res) {
  input.s2t = speechToText;
  res.send(JSON.stringify(input));
}

//////////////////////////////
// From Video
//////////////////////////////

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
      console.log(result);
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
