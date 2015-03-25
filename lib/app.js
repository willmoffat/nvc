/*
Lifecycle:
 getfile, db.parseFile, app.setNotes
 observe editor, searchBox

*/

var app = (function() {

  var notes = db.parseFile("[//]: # (NVC:NOTE.22)\nTest 1\n\nAll about foo.\n" +
                           "[//]: # (NVC:NOTE.44)\nTest 2\n\nAll about bar.\n");

  noteList.init(document.getElementById('searchResults'), onSelect);
  noteList.display([], notes);
  noteList.selectNext();
  noteList.selectNext();

  function onSelect(note) {
    ui.editor.setNote(note);
  }

  return {};  // HACK

})();


// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = app;
}
