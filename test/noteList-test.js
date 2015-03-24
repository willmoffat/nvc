var buster = require("buster");
var assert = buster.referee.assert;

var noteList = require("../lib/noteList");
var tc;

tc = {
  "simple note, no highlight": function() {
    var text = "will moffat";
    var terms = ["will"];
    assert.equals(noteList.test_noteHtml
  },
};
buster.testCase("highlight", tc);
