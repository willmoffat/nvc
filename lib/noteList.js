// List of displayed notes in response to search.
var noteList = (function() {

  var noteListEl;                // Container element.
  var observer = function() {};  // Selection observer.

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
  function clear() {
    var el = currentEl();
    if (el) {
      el.className = '';  // classList.remove not supported by jsdom.
      currIndex = null;
      observer(null);
    }
  }

  function select(index) {
    clear();
    currIndex = index;
    var el = currentEl();
    el.className = 'selected';  // classList.add not supported by jsdom.
    el.scrollIntoViewIfNeeded && el.scrollIntoViewIfNeeded();
    observer(notes[currIndex]);
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
    select(i);
  }
  function selectNext() { moveSelection(+1); }
  function selectPrev() { moveSelection(-1); }


  // TODO(wdm) modify summary to show highlighted terms?
  function noteHtml(terms, note) {
    db.validate(note);  // TODO(wdm) Remove after validating all IO.
    var TITLE = highlight(terms, note.title);
    var SUMMARY = highlight(terms, db.summary(note, 100));
    var html = '<li><b>' + TITLE + '</b><i>' + SUMMARY + '</i></li>';
    return html;
  }

  function toArray(nodeList) { return Array.prototype.slice.call(nodeList); }

  function display(terms, notes_) {
    var html = notes_.map(function(note) { return noteHtml(terms, note); });
    noteListEl.innerHTML = html.join('\n');

    currIndex = null;
    notes = notes_;
    els = toArray(noteListEl.children);
  }

  return {
    init: init,
    display: display,
    selectNext: selectNext,
    selectPrev: selectPrev,
    // Testing only:
    test_noteHtml: noteHtml,
  };
})();

// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = noteList;
  var db = require('./db');
  var highlight = require('./highlight');
  // var document = require('jsdom').jsdom();
}
