var buster = require("buster");
var assert = buster.referee.assert;

var highlight = require("../lib/highlight");
var tc;

tc = {
  "regexp arg required": function() {
    assert.exception(function() { highlight.text(); });
  },
  "text arg required": function() {
    assert.exception(function() { highlight.text(/dummy/); });
  },
  "passthrough text": function() {
    var text = "will";
    assert.equals(highlight.text(/dummy/, text), text);
  },
  "esacpe html": function() {
    var text = "a is < b";
    assert.equals(highlight.text(/dummy/, text), 'a is &lt; b');
  },
  "simple highlight": function() {
    var text = "will moffat";
    var terms = ["will"];
    var regexp = highlight.regexpForHighlight(terms);
    assert.equals(highlight.text(regexp, text), "<q>will</q> moffat");
  },
};
buster.testCase("highlight", tc);
