'use strict';

var watson = require('watson-developer-cloud'),
    credentials = {};

if (process.env.VCAP_SERVICES) {
  credentials = JSON.parse(process.env.VCAP_SERVICES).language_translation[0].credentials;
}

module.exports = function (params, cb) {
  var languageTranslation;

  if (credentials) {
    languageTranslation = watson.language_translation({
      'username': credentials.username,
      'password': credentials.password,
      'version': 'v2'
    });

    languageTranslation(params, cb);
  }
}