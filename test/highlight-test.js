var buster = require("buster");
var assert = buster.referee.assert;
var tc;

var document = require("jsdom").jsdom();
eval(require('fs').readFileSync('../lib/highlight.js', 'utf8'));

tc = {
  "emtpy terms array should give null": function() {
    var terms = [];
    assert.equals(highlight.regexpForSearch(terms), null);
  },
  "empty term is ignored": function() {
    var terms = ['foobar', ''];
    assert.equals(highlight.regexpForSearch(terms), /foobar/i);
  },
  "if all terms are excluded then null returned": function() {
    var terms = ['12', 'ba', ''];
    assert.equals(highlight.regexpForSearch(terms), null);
  },
};
buster.testCase("regexp", tc);

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
  "escape html": function() {
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
