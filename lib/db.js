var db = (function() {

  // TODO(wdm) Check that SEPERATOR does not appear in notes.
  var SEPERATOR = '\n[//]: # (NVC: Do not edit this line)\n\n';

  function isInvalid(note) {
    if (typeof note.id !== 'number') {
      return 'note.id is not a number';
    }
    if (typeof note.title !== 'string') {
      return 'note.title is not a string';
    }
    if (typeof note.text !== 'string') {
      return 'note.text is not a string';
    }

    if (note.id < 0 || note.id > 1000) {
      return 'note.id out of range';
    }
    if (!note.title) {
      return 'missing note.title';
    }
    if (!note.text) {
      return 'missing note.text';
    }
    return '';
  }

  function validate(note) {
    var err = isInvalid(note);
    if (err) {
      throw new Error(err);
    }
  }

  function parseFile(rawText) {
    var rawNotes = rawText.split(SEPERATOR);
    var notes = rawNotes.map(parseNote);
    return notes;
  }

  function parseNote(rawNote, i) {
    if (typeof i !== 'number') {
      throw new Error('tried to create note without index');
    }
    if (!rawNote) {
      throw new Error('tried to create empty note');
    }
    var firstNL = rawNote.indexOf('\n');
    if (firstNL === -1) {
      // The whole note is a title.
      firstNL = rawNote.length;
    }
    var note = {
      id: i,
      title: rawNote.substring(0, firstNL),
      summary: rawNote.substring(firstNL + 1, 150),
      text: rawNote
    };
    validate(note);
    return note;
  }

  // TODO(wdm)  function stringifyNote(note) {}

  function stringifyNotes(notes) {
    if (!notes || !notes.length) {
      throw new Error("no notes to stringify");
    }
    var texts = notes.map(function(note) {
      validate(note);
      return note.text;
    });
    var rawText = texts.join(SEPERATOR);
    return rawText
  }
  return {
    parseFile: parseFile,
    parseNote: parseNote,
    stringifyNotes: stringifyNotes,
  };
})();

// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = db;
}
