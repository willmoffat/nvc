// From https://github.com/GoogleChrome/chrome-app-samples

/*
Copyright 2012 Google Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
Author: Eric Bidelman (ericbidelman@chromium.org)
Updated: Joe Marini (joemarini@google.com)
*/

var chosenEntry = null;
var textarea = document.querySelector('textarea');
var chooseFile = document.querySelector('#choose_file');

function errorHandler(e) {
  console.error(e);
}

chooseFile.addEventListener('click', onChooseFile);

function onChooseFile(e) {
  var accepts = [{
    mimeTypes: ['text/*'],
    extensions: ['txt']  // TODO(wdm) Not working, but should it?
  }];
  chrome.fileSystem.chooseEntry(
      {type: 'openFile', accepts: accepts}, function(theEntry) {
        if (!theEntry) {
          output.textContent = 'No file selected.';
          return;
        }
        // use local storage to retain access to this file
        chrome.storage.local.set(
            {'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
        loadFileEntry(theEntry);
      });
}

// for files, read the text content into the textarea
function loadFileEntry(_chosenEntry) {
  chosenEntry = _chosenEntry;
  chosenEntry.file(function(file) { readAsText(chosenEntry, updateTextArea); });
}

function restoreChosenFile() {
  chrome.storage.local.get('chosenFile', function(items) {
    if (items.chosenFile) {
      // if an entry was retained earlier, see if it can be restored
      chrome.fileSystem.isRestorable(items.chosenFile, function(bIsRestorable) {
        // the entry is still there, load the content
        console.info("Restoring " + items.chosenFile);
        chrome.fileSystem.restoreEntry(items.chosenFile, function(chosenEntry) {
          if (chosenEntry) {
            loadFileEntry(chosenEntry)
          }
        });
      });
    }
  });
}

function readAsText(fileEntry, callback) {
  fileEntry.file(function(file) {
    var reader = new FileReader();

    reader.onerror = errorHandler;
    reader.onload = function(e) { callback(e.target.result); };

    reader.readAsText(file);
  });
}

function writeFileEntry(writableEntry, blob, callback) {
  if (!writableEntry) {
    console.error('Nothing selected.');
    return;
  }

  // Note(wdm) This API seems too complex. Note how onwriteend has to be
  // overriden twice.
  writableEntry.createWriter(function(writer) {
    try {
      var aborter = function() {
        console.error("Write operation taking too long, aborting!" +
                      " (current writer readyState is " + writer.readyState +
                      ")");
        writer.abort();
      };

      var watchdog = setTimeout(aborter, 4 * 1000);

      writer.onerror = function(e) {
        clearTimeout(watchdog);
        errorHandler(e);
      };

      writer.onwriteend = function() {
        writer.onwriteend = function() {
          clearTimeout(watchdog);
          callback();
        };
        writer.seek(0);
        writer.write(blob);
      };
      writer.truncate(blob.size);

    } catch (e) {
      console.error(e, e.stack);
    }

  }, errorHandler);
}
