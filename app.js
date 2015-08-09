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
    fromText,
    languageTranslation;

// APIs
var speechToText,
    textToSpeech,
    translation;

if (process.env.VCAP_SERVICES) {
  services = JSON.parse(process.env.VCAP_SERVICES);
  speechToText = services.speech_to_text[0].credentials;
  textToSpeech = services.text_to_speech[0].credentials;
  translation = services.language_translation[0].credentials;
}

// Ensure TMP exists
fs.ensureDirSync('./tmp');

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

//////////////////////////////
// From Audio
//////////////////////////////
fromAudio = function fromAudio(input, res) {
  var s2t,
      params,
      results;

  if (speechToText) {
    s2t = watson.speech_to_text({
      'username': speechToText.username,
      'password': speechToText.password,
      'url': speechToText.url,
      'version': 'v1'
    });

    params = {
      'audio': fs.createReadStream(input.file.path),
      'content_type': 'audio/wav'
    };

    s2t.recognize(params, function (err, response) {
      if (err) {
        res.send(500, {
          'error': err
        });
      }
      else {
        results = response.results[response.result_index].alternatives[0];

        results.source = 'en';
        results.target = 'fr';

        languageTranslation(results, function (err, translation) {
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
    });
  }
  else {
    res.send(JSON.stringify(input));
  }
}

languageTranslation = function languageTranslation(params, cb) {
  var lt,
      results;

  if (translation) {
    lt = watson.language_translation({
      'username': translation.username,
      'password': translation.password,
      'url': translation.url,
      'version': 'v1'
    });

    lt.translate(params, cb);
  }
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
