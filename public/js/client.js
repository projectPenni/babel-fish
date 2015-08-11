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

  var source,
      target,
      microphone,
      translated,
      body;

  var count = localStorage.getItem('record count');

  window.addEventListener('DOMContentLoaded', function () {
    source = document.getElementById('translate--source');
    target = document.getElementById('translate--target');
    microphone = document.getElementById('record');
    translated = document.querySelector('.translated');
    body = document.querySelector('body');

    if (count > 5) {
      translated.innerHTML = '';
    }
  });

  //////////////////////////////
  // Get query parameters
  // From http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  //////////////////////////////
  var getParameterByName = function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  //////////////////////////////
  // Set Available Languages
  //////////////////////////////
  var languages = new XMLHttpRequest(),
      languagesURL = '/languages';
      // languagesURL = '../tmp/languages.json';

  languages.open('GET', languagesURL, true);
  languages.responseType = 'json';
  languages.onload = function () {

    var languages = this.response,
        prevResponse,
        loadKey,
        options = {
          'source': '',
          'target': ''
        };

    var setTranslation = function setTranslation(key, change) {
      change = change === 'undefined' ? true : change
      options.target = '';

      languages[key].targets.forEach(function (translate) {
        options.target += '<option value="' + translate.code + '" data-voice="' + translate.voice + '">' + translate.desc + '</option>';
      });

      target.innerHTML = options.target;

      if (change) {
        localStorage.setItem('target', languages[key].targets[0].code);
      }
      target.value = localStorage.getItem('target');
    }

    Object.keys(languages).forEach(function (language) {
      var language = languages[language];
      options.source += '<option value="' + language.code + '">' + language.desc + '</option>';
    });

    source.innerHTML = options.source;


    if (localStorage.getItem('source')) {
      source.value = localStorage.getItem('source');
      loadKey = localStorage.getItem('source');
    }
    else {
      localStorage.setItem('source', Object.keys(languages)[0]);
      loadKey = Object.keys(languages)[0];
    }

    source.setAttribute('data-model', languages[loadKey].model);

    if (localStorage.getItem('target')) {
      target.value = localStorage.getItem('target');
      setTranslation(loadKey, false);
    }
    else {
      localStorage.setItem('target', languages[Object.keys(languages)[0]].targets[0].code);

      setTranslation(loadKey, true);
    }

    source.addEventListener('change', function (e) {
      var key = e.target.value;
      setTranslation(key, true);
      e.target.setAttribute('data-model', languages[key].model);
      localStorage.setItem('source', key);
    });

    target.addEventListener('change', function (e) {
      var key = e.target.value;
      localStorage.setItem('target', key);
    });

    prevResponse = getParameterByName('result');

    if (prevResponse) {
      prevResponse = JSON.parse(atob(prevResponse));
      source.value = prevResponse.formData.source.code;
      localStorage.setItem('source', prevResponse.formData.source.code);
      localStorage.setItem('target', prevResponse.formData.target.code);
      setTranslation(prevResponse.formData.source.code, false);
      populateOutput(prevResponse);
    }

    console.log(prevResponse);
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
          query = '?result=',
          translation = '';

      player.src = response.textToSpeech;

      translation += '<p class="translated--title">Input Text:</p><p class="translated--input">' + response.speechToText.transcript + '</p>';
      translation += '<p class="translated--title">Translated Text:</p><p class="translated--output">' + response.languageTranslation.translation + '</p>';
      translation += '<audio controls class="translated--audio" src="' + response.textToSpeech + '">';

      // translated

      player.play();

      query += btoa(JSON.stringify(response));

      // console.log(query);

      history.pushState({
        'result': response.textToSpeech
      }, 'result', query);

      // document.location.search = 'foo';

      translated.innerHTML = translation;

      source.disabled = false;
      target.disabled = false;
      body.removeAttribute('data-disabled');
      microphone.removeAttribute('data-disabled');
      if (count) {
        count++
      }
      else {
        count = 1;
      }
      localStorage.setItem('record count', count);
    };

    //////////////////////////////
    // Audio Callback
    //////////////////////////////
    var translateAudio = function translateAudio(blob) {
      var url = URL.createObjectURL(blob),
          request = new XMLHttpRequest();

      source.disabled = true;
      target.disabled = true;
      body.setAttribute('data-disabled', true);
      microphone.setAttribute('data-disabled', true);
      translated.innerHTML = '';

      request.open('GET', url, true);
      request.responseType = 'blob';
      request.onload = function () {
        var formData = new FormData(),
            xhr = new XMLHttpRequest(),
            blob,
            player;

        console.log(source.value);
        console.log(target.value);

        formData.append('audio', this.response);
        formData.append('source', JSON.stringify({
          'code': source.value,
          'model': source.getAttribute('data-model')
        }));
        formData.append('target', JSON.stringify({
          'code': target.value,
          'voice': target.options[target.selectedIndex].getAttribute('data-voice')
        }));

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
      // var button = document.getElementById('record'),
          // hello = document.getElementById('hello'),
      var url;

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

      microphone.addEventListener('click', function () {
        if (!microphone.hasAttribute('data-disabled')) {
          if (microphone.getAttribute('data-recording')) {
            microphone.removeAttribute('data-recording');
            microphone.value = 'Record';
            recorder && recorder.stop();
            recorder.exportWAV();
            recorder.clear();
            console.log('Done Recording');
          }
          else {
            microphone.setAttribute('data-recording', true);
            microphone.value = 'Stop Recording';
            recorder && recorder.record();
            console.log('Recording...');
          }
        }
      });
    });
  }
}(window.Recorder));