// UI code.
"use strict";

function s(selector, opt_silent) {
  var el = document.querySelector(selector);
  if (!el && !opt_silent) {
    throw new Error("Could not find " + selector);
  }
  return el;
}

var textarea = s('textarea');
var errlog = s('#errlog');

function toArray(nodeList) {
  return Array.prototype.slice.call(nodeList);
}

function showError(err) {
  console.error(err, err.stack);
  if (!errlog.textContent) {
    errlog.textContent = 'Error: ';
  }
  errlog.textContent += err + '\n';
}

///////////////
// Resizable //
///////////////

(function() {
  var resizeEl = s('#noteList');

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

  var index;
  var selected = null;
  var searchEl = s('#search');

  function createIndex(notes) {
    index = lunr(function() {
      this.field('title', {boost: 10});
      this.field('text');
      this.ref('id');
    });
    notes.forEach(function(n) { index.add(n); });
  }

  // Store any edits in the textarea.
  function storeEdits() {
    if (typeof selected === "number") {
      var old = model.getNote(selected);
      if (old.text === textarea.value) {
        return;
      }
      var updatedNote = DB.parseNote(textarea.value, selected);
      model.setNote(selected, updatedNote);
      // Update the listed item.
      display();
    }
  }

  function resetSelected() {
    searchEl.value = '';
    searchEl.focus();
    setSelected(null);
  }

  function setSelected(i) {
    if (typeof selected === 'number') {
      storeEdits();
      var old = s('.selected', true);
      if (old) {
        old.classList.remove('selected');
      }
    }
    selected = i;
    if (typeof selected === 'number') {
      var li = s('li[data-id="' + i + '"]');
      li.classList.add('selected');
      li.scrollIntoViewIfNeeded();
      // Set textarea to current note.
      var focus = false;
      updateTextArea(model.getNote(selected), focus);
    } else {
      textarea.value = '';
    }
  }

  var noteListEl = s('#noteList');

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

  // highlight terms.
  function displayMatches(terms, results) {
    var html;
    var visibleNotes = {};

    if (!results || !results.length) {
      // Display all notes.
      html = model.getNotes().map(function(note) {
        visibleNotes[note.id] = true;
        return htmlDisplayNote(terms, note);
      });
    } else {
      // Filter by term and order by score.
      html = results.map(function(r) {
        var id = parseInt(r.ref, 10);
        var note = model.getNote(id);
        visibleNotes[id] = true;
        return htmlDisplayNote(terms, note);
      });
    }
    noteList.innerHTML = html.join('\n');
    if (visibleNotes[selected]) {
      setSelected(selected);
    }
  }

  function onInput() {
    setSelected(null);
    display();
  }

  // Display notes that match the current search terms (or all).
  // TOOD(wdm) Do something with score?
  function display() {
    var q = searchEl.value;
    var results;
    var terms;

    if (q.length) {
      results = index.search(q);
      terms = q.split(/\s+/);
    }
    displayMatches(terms, results);
  }

  function moveSelection(isDown) {
    var toSelect;
    var old = s('.selected', true);
    if (!old) {
      toSelect = noteListEl.firstChild;
    } else {
      toSelect = isDown ? old.nextElementSibling : old.previousElementSibling;
    }
    if (toSelect) {
      var id = parseInt(toSelect.dataset.id, 10);
      setSelected(id);
    }
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
    var id = parseInt(t.dataset.id, 10);
    setSelected(id);
  }

  function selectOrCreateNote() {
    if (typeof selected !== 'number') {
      // One newline is required to mark end of title. The next newline is
      // optional but looks nicer.
      var rawText = searchEl.value + '\n\n';
      textarea.value = rawText;  // HACK: required because otherwise storeEdits
                                 // will wipe out our new note.
      var note = model.newNote(rawText);
      index.add(note);
      display();  // HACK: need to add listitem to ul.
      setSelected(note.id);
    }
    var focus = true;
    updateTextArea(model.getNote(selected), focus);
  }

  function init(notes) {
    createIndex(notes);
    displayMatches();
    return notes;
  }

  return {
    onInput: onInput,
    selectOrCreateNote: selectOrCreateNote,
    moveSelectionUp: moveSelectionUp,
    moveSelectionDown: moveSelectionDown,
    resetSelected: resetSelected,
    click: click,
    storeEdits: storeEdits,
    init: init
  };
})();


