// Node.js tests
var buster = require("buster");
var assert = buster.referee.assert;
var refute = buster.referee.refute;

var model = require("../lib/model");
var tc;

tc = {
  "init with empty list ok": function() {
    refute.exception(function() { model.init([]); });
  },
  "all notes are validated": function() {
    assert.exception(function() { model.init([{text: 'missing id'}]); });
  },
  "get note fails if note missing": function() {
    assert.exception(function() { model.getNote(99); });
  },
  "get note succeeds": function() {
    var n = {
      id: 99,
      title: 'TITLE',
      text: 'TITLE\nBODY\n'
    };
    model.init([n]);
    assert.equals(model.getNote(99), n);
  },
  "update note": function() {
    model.init([{id: 99, title: 'TITLE', text: 'TITLE\nBODY\n'}]);
    model.updateNote(99, 'NEW_TITLE\nBODY\n');
    assert.equals(model.getNote(99),
                  {id: 99, title: 'NEW_TITLE', text: 'NEW_TITLE\nBODY\n'});
  },
  "observer called on new note and changed note": function() {
    var observer = this.spy();
    model.init([], observer);

    model.newNote('TITLE\nBODY\n');
    assert.calledWith(observer, {id: 0, title: 'TITLE', text: 'TITLE\nBODY\n'});

    model.updateNote(0, 'NEW\nBODY\n');
    assert.calledWith(observer, {id: 0, title: 'NEW', text: 'NEW\nBODY\n'});
  },

};
buster.testCase("model", tc);
