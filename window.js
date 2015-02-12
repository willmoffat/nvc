// UI code.
"use strict";

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

var search = (function() {

  var index;
  var listItems;
  var selected = null;

  function createIndex() {
    index = lunr(function() {
      this.field('title', {boost: 10});
      this.field('text');
      this.ref('id');
    });
    DB.getNotes().forEach(function(n) { index.add(n); });
  }

  function setSelected(opt_index) {
    // Calling setSelected without an index just persists any textarea changes.
    var i = (typeof opt_index === 'number') ? opt_index : selected;

    if (typeof selected === "number") {
      // Store any edits before switching note.
      DB.getNotes()[selected] = DB.parseNote(textarea.value);  // HACK
      var listItem = document.querySelector('#noteList ul').children[selected];
      fillListItem(listItem, DB.getNotes()[selected]);
      listItem.classList.remove('selected');
    }
    selected = i;
    document.querySelector('#noteList ul')
        .children[selected]
        .classList.add('selected');
    // Set textarea to current note.
    updateTextArea(DB.getNotes()[i].text);
  }

  function showAll() {
    listItems.forEach(function(item) { item.style.display = ''; });
  }

  function hideAll() {
    listItems.forEach(function(item) { item.style.display = 'none'; });
  }

  function onInput(e) {
    var q = e.target.value;
    if (!q.length) {
      showAll();
      return;
    }

    var results = index.search(q);
    hideAll();
    results.forEach(function(r) {
      var i = parseInt(r.ref, 10);
      listItems[i].style.display = '';
    });
    // TOOD(wdm) Something with score?
  }

  function fillListItem(li, note) {
    li.children[0].textContent = note.title;
    li.children[1].textContent = note.summary;
  }

  function updateNoteList() {
    listItems = [];
    var ul = document.createElement('ul');
    DB.getNotes().forEach(function(note) {
      var li = document.createElement('li');
      li.innerHTML = '<span></span><i></i>';
      fillListItem(li, note);
      ul.appendChild(li);
      listItems.push(li);
    });
    document.querySelector('#noteList').appendChild(ul);
    setSelected(0);  // HACK?
  }

  function onClickList(e) {
    var target = e.target;
    // This is a nasty hack to move clicks on the <i> tags up to their <li>.
    if (target.parentNode.nodeName == 'LI') {
      target = target.parentNode;
    }
    if (target.nodeName !== 'LI') {
      return;
    }
    var list = toArray(document.querySelector('#noteList ul').children);
    var i = list.indexOf(target);
    setSelected(i);
  }

  function init() {
    updateNoteList();
    createIndex();
  }

  return {
    onInput: onInput,
    onClickList: onClickList,
    setSelected: setSelected,
    init: init
  };
})();


////////
// DB //
////////

var DB = (function() {

  // TODO(wdm) Check that SEPERATOR does not appear in notes.
  var SEPERATOR = '\n[//]: # (NVC: Do not edit this line)\n\n';

  // In memory note objects.
  var notes = [];

  function parseDB(rawText) {
    var rawNotes = rawText.split(SEPERATOR);
    notes = rawNotes.map(parseNote);
    search.init();
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
    var texts = notes.map(function(note) { return note.text; });
    var rawText = texts.join(SEPERATOR);
    return new Blob([rawText], {
      type:
        'text/plain'
    });
  }
  return {
    parseDB: parseDB,
    parseNote: parseNote,
    notesAsBlob: notesAsBlob,
    getNotes: function() { return notes; }
  };
})();


//////////////
// TextArea //
//////////////


function updateTextArea(text) {
  textarea.value = text;
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
    // TODO(wdm) doNewNote();
  }
}



function init() {
  restoreChosenFile()
      .then(showFilename)
      .then(loadFileEntry)
      .then(DB.parseDB)
      .catch(showError);

  window.addEventListener('keydown', onKeydown);
  textarea.addEventListener('input', dirtMonitor.setDirty);
  document.querySelector('#chooseFile').addEventListener('click', onChooseFile);
  document.querySelector('#noteList')
      .addEventListener('click', search.onClickList);
  document.querySelector('#search').addEventListener('input', search.onInput);
}

init();
