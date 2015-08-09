(function () {
  'use strict';



  if (window.AudioContext && navigator.getUserMedia) {
    var context = new AudioContext();

    navigator.getUserMedia({
      'audio': true
    }, function (stream) {
      var mic = context.createMediaStreamSource(stream);

      // mic.connect
    }, function (err) {
      console.log(err);
    });
  }
}());