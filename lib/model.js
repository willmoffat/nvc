// TODO(wdm) Does this actually buy us anything over a global 'notes'?
var model = (function() {
  "use strict";

  // In memory note objects. Sparse array.
  var notes = [];

  // Called every time a note is updated.
  var observer = function(note) {};

  function notUndefined(n) { return !!n; }

  function getNote(id) {
    var note = notes[id];
    if (!note) {
      throw new Error('invalid note id', id);
    }
    return notes[id];
  }

  return {
    getNote: getNote,
    init: function(notes_, opt_observer) {
      if (typeof opt_observer === 'function') {
	observer = opt_observer;
      }
      notes = [];
      notes_.forEach(function(note) {
        db.validate(note);
        // This makes a sparse array.
        notes[note.id] = note;
      });
      return notes;
    },
    newNote: function(rawText) {
      var id = notes.length;
      var note = db.parseNoteWithoutMetadata(rawText, {id: id});
      notes.push(note);
      observer(note);
      return note; // HACK: still needed?
    },
    updateNote: function(id, text) {
      var old = getNote(id);
      if (old.text === text) {
        return;
      }
      var updatedNote = db.parseNoteWithoutMetadata(text, {id: id});
      notes[id] = updatedNote;
      observer(updatedNote);
    },
    deleteNote: function(i) { delete notes[i]; },
    getNotes: function() { return notes.filter(notUndefined); },
  };

})();
