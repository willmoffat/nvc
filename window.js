// UI code.
"use strict";

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

///////////////
// Resizable //
///////////////

(function() {
  var resizeEl = s('#searchResults');

  function handleMove(e) {
    var w = e.clientX - resizeEl.offsetLeft - 4;
    resizeEl.style.width = w + 'px';
  }

  s('#dragbar')
      .addEventListener('mousedown', function(e) {
        document.body.classList.add('resizing');
        e.preventDefault();
        document.addEventListener('mousemove', handleMove);
      });

  document.addEventListener('mouseup', function(e) {
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', handleMove);
  });
})();


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

var highlight = (function() {
  var div = document.createElement('div');

  function safeHtml(text) {
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegExp(str) {
    return str.replace(/[.^$*+?()[{\\|\]-]/g, '\\$&');
  }

  // Don't hightlight 1 and 2 char words.
  // TODO(wdm) Highlight [], #.
  function keepTerm(term) { return term.length > 2; }

  function highlight(terms, text) {
    text = safeHtml(text);
    if (terms && terms.length) {
      var regexStr = terms.filter(keepTerm).map(escapeRegExp).join('|');
      var regex = new RegExp(regexStr, 'gi');
      text = text.replace(regex, '<q>$&</q>');
    }
    return text;
  }
  return highlight;
})();

var search = (function() {

  var searchIndex;              // Lunr index.
  var selectedEl;               // Currently selected search result element.
  var searchEl = s('#search');  // Search text input.

  function createIndex(notes) {
    searchIndex = lunr(function() {
      this.field('title', {boost: 10});
      this.field('text');
      this.ref('id');
    });
    notes.forEach(function(n) { searchIndex.add(n); });
  }

  function getNoteId(resultEl) {
    var id = parseInt(resultEl.dataset.id, 10);
    // Check for NaN or out of range ids.
    // TODO(wdm) MAX_NOTE_ID?
    if (!(id >= 0 && id < 10000)) {
      throw new Error('invalid id ' + id);
    }
    return id;
  }

  function getSelectedNoteId() {
    if (!selectedEl) {
      return null;
    }
    return getNoteId(selectedEl);
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

  // Store any edits in the textarea.
  function storeEdits() {
    if (!selectedEl) {
      return;
    }
    var selectedId = getSelectedNoteId();
    var old = model.getNote(selectedId);
    var text = editor.getText();
    if (old.text === text) {
      return;
    }
    var updatedNote = DB.parseNote(text, selectedId);
    model.setNote(selectedId, updatedNote);
    // Update the listed item.
    displayNotes();
  }

  function clearSearch() {
    searchEl.value = '';
    searchEl.focus();
    onInput();
  }

  function unselect() {
    if (selectedEl) {
      storeEdits();
      selectedEl.classList.remove('selected');
    }
  }

  function setSelected(id) {
    unselect();
    selectedEl = s('li[data-id="' + id + '"]');
    if (!selectedEl) {
      throw new Error('could not find search result with id ' + id);
    }
    selectedEl.classList.add('selected');
    selectedEl.scrollIntoViewIfNeeded();
    // Set textarea to current note.
    var focus = false;
    editor.setText(model.getNote(id), focus);
  }

  var searchResultsEl = s('#searchResults');

  // TODO(wdm) modify summary to show highlighted terms?
  function htmlDisplayNote(terms, note) {
    if (typeof note.id !== 'number') {
      throw new Error("note without id", note);
    }
    var ID = note.id;
    var TITLE = highlight(terms, note.title);
    var SUMMARY = highlight(terms, note.summary);
    var html = '<li data-id="' + ID + '"><b>' + TITLE + '</b><i>' + SUMMARY +
               '</i></li>';
    return html;
  }

  function byTitle(a, b) {
    if (a.title > b.title) {
      return 1;
    }
    if (a.title < b.title) {
      return -1;
    }
    return 0;
  }

  // highlight terms.
  function displayMatches(terms, results) {
    var html;

    if (!results || !results.length) {
      // Display all notes.
      html = model.getNotes().sort(byTitle).map(function(note) {
        return htmlDisplayNote(terms, note);
      });
    } else {
      // Filter by term and order by score.
      html = results.map(function(r) {
        var id = parseInt(r.ref, 10);
        var note = model.getNote(id);
        return htmlDisplayNote(terms, note);
      });
    }
    searchResults.innerHTML = html.join('\n');
  }

  function onInput() {
    unselect();
    displayNotes();
  }

  // Display notes that match the current search terms (or all).
  // TOOD(wdm) Do something with score?
  function displayNotes() {
    var q = searchEl.value;
    var results;
    var terms;

    if (q.length) {
      results = searchIndex.search(q);
      terms = q.split(/\s+/);
    }
    var selectedId = getSelectedNoteId();
    displayMatches(terms, results);
    if (selectedId) {
      setSelected(selectedId);
    }
  }

  function setSearchText(text) {
    searchEl.value = text;
    searchEl.setSelectionRange(0, text.length);
  }

  function moveSelection(isDown) {
    var toSelect;
    var old = s('.selected', true);
    if (!old) {
      toSelect = searchResultsEl.firstChild;
    } else {
      toSelect = isDown ? old.nextElementSibling : old.previousElementSibling;
    }
    if (!toSelect) {
      return;
    }
    var id = getNoteId(toSelect);
    setSelected(id);
    var note = model.getNote(id);
    setSearchText(note.title);
  }

  function moveSelectionUp() { moveSelection(false); }

  function moveSelectionDown() { moveSelection(true); }

  function click(e) {
    var t = e.target;
    // Find the enclosing <li>.
    for (var i = 0; t.nodeName !== 'LI' && i < 3; i++) {
      t = t.parentNode;
    }
    if (t.nodeName !== 'LI') {
      console.error('Could not find <li>', e.target, t);
      return;
    }
    var id = getNoteId(t);
    setSelected(id);
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


// TODO(wdm) Does this actually buy us anything over a global 'notes'?
var model = (function() {

  // In memory note objects.
  var notes = [];

  function notUndefined(n) { return !!n; }

  return {
    init: function init(notes_) {
      notes = notes_;
      return notes;
    },
    newNote: function(rawText) {
      var id = notes.length;
      var note = DB.parseNote(rawText, id);
      notes.push(note);
      return note;
    },
    setNote: function setNote(i, note) {
      notes[i] = note;
      localstore.saveNote(note);  // TODO(wdm) .then() ?
    },
    deleteNote: function deleteNote(i) { delete notes[i]; },
    getNote: function getNote(i) {
      var note = notes[i];
      if (!note) {
        throw new Error('invalid note index', i);
      }
      return notes[i];
    },
    getNotes: function getNotes() { return notes.filter(notUndefined); },
  };

})();

////////
// DB //
////////

var DB = (function() {

  // TODO(wdm) Check that SEPERATOR does not appear in notes.
  var SEPERATOR = '\n[//]: # (NVC: Do not edit this line)\n\n';

  function parse(rawText) {
    var rawNotes = rawText.split(SEPERATOR);
    var notes = rawNotes.map(parseNote);
    return notes;
  }

  function parseNote(rawNote, i) {
    if (typeof i !== 'number') {
      throw new Error('tried to create note without index');
    }
    var firstLine = rawNote.indexOf('\n');
    return {
      id: i,
      title: rawNote.substring(0, firstLine),
      summary: rawNote.substring(firstLine + 1, 150),
      text: rawNote
    };
  }

  // TODO(wdm) Better name!
  function notesAsBlob() {
    search.storeEdits();  // Grabs any changes in textarea.
    var texts = model.getNotes().map(function(note) { return note.text; });
    var rawText = texts.join(SEPERATOR);
    return new Blob([rawText], { 'type' : 'text/plain' });
  }
  return {
    parse: parse,
    parseNote: parseNote,
    notesAsBlob: notesAsBlob,
  };
})();


////////////
// Editor //
////////////

var editor = (function() {

  var textarea = s('#editor');

  function getText() { return textarea.value; }

  function setText(note, focus) {
    if (!note) {
      throw new Error('invalid note', note);
    }
    var text = note.text;
    textarea.value = text;
    if (focus) {
      textarea.focus();
      // Move to first line after title.
      var pos = note.title.length + 1;
      if (text[pos] === '\n') {
        pos++;
      }
      textarea.setSelectionRange(pos, pos);
      textarea.scrollTop = 0;
    }
  }

  function clearText() { textarea.value = ''; }

  /*
  function setCaret(elem, pos) {
    var range = elem.createTextRange();
    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
  */

  return {
    getText: getText,
    setText: setText,
    clearText: clearText,
  };
})();

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
    var blob = DB.notesAsBlob();
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
  function loadNotes() { return restore().then(file.load).then(DB.parse); }

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

//////////////////
// Key Handling //
//////////////////

function handleKeys(handlers) {
  var keyNames = {
    8: 'Backspace',
    13: 'Enter',
    27: 'Escape',
    38: 'Up',
    40: 'Down',
  };
  return function keyHandler(e) {
    var k = e.keyCode;
    var key;
    if (k > 48) {
      key = String.fromCharCode(k);
    } else {
      key = keyNames[k];
    }
    if (!key) {
      return;
    }
    var pressed = (e.ctrlKey ? 'Ctrl-' : '') + (e.altKey ? 'Alt-' : '') + key;
    var handler = handlers.globalKeys[pressed];
    if (!handler && (e.target.id !== 'editor')) {
      handler = handlers.globalExceptInEditor[pressed];
    }
    if (handler) {
      e.preventDefault();
      handler();
    }
  };
}


////////////////
// localstore //
////////////////

var localstore = (function() {

  // This is for debugging. To replace all notes with backup versions:
  //   localstore.replaceStoreWith(model.getNotes())
  function replaceStoreWith(notes) {
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
          console.warn('No APP.BACKUP ref in localstorage');
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
            var note = DB.parseNote(rawText, id);
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
    replaceStoreWith: replaceStoreWith,
    debugAll: function() {
      chrome.storage.local.get(null, function(s) { console.log('store', s) });
    },
  };

})();

//////////
// Init //
//////////

function init() {
  var useFileSystem = false;  // TODO(wdm) Needs a sensible switch.
  var notesP;
  if (useFileSystem) {
    notesP = backup.loadNotes();
  } else {
    notesP = localstore.loadNotes();
    // Show the name of the backup file which will be used for saving.
    backup.restore();
  }
  notesP.then(model.init).then(search.init).catch(showError);

  var keyHandlers = {
    globalKeys: {
      'Escape': search.clearSearch,
      'Alt-1': win.hide,
      'Ctrl-W': win.close,
      'Ctrl-S': backup.save,
    },
    globalExceptInEditor: {
      'Enter': search.selectOrCreateNote,
      'Down': search.moveSelectionDown,
      'Up': search.moveSelectionUp,
      'Ctrl-Backspace': search.deleteSelectedNote,
    }
  };

  window.addEventListener('keydown', handleKeys(keyHandlers));

  s('#editor').addEventListener('input', dirtMonitor.setDirty);
  // s('#chooseFile').addEventListener('click', backup.onChooseFile);
  s('#searchResults').addEventListener('click', search.click);
  s('#search').addEventListener('input', search.onInput);
}

init();
