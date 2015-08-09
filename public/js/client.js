(function (Recorder) {
  'use strict';

  //////////////////////////////
  // Deal with Prefixes
  //////////////////////////////
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;
  window.URL = window.URL || window.webkitURL;

  if (window.AudioContext && navigator.getUserMedia) {
    var context = new AudioContext(),
        recorder;

    //////////////////////////////
    // Audio Callback
    //////////////////////////////
    var translateAudio = function translateAudio(blob) {
      var url = URL.createObjectURL(blob),
          request = new XMLHttpRequest();

      request.open('GET', url, true);
      request.responseType = 'blob';
      request.onload = function () {
        var formData = new FormData(),
            xhr = new XMLHttpRequest();

        formData.append('audio', this.response);

        xhr.open('POST', 'translate/audio', true);
        xhr.responseType = 'json';
        xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');

        xhr.onload = function () {
          console.log(xhr.response);
        }

        xhr.send(formData);
      }
      request.send();
    }

    //////////////////////////////
    // getUserMedia
    //////////////////////////////
    navigator.getUserMedia({'audio': true}, function (stream) {
      var mic = context.createMediaStreamSource(stream);

      recorder = new Recorder(mic, {
        'workerPath': 'bower_components/Recorderjs/recorderWorker.js',
        'callback': translateAudio
      });
    }, function (err) {
      console.log(err);
    });

    //////////////////////////////
    // Button to Record
    //////////////////////////////
    window.addEventListener('DOMContentLoaded', function () {
      var button = document.getElementById('record'),
          hello = document.getElementById('hello'),
          url;

      hello.addEventListener('click', function () {
        var formData = new FormData(),
            xhr = new XMLHttpRequest();

        formData.append('text', 'Hello, my name is Sam');

        xhr.open('POST', 'translate/text', true);
        xhr.responseType = 'json';
        xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');

        xhr.onload = function () {
          console.log(xhr.response);
        }

        xhr.send(formData);
      });

      button.addEventListener('click', function () {
        if (button.getAttribute('data-recording')) {
          button.removeAttribute('data-recording');
          button.value = 'Record';
          recorder && recorder.stop();
          recorder.exportWAV();
          recorder.clear();
          console.log('Done Recording');
        }
        else {
          button.setAttribute('data-recording', true);
          button.value = 'Stop Recording';
          recorder && recorder.record();
          console.log('Recording...');
        }
      })
    });
  }
}(window.Recorder));