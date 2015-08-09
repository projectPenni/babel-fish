'use strict';

var languageTranslation = require('./language-translation'),
    textToSpeech = require('./text-to-speech');

module.exports = function (output, res) {
  var params = {
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
      output.languageTranslation = {
        'character_count': response.character_count,
        'word_count': response.word_count,
        'translation': response.translations[0].translation
      };

      params = {
        'text': output.languageTranslation.translation,
        'accept': 'audio/wav'
      };

      textToSpeech(params, function (err, response) {
        if (err) {
          res.send(500, {
            'error': err
          });
        }
        else {
          output.textToSpeech = response;

          res.send(JSON.stringify(output));
        }
      });
    }
  });
}