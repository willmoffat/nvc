// List of displayed notes in response to search.
var noteList = (function() {
  "use strict";

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
  var selectedIndex = null;

  function selectedNote() {
    if (selectedIndex === null) {
      return null;
    }
    var note = notes[selectedIndex];
    if (!note) {
      throw new Error('internal error, invalid index ' + selectedIndex);
    }
    return note;
  }

  function selectedEl() {
    if (selectedIndex === null) {
      return null;
    }
    var el = els[selectedIndex];
    if (!el) {
      throw new Error('internal error, invalid index ' + selectedIndex);
    }
    return el;
  }
  function clearSelection() {
    var el = selectedEl();
    if (el) {
      el.className = '';  // classList.remove not supported by jsdom.
      selectedIndex = null;
    }
  }

  function showSelection() {
    var el = selectedEl();
    el.className = 'selected';  // classList.add not supported by jsdom.
    el.scrollIntoViewIfNeeded && el.scrollIntoViewIfNeeded();
  }

  function select(index) {
    if (selectedIndex === index) {
      throw new Error("pointless selection, selectedIndex = " + selectedIndex);
    }
    clearSelection();
    selectedIndex = index;
    showSelection();
    observer(selectedNote());
  }

  function moveSelection(dir) {
    if (!notes.length) {
      return;
    }
    var i = selectedIndex + dir;
    if (selectedIndex === null) {
      i = 0;
    }
    if (i >= notes.length) {
      i = notes.length - 1;
    }
    if (i < 0) {
      i = 0;
    }
    if (i === selectedIndex) {
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
    var regexp;
    var prevNote = selectedNote();
    if (terms) {
      regexp = highlight.regexpForHighlight(terms);
    }
    var html = notes_.map(function(note) { return noteHtml(regexp, note); });
    noteListEl.innerHTML = html.join('\n');

    notes = notes_;
    els = toArray(noteListEl.children);
    if (prevNote) {
      selectedIndex = notes.indexOf(prevNote);
      if (selectedIndex === -1) {
        selectedIndex = null;
        observer(null);
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
