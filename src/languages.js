'use strict';

var watson = require('watson-developer-cloud'),
    languages = require('languages'),
    credentials = {},
    services;

if (process.env.VCAP_SERVICES) {
  services = JSON.parse(process.env.VCAP_SERVICES);
  Object.keys(services).forEach(function (cred) {
    credentials[cred] = services[cred][0].credentials;
  });
}

module.exports = function (from, res) {
  var textToSpeech,
      speechToText,
      languageTranslation,
      sourceTarget = {
        'source': [],
        'target': [],
        'voices': []
      },
      output = {},
      results = {
        'source': [],
        'target': []
      };

  if (credentials) {
    speechToText = watson.speech_to_text({
      'username': credentials.speech_to_text.username,
      'password': credentials.speech_to_text.password,
      'url': credentials.speech_to_text.url,
      'version': 'v1'
    });

    languageTranslation = watson.language_translation({
      'username': credentials.language_translation.username,
      'password': credentials.language_translation.password,
      'version': 'v2'
    });

    textToSpeech = watson.text_to_speech({
      'username': credentials.text_to_speech.username,
      'password': credentials.text_to_speech.password,
      'url': credentials.text_to_speech.url,
      'version': 'v1'
    });


    speechToText.getModels({}, function (err, models) {
      if (err) {
        res.send(500, {
          'error': err
        });
      }

      models = models.models;

      output.speechToText = []

      models.forEach(function (model) {
        if (model.name.indexOf('Broadband') >= 0) {
          output.speechToText.push({
            'name': model.name,
            'language': model.language,
            'description': model.description.replace(' broadband model.', '')
          });


        }
      });

      languageTranslation.getModels({}, function (err, models) {
        if (err) {
          res.send(500, {
            'error': err
          });
        }

        models = models.models;

        output.languageTranslation = [];

        output.speechToText.forEach(function (speech) {
          var lang = speech.language.split('-').shift(),
              added = false;

          models.forEach(function (model) {
            if (model.source === lang) {
              if (!added) {
                sourceTarget.source.push(lang);
                added = true;
              }
              if (model.model_id === lang + '-' + model.target) {
                sourceTarget.target.push(model.target);
                output.languageTranslation.push({
                  'model': model.model_id,
                  'source': model.source,
                  'target': model.target
                });
              }
            }
          });
        });

        textToSpeech.voices({}, function (err, voices) {
          if (err) {
            res.send(500, {
              'error': err
            });
          }

          voices = voices.voices;

          output.textToSpeech = [];

          voices.forEach(function (voice) {
            var lang = voice.language.split('-').shift(),
                added = false;

            sourceTarget.target.forEach(function (target) {
              if (target === lang) {
                if (sourceTarget.voices.indexOf(lang) < 0) {
                  sourceTarget.voices.push(lang);

                  output.textToSpeech.push({
                    'name': voice.name,
                    'language': lang,
                    'desc': languages.getLanguageInfo(lang)
                  });
                }
              }
            });
          });

          // results

          output.sourceTarget = sourceTarget;

          res.send(output);
        });


      });


    });


  }
}