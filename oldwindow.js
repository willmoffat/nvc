// Main code. Not testable.
"use strict";


///////////
// Dirty //
///////////

var dirtMonitor = (function() {
  var isDirty = false;
  var titlebar = s('.titlebar');
  var setDirty = function() {
    if (!isDirty) {
      isDirty = true;
      // TODO(wdm) Do I still want to show if exported file is outdated?
      titlebar.classList.add('dirty');
    }
  };
  var setClean = function() {
    if (isDirty) {
      isDirty = false;
      titlebar.classList.remove('dirty');
    }
  };
  return {
    isDirty: function() { return isDirty; },
    setDirty: setDirty,
    setClean: setClean
  };
})();

////////////
// Search //
////////////

var search = (function() {

  var searchIndex;              // Lunr index.
  var selectedEl;               // Currently selected search result element.


  function createIndex(notes) {
    searchIndex = lunr(function() {
      this.field('title', {boost: 10});
      this.field('text');
      this.ref('id');
    });
    notes.forEach(function(n) { searchIndex.add(n); });
  }

  function deleteSelectedNote() {
    var id = getSelectedNoteId();
    if (!id) {
      return;
    }
    moveSelectionUp();
    var note = model.getNote(id);
    searchIndex.remove(note);
    model.deleteNote(id);
    dirtMonitor.setDirty();
    displayNotes();
    // TODO(wdm) Update the previous view, don't change the rest of the search
    // results.
  }

  function setSearchText(text) {
    searchEl.value = text;
    searchEl.setSelectionRange(0, text.length);
  }

  function selectOrCreateNote() {
    if (typeof selected !== 'number') {
      // One newline is required to mark end of title. The next newline is
      // optional but looks nicer.
      var rawText = searchEl.value + '\n\n';
      editor.setText(rawText);  // HACK: required because otherwise storeEdits
                                // will wipe out our new note.
      var note = model.newNote(rawText);
      searchIndex.add(note);
      displayNotes();  // HACK: need to add listitem to ul.
      setSelected(note.id);
    }
    var focus = true;
    editor.setText(model.getNote(selected), focus);
  }

  function init(notes) {
    createIndex(notes);
    displayMatches();
    return notes;
  }

  return {
    onInput: onInput,
    selectOrCreateNote: selectOrCreateNote,
    deleteSelectedNote: deleteSelectedNote,
    moveSelectionUp: moveSelectionUp,
    moveSelectionDown: moveSelectionDown,
    clearSearch: clearSearch,
    click: click,
    storeEdits: storeEdits,
    init: init
  };
})();


////////////
// Editor //
////////////


//////////////////
/// File Backup //
//////////////////

var backup = (function() {

  var backupFile = null;

  function save() {
    if (!dirtMonitor.isDirty) {
      console.log('save skipped: not dirty');
      return Promise.resolve();
    }
    search.storeEdits();  // Grabs any changes in textarea.
    var rawText = db.stringifyNotes(model.getNotes());
    var blob = new Blob([rawText], { 'type' : 'text/plain' });
    return file.save(backupFile, blob)
        .then(dirtMonitor.setClean)
        .catch(showError);
  }

  // If file.restore is empty, ask the user to select a notes file.
  // Show the filename and return a promise of the file.
  function restore() {
    var p = file.restore();
    return p.then(function(fileEntry) {
      if (!fileEntry) {
        console.warn('choose a backup file');  // TODO(wdm) Make an alert-like.
        p = file.choose().catch(showError);
      }
      return p.then(function(fileEntry) {
        win.showFilename(fileEntry);
        backupFile = fileEntry;
        return backupFile;
      });
    });
  }

  // Load notes from a file rather than local storage.
  // Returns a promise of a note array.
  function loadNotes() { return restore().then(file.load).then(db.parseFile); }

  return {
    save: save,
    loadNotes: loadNotes,
    restore: restore,
  };

})();

/////////
// win //
/////////

