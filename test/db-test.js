var browser = require('./browser');
var buster = require("buster");
var assert = buster.referee.assert;

var nvc = browser.evalFiles(['../lib/db.js']);
var db = nvc.db;

var tc;

tc = {
  "index required": function() {
    assert.exception(function() { db.parseNote(""); });
  },
  "note cannot be empty": function() {
    assert.exception(function() { db.parseNote("[//]: # (NVC:NOTE.2)\n"); });
  },
  "note with title": function() {
    assert.equals(db.parseNote("[//]: # (NVC:NOTE.22)\nZZZ\n"),
                  {id: 22, title: "ZZZ", text: "ZZZ\n"});
  },
  "note must end in newline": function() {
    assert.exception(function() {
      db.parseNote("[//]: # (NVC:NOTE.2)\nBODY");
    });
  },
  "note with title and body": function() {
    assert.equals(db.parseNote("[//]: # (NVC:NOTE.22)\nTITLE\nBODY\n"),
                  {id: 22, title: "TITLE", text: "TITLE\nBODY\n"});
  },
  // localstore:
  "note from localstore": function() {
    assert.equals(db.parseNoteWithoutMetadata("TITLE\nBODY\n", {id: 44}),
                  {id: 44, title: "TITLE", text: "TITLE\nBODY\n"});
  },
};
buster.testCase("parseNote", tc);

tc = {
  "id serialized": function() {
    assert.equals(db.stringifyNote({title: 'foo', text: 'foo\n', id: 99}),
                  "[//]: # (NVC:NOTE.99)\nfoo\n");
  },
  "empty note list forbidden": function() {
    var notes = [];
    assert.exception(function() { db.stringifyNotes(notes); });
  },
  "invalid note caught": function() {
    var notes = [{text: 'foo'}];
    assert.exception(function() { db.stringifyNotes(notes); });
  },
  "id preserved": function() {
    var note = {
      id: 99,
      title: 'abc',
      text: 'abc\n'
    };
    assert.equals(db.parseNote(db.stringifyNote(note)), note);
  },
  // TODO(wdm) test malformed files (with leading and trailing crap)
  "parse a simple file": function() {
    var file = "[//]: # (NVC:NOTE.22)\nZZZ\n";
    assert.equals(db.parseFile(file), [{id: 22, title: 'ZZZ', text: 'ZZZ\n'}]);
  },
  "parse a simple file with two notes": function() {
    var file = "[//]: # (NVC:NOTE.22)\nZZZ\n" + "[//]: # (NVC:NOTE.44)\nYYY\n";
    assert.equals(db.parseFile(file), [
      {id: 22, title: 'ZZZ', text: 'ZZZ\n'},
      {id: 44, title: 'YYY', text: 'YYY\n'}
    ]);
  },
  "round-trip simple note": function() {
    var notes = [{id: 99, title: 'TITLE', text: 'TITLE\nBODY\n'}];
    assert.equals(db.parseFile(db.stringifyNotes(notes)), notes)
  },
};
buster.testCase("stringify", tc);

tc = {
  "no body": function() {
    assert.equals(db.summary({text: 'TITLE\n'}, 10), "");
  },
  "simple body": function() {
    assert.equals(db.summary({text: 'TITLE\nBODY\n'}, 10), "BODY\n");
  },
  "truncate": function() {
    assert.equals(db.summary({text: 'TITLE\n1234567890\n'}, 5), "12345");
  },
};
buster.testCase("summary", tc);
