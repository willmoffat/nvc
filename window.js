// UI code.
"use strict";


function s(s) {
  return document.querySelector(s);
}
var resizeEl = s('#noteList');

function handleMove(e) {
  var h = e.clientY - resizeEl.offsetTop - 4;
  resizeEl.style.height = h + 'px';
}


function resizeInit() {
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
}

resizeInit();



var textarea = document.querySelector('textarea');
var errlog = document.querySelector('#errlog');

function toArray(nodeList) {
  return Array.prototype.slice.call(nodeList);
}

function showError(err) {
  console.error(err, err.stack);
  errlog.textContent += err + '\n';
}

///////////
// Dirty //
///////////

var dirtMonitor = (function() {
  var isDirty = false;
  var titlebar = document.querySelector('.titlebar');
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
    var regexStr = terms.map(escapeRegExp).join('|');
    var regex = new RegExp(regexStr, 'gi');
    text = safeHtml(text);
    return text.replace(regex, '<b>$&</b>');
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

  function setSelected(opt_index) {
    // Calling setSelected without an index just persists any textarea changes.
    var i = (typeof opt_index === 'number') ? opt_index : selected;

    if (typeof selected === "number") {
      // Store any edits before switching note.
      var updatedNote = DB.parseNote(textarea.value);
      model.setNote(selected, updatedNote);
      // HACK: update list item.
    }
    selected = i;
    // HACK: show selection.
    // Set textarea to current note.
    updateTextArea(model.getNote(selected));
  }

  var noteListEl = document.querySelector('#noteList');

  function displayAll() {
    var terms = [];
    // TODO(wdm) What order?
    var html = model.getNotes().map(function(note) {
      return displayNote(terms, note);
    }).join('\n');
    noteList.innerHTML = html;
  }

  function displayNote(terms, note) {
    return '<li data-id="' + note.id + '"><span>' +
           highlight(terms, note.title) + '</span><i>' +
           highlight(terms, note.summary) + '</i></span></li>';
    // TODO(wdm) modify summary to show highlighted terms?
  }

  function displayMatches(terms, results) {
    if (!results || !results.length) {
      displayAll();
      return;
    }
    // Ordered by result score.
    var html = results.map(function(r) {
      var id = parseInt(r.ref, 10);
      var note = model.getNote(id);
      return displayNote(terms, note);
    }).join('\n');
    noteList.innerHTML = html;
  }

  // TOOD(wdm) Do something with score?
  var inputEl = document.querySelector('#search');
  function onInput(e) {
    var q = inputEl.value;
    if (!q.length) {
      displayAll();
      return;
    }

    var results = index.search(q);
    var terms = q.split(/\s+/);
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
    var id = t.dataset.id;
    var note = model.getNote(id);
    updateTextArea(note);
  }

  function init(notes) {
    createIndex(notes);
    displayAll();
    return notes;
  }

  return {
    onInput: onInput,
    click: click,
    setSelected: setSelected,
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
    var firstLine = rawNote.indexOf('\n');
    return {
      id: i,
      title: rawNote.substring(0, firstLine),
      summary: rawNote.substring(firstLine + 1, 50),
      text: rawNote
    };
  }

  // TODO(wdm) Better name!
  function notesAsBlob() {
    search.setSelected();  // Grabs any changes in textarea.
    var texts = model.getNotes().map(function(note) { return note.text; });
    var rawText = texts.join(SEPERATOR);
    return new Blob([rawText], {
      type:
        'text/plain'
    });
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
  document.querySelector('#filename').textContent = fileEntry.name;
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
  document.querySelector('#chooseFile').addEventListener('click', onChooseFile);
  document.querySelector('#noteList').addEventListener('click', search.click);
  document.querySelector('#search').addEventListener('input', search.onInput);
}

init();