var win = (function() {
  return {
    hide: function() { chrome.app.window.current().hide(); },
    close: function() { backup.save().then(window.close); },
    showFilename: function(file) {
      s('#filename').textContent = (file && file.name) || '[no bakup file]';
    },
  };
})();



////////////////
// localstore //
////////////////

var localstore = (function() {

  function debugReplaceStoreWith(notes) {
    if (!notes || !notes.length) {
      throw new Error('invalid notes');
    }

    return getFileRef().then(function(fileRef) {
      // Note(wdm) Clears all of local storage!!
      chrome.storage.local.clear();

      setFileRef(fileRef);

      var savesP = notes.map(saveNote);
      return Promise.all(savesP).catch(showError);
    });
  }

  function setFileRef(fileRef) {
    // TODO(wdm) Need error check?
    chrome.storage.local.set({'APP.BACKUP': fileRef});
  }

  function getFileRef() {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get('APP.BACKUP', function(items) {
        var fileRef = items['APP.BACKUP'];
        if (!fileRef) {
          console.warn('No APP.BACKUP ref in localstore');
        }
        return resolve(fileRef);
      });
    });
  }

  function loadNotes() {
    return new Promise(function(resolve, reject) {
      // Load everything in local storage.
      chrome.storage.local.get(null, function(items) {
        var notes = [];
        for (var key in items) {
          if (key.indexOf('NOTE.') === 0) {
            var id = parseInt(key.substr(5), 10);
            var rawText = items[key];
            var note = db.parseNoteWithoutMetadata(rawText, {id: id});
            // Items may not be in order and some ids may be missing.
            // So we use fill a sparse array rather than using push().
            notes[id] = note;
          } else {
            console.log('loadNotes: ignoring', key);
          }
        }
        resolve(notes);
      });
    });
  }

  function saveNote(note) {
    return new Promise(function(resolve, reject) {
      var key = 'NOTE.' + note.id;
      var obj = {};
      obj[key] = note.text;
      chrome.storage.local.set(obj, resolve);
    });
  }

  return {
    setFileRef: setFileRef,
    getFileRef: getFileRef,
    loadNotes: loadNotes,
    saveNote: saveNote,
    debugReplaceStoreWith: debugReplaceStoreWith,
  };

})();

///////////
// Debug //
///////////
var debug = (function() {
  function showModel() {
    model.getNotes().forEach(function(note, i) {
      console.log('===' + i + ':' + note.id + '===\n' + note.text);
    });
  }

  function showLocalstore() {
    chrome.storage.local.get(null, function(items) {
      for (var k in items) {
        console.log('===' + k + '===\n' + items[k]);
      }
    });
  }
  return {
    showModel: showModel,
    showLocalstore: showLocalstore,
    replaceLocalstoreWithFile: function() {
      backup.loadNotes().then(function(notes) {
        localstore.debugReplaceStoreWith(notes);
      });
    },
  };
})();

//////////
// Init //
//////////

function init() {
  var useFileSystem = true;  // TODO(wdm) Needs a sensible switch.
  var notesP;
  if (useFileSystem) {
    notesP = backup.loadNotes();
  } else {
    notesP = localstore.loadNotes();
    // Show the name of the backup file which will be used for saving.
    backup.restore();
  }

  // TODO(wdm) Trigger more events when notes change?
  var observer = function(note) { localstore.saveNote(updatedNote); };

  notesP.then(function(notes) { return model.init(notes, observer); })
      .then(search.init)
      .catch(showError);



  // s('#chooseFile').addEventListener('click', backup.onChooseFile);
  s('#noteList').addEventListener('click', search.click);

}

init();


///////////
// Utils //
///////////

function s(selector, opt_silent) {
  var el = document.querySelector(selector);
  if (!el && !opt_silent) {
    throw new Error("Could not find " + selector);
  }
  return el;
}

function toArray(nodeList) {
  return Array.prototype.slice.call(nodeList);
}

function showError(err) {
  console.error(err, err.stack);
  var errlog = s('#errlog');
  if (!errlog.textContent) {
    errlog.textContent = 'Error: ';
  }
  errlog.textContent += err + '\n';
}
