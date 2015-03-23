// Node.js tests
var buster = require("buster");
var assert = buster.referee.assert;
// buster.spec.expose(); // Make some functions global

var db = require("../lib/db");

buster.testCase("=>parseNote", {
  "index required": function() {
    assert.exception(function() {
      db.parseNote("");
    });
  },
  "note cannot be empty": function() {
    assert.exception(function() {
      db.parseNote("", 99);
    });
  },
});

buster.testCase("round trip", {
    "empty list": function () {
      var notes = [];
      assert.equals(db.parseFile(db.stringifyNotes(notes)), notes);
    },
    "one title": function () {
      var notes = [{text:'foo'}];
      assert.equals(db.parseFile(db.stringifyNotes(notes)), notes1);
    }
});
