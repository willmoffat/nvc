// Based on https://github.com/GoogleChrome/chrome-app-samples
// Note(wdm) Rewritten using Promises.

var FILENAME_KEY = 'APP.BACKUP';

function chooseBackupFile() {
  return new Promise(function(resolve, reject) {
    // TODO(wdm) This doesn't seem to restrict. Do I care?
    var accepts = [{mimeTypes: ['text/*'], extensions: ['txt']}];
    var cb = function(theEntry) {
      if (!theEntry) {
        return reject(new Error('No file selected.'));
      }
      // TODO(wdm) Need error check?
      var obj = {};
      obj[FILENAME_KEY] = chrome.fileSystem.retainEntry(theEntry);
      chrome.storage.local.set(obj);
      resolve(theEntry);
    };
    chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, cb);
  });
}

function loadFileEntry(fileEntry) {
  return new Promise(function(resolve, reject) {
    fileEntry.file(function(file) {
      var r = new FileReader();
      r.onerror = reject;
      r.onload = function(e) { resolve(e.target.result); };
      r.readAsText(file);
    });
  });
}

// Returns a promise of a file which can be loaded.
function restoreBackupFile() {
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get(FILENAME_KEY, function(items) {
      var filename = items[FILENAME_KEY];
      if (!filename) {
	console.warn('No', FILENAME_KEY, 'in localstorage');
        return resolve(null);
      }

      chrome.fileSystem.isRestorable(filename, function(isRestorable) {
        if (!isRestorable) {
          // TODO(wdm): When does this happen?
          return reject(new Error('file is not restorable'));
        }
        console.info("Restoring " + filename);
        chrome.fileSystem.restoreEntry(filename, function(fileEntry) {
          if (!fileEntry) {
            return reject(new Error('failed to load file'));
          }
          resolve(fileEntry);
        });
      });
    });
  });
}

function writeFileEntry(writableEntry, blob) {
  return new Promise(function(resolve, reject) {
    if (!writableEntry) {
      return reject(new Error('no file to write'));
    }
    var t0 = Date.now();
    // Note(wdm) This API seems too complex. Note how onwriteend has to be
    // overriden twice.
    var cb = function(writer) {
      var aborter = function() {
        writer.abort();
        reject(new Error('write operation timeout'));
      };

      var watchdog = setTimeout(aborter, 4 * 1000);

      writer.onerror = function(e) {
        clearTimeout(watchdog);
        reject(e);
      };

      writer.onwriteend = function() {
        writer.onwriteend = function() {
          clearTimeout(watchdog);
          console.log('write time: ', (Date.now() - t0) / 1000);
          resolve();
        };
        writer.seek(0);
        writer.write(blob);
      };
      writer.truncate(blob.size);
    };
    writableEntry.createWriter(cb, reject);
  });
}
