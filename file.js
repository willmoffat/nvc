// Based on https://github.com/GoogleChrome/chrome-app-samples
// Note(wdm) Rewritten using Promises.

function chooseFile() {
  return new Promise(function(reject, resolve) {
    // TODO(wdm) This doesn't seem to restrict. Do I care?
    var accepts = [{mimeTypes: ['text/*'], extensions: ['txt']}];
    var cb = function(theEntry) {
      if (!theEntry) {
        return reject('No file selected.');
      }
      // TODO(wdm) Need error check?
      chrome.storage.local.set(
          {'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
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
function restoreChosenFile() {
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get('chosenFile', function(items) {
      if (!items.chosenFile) {
        return reject(new Error('no filename in localstorage'));
      }

      chrome.fileSystem.isRestorable(items.chosenFile, function(isRestorable) {
        if (!isRestorable) {
	  // TODO(wdm): When does this happen?
          return reject(new Error('file is not restorable'));
        }
        console.info("Restoring " + items.chosenFile);
        chrome.fileSystem.restoreEntry(items.chosenFile, function(chosenEntry) {
          if (!chosenEntry) {
            return reject(new Error('failed to load file'));
          }
          resolve(chosenEntry);
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
