var buster = require("buster");
var assert = buster.referee.assert;

var search = require("../lib/search");
var highlight = require("../lib/highlight");

var tc;

tc = {
  "notes and terms required": function() {
    assert.exception(function() { search(); });
    assert.exception(function() { search([]); });
  },
  "empty terms returns sorted full list": function() {
    var notes = [{title: 'B'}, {title: 'A'}];
    var want = [{title: 'A'}, {title: 'B'}];
    assert.match(search(null, notes), want);
  },
  "search by term": function() {
    var notes = [
      {title: 'B', text: 'hamsters are cool'},
      {title: 'A', text: 'cats are not cool'}
    ];
    var regexp;

    regexp = highlight.regexpForHighlight(['hamsters']);
    assert.match(search(regexp, notes), [{title: 'B'}]);

    regexp = highlight.regexpForHighlight(['hamsters', 'cool']);
    assert.match(search(regexp, notes), [{title: 'A'}, {title: 'B'}]);
  },
};

buster.testCase("search", tc);
