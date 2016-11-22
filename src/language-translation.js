'use strict';

var watson = require('watson-developer-cloud'),
    credentials = {};

credentials = require('../config.js').language_translation.login;

module.exports = function (params, cb) {
  var languageTranslation;

  if (credentials) {
    languageTranslation = watson.language_translation({
      'username': credentials.username,
      'password': credentials.password,
      'version': 'v2'
    });

    languageTranslation.translate(params, cb);
  }
}
