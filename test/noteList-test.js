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
    var expected = '<li><b>Title <q>test</q></b><i>Body <q>test</q>\n</i></li>';
    assert.equals(noteList.test_noteHtml(terms, note), expected);
  },
};
buster.testCase("single note with highlighting", tc);

tc = {
  "selection": function() {  // TODO(wdm) stop testing internals.
    var ul = document.createElement('ul');
    noteList.init(ul);

    var notes = [
      {id: 33, title: 'Title', text: 'Title\nFoo\n'},
      {id: 99, title: 'Title test', text: 'Title test\nBody test\n'},
    ];
    var terms = [];
    noteList.display(terms, notes);
    var expected = '<li><b>Title</b><i>Foo\n</i></li>\n' +
                   '<li><b>Title test</b><i>Body test\n</i></li>';
    assert.equals(ul.innerHTML, expected);

    // No previous selection -> select first.
    noteList.selectNext();
    assert.match(ul.children, [{className: 'selected'}, {}]);

    noteList.selectNext();
    assert.match(ul.children, [{}, {className: 'selected'}]);

    // Can't move past end.
    noteList.selectNext();
    assert.match(ul.children, [{}, {className: 'selected'}]);

    // And back.
    noteList.selectPrev();
    assert.match(ul.children, [{className: 'selected'}, {}]);

    // Can't move past beginning.
    noteList.selectPrev();
    assert.match(ul.children, [{className: 'selected'}, {}]);
  },
};
buster.testCase("noteList", tc);
