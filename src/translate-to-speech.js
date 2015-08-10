'use strict';

var fs = require('fs-extra');

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
        'voice': 'fr-FR_ReneeVoice',
        'accept': 'audio/wav'
      };

      textToSpeech(params, function (err, response) {
        if (err) {
          res.send(500, {
            'error': err
          });
        }
        else {

          if (output.speechToText.file) {
            output.textToSpeech = '/responses/' + output.speechToText.file;
            fs.removeSync(output.speechToText.file);
            delete output.speechToText.file;
          }

          fs.outputFileSync('public' + output.textToSpeech, response);

          res.send(JSON.stringify(output));
        }
      });
    }
  });
}