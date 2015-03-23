var db = (function() {

  /* Items start with
          [//]: # (NVC:XXXXX)\n
     Where XXXXX contains metadata.
  */
  var HEADER_PREFIX = '[//]: # (NVC:';
  var HEADER_SUFFIX = ')\n';

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
    if (note.text.slice(-1) !== '\n') {
      return 'note.text does not end in newline';
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
    var i = 0;
    var notes = [];
    while (i<rawText.length) {
      var ii = rawText.indexOf(HEADER_PREFIX, i + 1);
      if (ii === -1) {
	ii = rawText.length;
      }
      var rawNote = rawText.substring(i, ii);
      var note = parseNote(rawNote);
      notes.push(note);
      i = ii;
    }
    return notes;
  }

  function parseNote(rawNote) {
    if (!rawNote) {
      throw new Error('parseNote called without arg');
    }
    var firstNL = rawNote.indexOf('\n') + 1;
    if (!firstNL) {
      throw new Error('missing header line');
    }
    var secondNL = rawNote.indexOf('\n', firstNL) + 1;
    if (!secondNL) {
      secondNL = rawNote.length;
    }
    var header = rawNote.substring(0, firstNL);
    var metadata = header.slice(HEADER_PREFIX.length);
    metadata = metadata.slice(0, -HEADER_SUFFIX.length);
    var r = metadata.split('.');
    if (!r || r.length !== 2) {
      throw new Error('unknown metadata: ' + metadata);
    }
    if (r[0] !== 'NOTE') {
      throw new Error('unknown metadata type: ' + r[0]);
    }
    var id = parseInt(r[1], 10);
    var note = {
      id: id,
      title: rawNote.substring(firstNL, secondNL - 1),
      // HACK TODO(wdm) getSummary() summary: rawNote.substring(secondNL, 150),
      text: rawNote.substring(firstNL),
    };
    validate(note);
    return note;
  }

  function stringifyNote(note) {
    validate(note);
    var header = HEADER_PREFIX + 'NOTE.' + note.id + HEADER_SUFFIX;
    var result = header + note.text;
    return result;
  }

  function stringifyNotes(notes) {
    if (!notes || !notes.length) {
      throw new Error("no notes to stringify");
    }
    var texts = notes.map(stringifyNote);
    var rawText = texts.join('');
    return rawText
  }
  return {
    parseFile: parseFile,
    parseNote: parseNote,
    stringifyNotes: stringifyNotes,
    stringifyNote: stringifyNote,
  };
})();

// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = db;
}
