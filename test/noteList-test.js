var browser = require("./browser.js");
var buster = require("buster");
var assert = buster.referee.assert;
var tc;

var nvc = browser.evalFiles(
    ['../lib/db.js', '../lib/highlight.js', '../lib/noteList.js']);
nvc.document = browser.document();
var db = nvc.db;
var highlight = nvc.highlight;
var noteList = nvc.noteList;

tc = {
  "simple note with highlight": function() {
    var note = {
      id: 99,
      title: 'Title test',
      text: 'Title test\nBody test\n'
    };
    var terms = ["test"];
    var regexp = highlight.regexpForHighlight(terms);
    var expected = '<li><b>Title <q>test</q></b><i>Body <q>test</q>\n</i></li>';
    assert.equals(noteList.test_noteHtml(regexp, note), expected);
  },
};
buster.testCase("single note with highlighting", tc);

tc = {
  "selection": function() {
    var observer = this.spy();
    var ul = nvc.document.createElement('ul');
    noteList.init(ul, observer);

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
    // Check the selection observer.
    assert.calledWithMatch(observer, {id: 33});

    noteList.selectNext();
    assert.match(ul.children, [{}, {className: 'selected'}]);
    // Check the selection observer.
    assert.calledWithMatch(observer, {id: 99});

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