// TODO(wdm) Does this actually buy us anything over a global 'notes'?
var model = (function() {

  // In memory note objects.
  var notes = [];

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
      saveNoteLocal(note);  // TODO(wdm) .then() ?
    },
    getNote: function getNote(i) { return notes[i]; },
    getNotes: function getNotes() { return notes; }
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


//////////////
// TextArea //
//////////////

function updateTextArea(note, focus) {
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

function setCaret(elem, pos) {
  var range = elem.createTextRange();
  range.collapse(true);
  range.moveEnd('character', pos);
  range.moveStart('character', pos);
  range.select();
}

///////////////
/// File UI ///
///////////////

var fileEntry;

function maybeChooseFile() {
  if (fileEntry) {
    return Promise.resolve(fileEntry);
  }
  return onChooseFile();
}

function onChooseFile() {
  return chooseBackupFile().then(showFilename).catch(showError);
}

function showFilename(fileEntry_) {
  fileEntry = fileEntry_;
  var name = '[no backup file]';
  if (fileEntry) {
     name = fileEntry.name;
  }
  s('#filename').textContent = name;
  return fileEntry;
}

function doSave() {
  if (!dirtMonitor.isDirty) {
    console.log('save skipped: not dirty');
    return Promise.resolve();
  }
  var blob = DB.notesAsBlob();
  return maybeChooseFile()
      .then(function(fileEntry) { return writeFileEntry(fileEntry, blob); })
      .then(dirtMonitor.setClean)
      .catch(showError);
}

function doClose() {
  doSave().then(window.close);
}

//////////////////
// Key Handling //
//////////////////

var keyHandler = (function() {
  var KEY_W = 'W'.charCodeAt(0);
  var KEY_S = 'S'.charCodeAt(0);
  var KEY_1 = '1'.charCodeAt(0);
  var KEY_ESC = 27;
  var KEY_ENTER = 13;
  var KEY_UP = 38;
  var KEY_DOWN = 40;

  // return values don't matter.
  function cmd(e, func) {
    e.preventDefault();
    func();
  }

  return function keyHandler(e) {
    var Alt = e.altKey;
    var Ctrl = e.ctrlKey;
    var key = e.keyCode;

    // Dismiss (with save)
    if ((Alt && key === KEY_1) || (Ctrl && key === KEY_W)) {
      return cmd(e, doClose);
    }

    // Reset (deselect note and start new search)
    if (key === KEY_ESC) {
      return cmd(e, search.resetSelected);
    }

    // Save: Ctrl-S
    if (Ctrl && key === KEY_S) {
      return cmd(e, doSave);
    }

    if (e.target !== textarea) {
      if (key == KEY_ENTER) {
        return cmd(e, search.selectOrCreateNote);
      }
      if (key === KEY_DOWN) {
        return cmd(e, search.moveSelectionDown);
      }
      if (key === KEY_UP) {
        return cmd(e, search.moveSelectionUp);
      }
    }
  }
})();

/* Debug: show whole store:
chrome.storage.local.get(null, function(s) { console.log('store', s) });
*/

function loadLocalNotes() {
  return new Promise(function(resolve, reject) {
    // Load everything in local storage.
    chrome.storage.local.get(null, function(items) {
      var notes = [];
      for (var key in items) {
        if (key.indexOf('NOTE.') === 0) {
          var id = parseInt(key.substr(5), 10);
          var rawText = items[key];
          var note = DB.parseNote(rawText, id);
          notes.push(note);
        } else {
          console.log('loadLocalNotes: ignoring', key);
        }
      }
      resolve(notes);
    });
  });
}

function saveNoteLocal(note) {
  return new Promise(function(resolve, reject) {
    var key = 'NOTE.' + note.id;
    var obj = {};
    obj[key] = note.text;

    chrome.storage.local.set(obj, function() { resolve(); });
  });
}

function init() {
  // TODO(wdm) Import
  // .then(loadFileEntry)
  //          .then(DB.parse)

  restoreBackupFile()
      .then(showFilename)
      .then(loadLocalNotes)
      .then(model.init)
      .then(search.init)
      .catch(showError);

  window.addEventListener('keydown', keyHandler);
  textarea.addEventListener('input', dirtMonitor.setDirty);
  s('#chooseFile').addEventListener('click', onChooseFile);
  s('#noteList').addEventListener('click', search.click);
  s('#search').addEventListener('input', search.onInput);
}

init();
