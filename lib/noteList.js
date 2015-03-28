// List of displayed notes in response to search.
var noteList = (function() {

  var noteListEl;  // Container element.
  var observer = function(note) { console.log('selected: ', note.title); };

  function init(noteListEl_, opt_observer) {
    if (!noteListEl_) {
      throw new Error("Missing noteListEl_ arg");
    }
    noteListEl = noteListEl_;
    if (typeof opt_observer === 'function') {
      observer = opt_observer;
    }
  }

  var notes = [];
  var els = [];
  var currIndex = null;

  // HACK: change current for selected.
  function currentNote() {
    if (currIndex === null) {
      return null;
    }
    var note = notes[currIndex];
    if (!note) {
      throw new Error('internal error, invalid index ' + currIndex);
    }
    return note;
  }

  function currentEl() {
    if (currIndex === null) {
      return null;
    }
    var el = els[currIndex];
    if (!el) {
      throw new Error('internal error, invalid index ' + currIndex);
    }
    return el;
  }
  function clearSelection() {
    var el = currentEl();
    if (el) {
      el.className = '';  // classList.remove not supported by jsdom.
      currIndex = null;
    }
  }

  function showSelection() {
    var el = currentEl();
    el.className = 'selected';  // classList.add not supported by jsdom.
    el.scrollIntoViewIfNeeded && el.scrollIntoViewIfNeeded();
  }

  function select(index) {
    if (currIndex === index) {
      throw new Error("pointless selection, currIndex = " + currIndex);
    }
    clearSelection();
    currIndex = index;
    showSelection();
    observer(currentNote());
  }

  function moveSelection(dir) {
    if (!notes.length) {
      return;
    }
    var i = currIndex + dir;
    if (currIndex === null) {
      i = 0;
    }
    if (i >= notes.length) {
      i = notes.length - 1;
    }
    if (i < 0) {
      i = 0;
    }
    if (i === currIndex) {
      return;
    }
    select(i);
  }
  function selectNext() { moveSelection(+1); }
  function selectPrev() { moveSelection(-1); }

  // TODO(wdm) Handle notification that note has changed.

  // TODO(wdm) modify summary to show highlighted terms deep inside text.
  function noteHtml(regexp, note) {
    db.validate(note);  // TODO(wdm) Remove after validating all IO.
    var TITLE = highlight.text(regexp, note.title);
    var SUMMARY = highlight.text(regexp, db.summary(note, 100));
    var html = '<li><b>' + TITLE + '</b><i>' + SUMMARY + '</i></li>';
    return html;
  }

  function toArray(nodeList) { return Array.prototype.slice.call(nodeList); }

  function display(terms, notes_) {
    var prevNote = currentNote();
    var regexp = highlight.regexpForHighlight(terms);
    var html = notes_.map(function(note) { return noteHtml(regexp, note); });
    noteListEl.innerHTML = html.join('\n');

    notes = notes_;
    els = toArray(noteListEl.children);
    if (prevNote) {
      currIndex = notes.indexOf(prevNote);
      if (currIndex === -1) {
        currIndex = null;
      } else {
        showSelection();
      }
    }
  }

  return {
    init: init,
    display: display,
    selectNext: selectNext,
    selectPrev: selectPrev,
    clearSelection: clearSelection,  // TODO(wdm) private?
    // Testing only:
    test_noteHtml: noteHtml,
  };
})();

// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = noteList;
  var db = require('./db');
  var highlight = require('./highlight');
}
