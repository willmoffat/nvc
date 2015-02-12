// UI code.

var textarea = document.querySelector('textarea');
var errlog = document.querySelector('#errlog');

function toArray(nodeList) {
  return Array.prototype.slice.call(nodeList);
}

function showError(err) {
  console.error(err, err.stack);
  errlog.textContent += err + '\n';
}

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

// TODO(wdm) Check that SEPERATOR does not appear in notes.
var SEPERATOR = '\n[//]: # (NVC: Do not edit this line)\n\n';

var notes = [];

var selected = null;

function setSelected(i) {
  if (typeof selected === "number") {
    notes[selected] = parseNote(textarea.value);
    var listItem = document.querySelector('#noteList ul').children[selected];
    fillListItem(listItem, notes[selected]);
    listItem.classList.remove('selected');
  }
  selected = i;
  document.querySelector('#noteList ul')
      .children[selected]
      .classList.add('selected');
  updateTextArea(notes[i].text);
}

function parseDB(rawText) {
  var rawNotes = rawText.split(SEPERATOR);
  notes = rawNotes.map(parseNote);
  updateNoteList();
  setSelected(0);
}

function parseNote(rawNote) {
  var firstLine = rawNote.indexOf('\n');
  return {
    title: rawNote.substring(0, firstLine),
    summary: rawNote.substring(firstLine + 1, 50),
    text: rawNote
  };
}


// TODO(wdm) Better name!
function notesAsBlob() {
  if (typeof selected === "number") {
    notes[selected] = parseNote(textarea.value);
  }
  var texts = notes.map(function(note) { return note.text; });
  var rawText = texts.join(SEPERATOR);
  return new Blob([rawText], {
    type:
      'text/plain'
  });
}

function fillListItem(li, note) {
  li.children[0].textContent = note.title;
  li.children[1].textContent = note.summary;
}

function updateNoteList() {
  var ul = document.createElement('ul');
  notes.forEach(function(note) {
    var li = document.createElement('li');
    li.innerHTML = '<span></span><i></i>';
    fillListItem(li, note);
    ul.appendChild(li);
  });
  document.querySelector('#noteList').appendChild(ul);
}

function updateTextArea(text) {
  textarea.value = text;
  textarea.focus();
  // TODO(wdm) Restore actual previous position.
  textarea.setSelectionRange(0, 0);
  textarea.scrollTop = 0;
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

function save() {
  if (!dirtMonitor.isDirty) {
    console.log('save skipped: not dirty');
    return Promise.resolve();
  }
  var blob = notesAsBlob();
  return writeFileEntry(fileEntry, blob)
      .then(dirtMonitor.setClean)
      .catch(showError);
}

function doClose() {
  save().then(window.close);
}

//////////////////
// Key Handling //
//////////////////

var CODE_W = 'W'.charCodeAt(0);
var CODE_S = 'S'.charCodeAt(0);
var CODE_1 = '1'.charCodeAt(0);
var CODE_ESC = 27;

function onKeydown(e) {
  if (e.keyCode === CODE_ESC) {
    e.preventDefault();
    doClose();
  }
  if (e.altKey) {
    if (e.keyCode === CODE_1) {
      e.preventDefault();
      doClose();
    }
  }
  if (e.ctrlKey) {
    if (e.keyCode === CODE_W) {
      e.preventDefault();
      doClose();
    } else if (e.keyCode === CODE_S) {
      e.preventDefault();
      save();
    }
  }
}



function onClickList(e) {
  console.log(e);
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
  restoreChosenFile()
      .then(showFilename)
      .then(loadFileEntry)
      .then(parseDB)
      .catch(showError);

  window.addEventListener('keydown', onKeydown);
  textarea.addEventListener('input', dirtMonitor.setDirty);
  document.querySelector('#noteList').addEventListener('click', onClickList);
  document.querySelector('#choose_file')
      .addEventListener('click', onChooseFile);
}

init();
