// Node.js tests
var buster = require("buster");
var assert = buster.referee.assert;
// buster.spec.expose(); // Make some functions global

var db = require("../lib/db");
var tc;

tc = {
  "index required": function() {
    assert.exception(function() { db.parseNote(""); });
  },
  "note cannot be empty": function() {
    assert.exception(function() { db.parseNote("", 99); });
  },
  "note always has title": function() {
    assert.equals(db.parseNote("abc", 99),
                  {id: 99, title: "abc", text: "abc", summary: ""});
  },
};
buster.testCase("parseNote", tc);

tc = {
  "empty note list forbidden": function() {
    var notes = [];
    assert.exception(function() { db.stringifyNotes(notes); });
  },
  "invalid note caught": function() {
    var notes = [{text: 'foo'}];
    assert.exception(function() { db.stringifyNotes(notes); });
  }
};
buster.testCase("stringify", tc);
