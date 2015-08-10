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
    translateToSpeech = require('./src/translate-to-speech'),
    languages = require('./src/languages');

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
    'model': input.source.model,
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
      output.speechToText.file = input.file.path;

      delete input.file;

      output.formData = input;

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
app.get('/languages', function languageEndpoint (req, res) {
  if (appEnv.isLocal) {
    var sample = {"es":{"model":"es-ES_BroadbandModel","code":"es","desc":"Español","targets":[{"code":"en","desc":"English","voice":"en-US_MichaelVoice"}]},"en":{"model":"en-US_BroadbandModel","code":"en","desc":"English","targets":[{"code":"es","desc":"Español","voice":"es-ES_LauraVoice"},{"code":"fr","desc":"Français","voice":"fr-FR_ReneeVoice"}]}};
    res.send(sample);
  }
  else {
    languages(res);
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
    try {
      result[field] = JSON.parse(value);
    }
    catch (e) {
      result[field] = value;
    }
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

  console.log(appEnv);

  form.on('end', function () {
    if (from === 'audio') {
      if (appEnv.isLocal) {
        var sample = {"speechToText": {"confidence": 0.9110918045043945,"transcript": "hello my name is sam and i like chicken "},"formData": {"source": {"code": "en","model": "en-US_BroadbandModel"},"target": {"code": "fr","voice": "fr-FR_ReneeVoice"}},"languageTranslation": {"character_count": 39,"word_count": 9,"translation": "Bonjour mon nom est sam et i comme poulet"},"textToSpeech": "/responses/tmp/upload_c88ca85828569f7776851387e83747e6.wav"};

        setTimeout(function () {
          res.send(sample);
        }, 3000);
      }
      else {
        fromAudio(result, res);
      }

    }
    else if (from === 'text') {
      if (appEnv.isLocal) {
        var sample = {"es":{"model":"es-ES_BroadbandModel","code":"es","desc":"Español","targets":[{"code":"en","desc":"English","voice":"en-US_MichaelVoice"}]},"en":{"model":"en-US_BroadbandModel","code":"en","desc":"English","targets":[{"code":"es","desc":"Español","voice":"es-ES_LauraVoice"},{"code":"fr","desc":"Français","voice":"fr-FR_ReneeVoice"}]}};
        res.send(sample);
      }
      else {
        fromText(result, res);
      }
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
