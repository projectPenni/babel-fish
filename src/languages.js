'use strict';

var watson = require('watson-developer-cloud'),
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
        'target': []
      },
      output = {};

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

        output.sourceTarget = sourceTarget;

        res.send(output);
      });


    });


  }
}