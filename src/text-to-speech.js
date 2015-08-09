'use strict';

var watson = require('watson-developer-cloud'),
    credentials = {};

if (process.env.VCAP_SERVICES) {
  credentials = JSON.parse(process.env.VCAP_SERVICES).text_to_speech[0].credentials;
}

module.exports = function (params, cb) {
  var textToSpeech;

  if (credentials) {
    textToSpeech = watson.speech_to_text({
      'username': credentials.username,
      'password': credentials.password,
      'url': credentials.url,
      'version': 'v1'
    });

    textToSpeech.synthesize(params, cb);
  }
}