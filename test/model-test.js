// Node.js tests
var buster = require("buster");
var assert = buster.referee.assert;
var refute = buster.referee.refute;

var db = require("../lib/db");  // HACK
var model = require("../lib/model");
var tc;

tc = {
  "init with empty list ok": function() {
    refute.exception(function() { model.init([]); });
  },
  "all notes are validated": function() {
    assert.exception(function() { model.init([{text: 'missing id'}]); });
  },
};
buster.testCase("model", tc);
