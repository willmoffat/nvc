// List of displayed notes in response to search.
var noteList = (function() {

  // Mapping of note.id to DOM element.
  var id2el = {};

  var noteListEl;  // Container element.

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

  function displayNotes(terms, notes) {
    var html = notes.map(noteHtml);
    noteListEl.innerHTML = html.join('\n');
    // HACK: update id2el;
  }

  return {
    test_noteHtml: noteHtml,
  };
})();

// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = noteList;
}
