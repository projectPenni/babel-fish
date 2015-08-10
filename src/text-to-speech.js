'use strict';

var watson = require('watson-developer-cloud'),
    credentials = {};

if (process.env.VCAP_SERVICES) {
  credentials = JSON.parse(process.env.VCAP_SERVICES).text_to_speech[0].credentials;
}

module.exports = function () {
  var textToSpeech;

  if (credentials) {
    textToSpeech = watson.text_to_speech({
      'username': credentials.username,
      'password': credentials.password,
      'url': credentials.url,
      'version': 'v1'
    });

    return textToSpeech;
  }
}