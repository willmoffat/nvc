var db = (function() {

  // TODO(wdm) Check that SEPERATOR does not appear in notes.
  var SEPERATOR = '\n[//]: # (NVC: Do not edit this line)\n\n';

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
    var firstLine = rawNote.indexOf('\n');
    return {
      id: i,
      title: rawNote.substring(0, firstLine),
      summary: rawNote.substring(firstLine + 1, 150),
      text: rawNote
    };
  }

  // TODO(wdm)  function stringifyNote(note) {}

  function stringifyNotes(notes) {
    var texts = notes.map(function(note) { return note.text; });
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
