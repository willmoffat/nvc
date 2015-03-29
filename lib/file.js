// Based on https://github.com/GoogleChrome/chrome-app-samples
// Note(wdm) Rewritten using Promises.

var file = (function() {
  "use strict";

  function choose() {
    return new Promise(function(resolve, reject) {
      // TODO(wdm) This doesn't seem to restrict. Do I care?
      var accepts = [{mimeTypes: ['text/*'], extensions: ['txt']}];
      var cb = function(fileEntry) {
        if (!fileEntry) {
          return reject(new Error('No file selected.'));
        }
        localstore.storeFileRef(chrome.fileSystem.retainEntry(fileEntry));
        resolve(fileEntry);
      };
      chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, cb);
    });
  }

  function load(fileEntry) {
    return new Promise(function(resolve, reject) {
      fileEntry.file(function(file) {
        var r = new FileReader();
        r.onerror = reject;
        r.onload = function(e) { resolve(e.target.result); };
        r.readAsText(file);
      });
    });
  }

  // Convert a fileRef into a real fileEntry.
  function restoreFileEntry(fileRef) {
    return new Promise(function(resolve, reject) {
      chrome.fileSystem.isRestorable(fileRef, function(isRestorable) {
        if (!isRestorable) {
          // TODO(wdm): When does this happen?
          return reject(new Error('file is not restorable'));
        }
        console.info("Restoring " + fileRef);
        chrome.fileSystem.restoreEntry(fileRef, function(fileEntry) {
          if (!fileEntry) {
            return reject(new Error('failed to load file'));
          }
          resolve(fileEntry);
        });
      });
    });
  }

  // Returns a promise of a file which can be loaded.
  function restore() { return localstore.getFileRef().then(restoreFileEntry); }

  function save(writableEntry, blob) {
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

  return {
    restore: restore,
    load: load,
    save: save,
    choose: choose,
  };
})();
