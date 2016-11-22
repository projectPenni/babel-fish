'use strict';

var watson = require('watson-developer-cloud'),
    credentials = {};

credentials = require('../config.js').speech_to_text.login;
console.log(credentials);

module.exports = function (params, cb) {
  var speechToText;

  if (credentials) {
    speechToText = watson.speech_to_text({
      'username': credentials.username,
      'password': credentials.password,
      'url': credentials.url,
      'version': 'v1'
    });

    speechToText.recognize(params, cb);
  }
}
