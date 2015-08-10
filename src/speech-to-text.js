'use strict';

var watson = require('watson-developer-cloud'),
    credentials = {};

if (process.env.VCAP_SERVICES) {
  credentials = JSON.parse(process.env.VCAP_SERVICES).speech_to_text[0].credentials;
}

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