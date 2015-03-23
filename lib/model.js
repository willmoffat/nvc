// TODO(wdm) Does this actually buy us anything over a global 'notes'?
var model = (function() {

  // In memory note objects.
  var notes = [];

  function notUndefined(n) { return !!n; }

  return {
    init: function init(notes_) {
      notes_.forEach(db.validate);
      notes = notes_;
      return notes;
    },
    newNote: function(rawText) {
      var id = notes.length;
      var note = db.parseNoteWithoutMetadata(rawText, {id: id});
      notes.push(note);
      return note;
    },
    setNote: function setNote(i, note) {
      notes[i] = note;
      localstore.saveNote(note);  // TODO(wdm) .then() ?
    },
    deleteNote: function deleteNote(i) { delete notes[i]; },
    getNote: function getNote(i) {
      var note = notes[i];
      if (!note) {
        throw new Error('invalid note index', i);
      }
      return notes[i];
    },
    getNotes: function getNotes() { return notes.filter(notUndefined); },
  };

})();

// NodeJS support.
if (typeof module !== 'undefined') {
  var db = require('./db');
  module.exports = model;
}
