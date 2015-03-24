var buster = require("buster");
var assert = buster.referee.assert;

var highlight = require("../lib/highlight");
var tc;

tc = {
  "terms arg required": function() {
    assert.exception(function() { highlight(); });
  },
  "text arg required": function() {
    assert.exception(function() { highlight([]); });
  },
  "passthrough text": function() {
    var text = "will";
    assert.equals(highlight([], text), text);
  },
  "simple highlight": function() {
    var text = "will moffat";
    var terms = ["will"];
    assert.equals(highlight(terms, text), "<q>will</q> moffat");
  },
};
buster.testCase("highlight", tc);
