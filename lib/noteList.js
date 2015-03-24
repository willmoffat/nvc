// List of displayed notes in response to search.
var noteList = (function() {

  // Mapping of note.id to DOM element.
  var id2el = {};

  var noteListEl;  // Container element.

  var selected = {
    id:null,
    el:null
  };

  function init(noteListEl_) {
    if (!noteListEl_) {
      throw new Error("Missing noteListEl_ arg");
    }
    noteListEl = noteListEl_;
  }

  // TODO(wdm) modify summary to show highlighted terms?
  function noteHtml(terms, note) {
    db.validate(note);  // TODO(wdm) Remove after validating all IO.
    var TITLE = highlight(terms, note.title);
    var SUMMARY = highlight(terms, db.summary(note, 100));
    var html = '<li><b>' + TITLE + '</b><i>' + SUMMARY + '</i></li>';
    return html;
  }

  function display(terms, notes) {
    var html = notes.map(function(note) {
      return noteHtml(terms, note);
    });
    noteListEl.innerHTML = html.join('\n');
    var len = noteListEl.children.length;
    for (var i = 0; i < len; i++) {
      id2el[notes[i].id] = noteListEl.children[i];
    }
  }

  return {
    init: init,
    display: display,
    // Only for testing:
    test_noteHtml: noteHtml,
    test_id2el: function(id) { return id2el[id]; },
  };
})();

// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = noteList;
  var db = require('./db');
  var highlight = require('./highlight');
  // var document = require('jsdom').jsdom();
}
