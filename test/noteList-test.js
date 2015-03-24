var buster = require("buster");
var assert = buster.referee.assert;
var document = require('jsdom').jsdom();

var noteList = require("../lib/noteList");
var tc;

tc = {
  "simple note with highlight": function() {
    var note = {
      id: 99,
      title: 'Title test',
      text: 'Title test\nBody test\n'
    };
    var terms = ["test"];
    assert.equals(noteList.test_noteHtml(terms, note),
                  '<li><b>Title <q>test</q></b><i>Body <q>test</q>\n</i></li>');
  },
};
buster.testCase("single note", tc);

tc = {
  "fills in id2el": function() {  // TODO(wdm) stop testing internals.
    var notes =
        [{id: 99, title: 'Title test', text: 'Title test\nBody test\n'}];
    var terms = ["test"];
    noteList.init(document.createElement('ul'));
    noteList.display(terms, notes);
    assert.equals(noteList.test_id2el(99).innerHTML,
                  '<b>Title <q>test</q></b><i>Body <q>test</q>\n</i>');
  },
};
buster.testCase("noteList.display", tc);
