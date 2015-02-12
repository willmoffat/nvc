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

  function highlight(terms, text) {
    text = safeHtml(text);
    if (terms && terms.length) {
      var regexStr = terms.map(escapeRegExp).join('|');
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
      var updatedNote = DB.parseNote(textarea.value, selected);
      model.setNote(selected, updatedNote);
      // Update the listed item.
      onInput();
    }
  }

  function setSelected(i) {
    if (typeof selected === 'number') {
      var old = s('.selected', true);
      if (old) {
        old.classList.remove('selected');
      }
    }
    selected = i;
    if (typeof selected === 'number') {
      var li = s('li[data-id="' + i + '"]');
      li.classList.add('selected');
      // Set textarea to current note.
      updateTextArea(model.getNote(selected));
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
    if (!results || !results.length) {
      // Display all notes.
      html = model.getNotes().map(function(note) {
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
    noteList.innerHTML = html.join('\n');
    setSelected(selected);
  }

  // TOOD(wdm) Do something with score?
  var inputEl = s('#search');
  function onInput(e) {
    var q = inputEl.value;
    var results;
    var terms;
    if (q.length) {
      results = index.search(q);
      terms = q.split(/\s+/);
    }
    displayMatches(terms, results);
  }

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

  function init(notes) {
    createIndex(notes);
    displayMatches();
    return notes;
  }

  return {
    onInput: onInput,
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
    setNote: function setNote(i, note) { notes[i] = note; },
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


function updateTextArea(note) {
  textarea.value = note.text;
  // textarea.focus();
  // TODO(wdm) Restore actual previous position.
  // textarea.setSelectionRange(0, 0);
  // textarea.scrollTop = 0;
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

function onChooseFile() {
  chooseFile().then(showFilename).catch(showError);
}

function showFilename(fileEntry_) {
  fileEntry = fileEntry_;
  s('#filename').textContent = fileEntry.name;
  return fileEntry;
}

function doSave() {
  if (!dirtMonitor.isDirty) {
    console.log('save skipped: not dirty');
    return Promise.resolve();
  }
  var blob = DB.notesAsBlob();
  return writeFileEntry(fileEntry, blob)
      .then(dirtMonitor.setClean)
      .catch(showError);
}

function doClose() {
  doSave().then(window.close);
}

function doSelectOrCreateNote() {
  // TODO(wdm)
}

//////////////////
// Key Handling //
//////////////////

var CODE_W = 'W'.charCodeAt(0);
var CODE_S = 'S'.charCodeAt(0);
var CODE_1 = '1'.charCodeAt(0);
var CODE_ESC = 27;
var CODE_ENTER = 13;

function onKeydown(e) {
  // Dismiss (with save): ESCAPE, Alt-1, Ctrl-W
  if ((e.keyCode === CODE_ESC) || (e.altKey && e.keyCode === CODE_1) ||
      (e.ctrlKey && e.keyCode === CODE_W)) {
    e.preventDefault();
    doClose();
    return;
  }

  // Save: Ctrl-S
  if (e.ctrlKey && e.keyCode === CODE_S) {
    e.preventDefault();
    doSave();
    return;
  }

  // New note (press enter in the search box)
  if (e.keyCode == CODE_ENTER && e.target.id === "search") {
    doSelectOrCreateNote();
  }
}



function init() {
  restoreChosenFile()
      .then(showFilename)
      .then(loadFileEntry)
      .then(DB.parse)
      .then(model.init)
      .then(search.init)
      .catch(showError);

  window.addEventListener('keydown', onKeydown);
  textarea.addEventListener('input', dirtMonitor.setDirty);
  s('#chooseFile').addEventListener('click', onChooseFile);
  s('#noteList').addEventListener('click', search.click);
  s('#search').addEventListener('input', search.onInput);
}

init();
