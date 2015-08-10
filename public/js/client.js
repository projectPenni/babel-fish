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

  //////////////////////////////
  // Set Available Languages
  //////////////////////////////
  var languages = new XMLHttpRequest(),
      // languagesURL = '/languages';
      languagesURL = '../tmp/languages.json';

  languages.open('GET', languagesURL, true);
  languages.responseType = 'json';
  languages.onload = function () {

    var languages = this.response,
        source = document.getElementById('translate--source'),
        target = document.getElementById('translate--target'),
        options = {
          'source': '',
          'target': ''
        };

    var setTranslation = function setTranslation(key) {
      key = key ? key : Object.keys(languages)[0];
      options.target = '';

      languages[key].targets.forEach(function (translate) {
        options.target += '<option value="' + translate.code + '" data-voice="' + translate.voice + '">' + translate.desc + '</option>';
      });

      target.innerHTML = options.target;
    }

    Object.keys(languages).forEach(function (language) {
      var language = languages[language];
      options.source += '<option value="' + language.code + '">' + language.desc + '</option>';
    });

    source.innerHTML = options.source;
    source.value = Object.keys(languages)[0];
    source.setAttribute('data-model', languages[Object.keys(languages)[0]].model);
    setTranslation();

    source.addEventListener('change', function (e) {
      var key = e.target.value
      setTranslation(key);
      e.target.setAttribute('data-model', languages[key].model)
    });

    target.addEventListener('change', function (e) {
      console.log(e.target)
      console.log(e.target.options[e.target.selectedIndex].getAttribute('data-voice'));
    });

    console.log(languages);

  }
  languages.send();

  //////////////////////////////
  // Audio Recording
  //////////////////////////////
  if (window.AudioContext && navigator.getUserMedia) {
    var context = new AudioContext(),
        recorder;

    var populateOutput = function populateOutput(response) {
      console.log(response);

      var player = new Audio(),
          body = document.querySelector('body');

      player.src = response.textToSpeech;
      player.play();
    };

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
            xhr = new XMLHttpRequest(),
            source = document.getElementById('translate--source'),
            target = document.getElementById('translate--target'),
            blob,
            player;



        formData.append('audio', this.response);
        formData.append('source', JSON.stringify({
          'code': source.value,
          'model': source.getAttribute('data-model')
        }));
        formData.append('target', JSON.stringify({
          'code': target.value,
          'voice': target.options[target.selectedIndex].getAttribute('data-voice')
        }));

        console.log('source', formData.get('source'));
        console.log('target', formData.get('target'));

        xhr.open('POST', 'translate/audio', true);
        xhr.responseType = 'json';
        xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');

        xhr.onload = function () {
          populateOutput(xhr.response);
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
          // hello = document.getElementById('hello'),
          url;

      // hello.addEventListener('click', function () {
      //   var formData = new FormData(),
      //       xhr = new XMLHttpRequest();

      //   formData.append('text', 'Hello, my name is Sam');

      //   xhr.open('POST', 'translate/text', true);
      //   xhr.responseType = 'json';
      //   xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');

      //   xhr.onload = function () {
      //     populateOutput(xhr.response);
      //   }

      //   xhr.send(formData);
      // });

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