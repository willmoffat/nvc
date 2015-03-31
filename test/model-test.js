var browser = require("./browser.js");
var buster = require("buster");
var assert = buster.referee.assert;
var refute = buster.referee.refute;
var tc;

var nvc = browser.evalFiles(['../lib/db.js', '../lib/model.js', ]);
var model = nvc.model;

tc = {
  "init with empty list ok": function() {
    refute.exception(function() { model.init([]); });
  },
  "all notes are validated": function() {
    assert.exception(function() { model.init([{text: 'missing id'}]); });
  },
  "get note fails if note missing": function() {
    assert.exception(function() {
      model.init([]);
      model.getNote(99);
    });
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
    var note = model.getNote(99);
    model.updateNote(note, 'NEW_TITLE\nBODY\n');
    assert.equals(note,
                  {id: 99, title: 'NEW_TITLE', text: 'NEW_TITLE\nBODY\n'});
  },
  "observer called on new note and changed note": function() {
    var observer = this.spy();
    model.init([], observer);

    model.newNote('TITLE\nBODY\n');
    assert.calledWith(observer, {id: 0, title: 'TITLE', text: 'TITLE\nBODY\n'});

    model.updateNote(model.getNote(0), 'NEW\nBODY\n');
    assert.calledWith(observer, {id: 0, title: 'NEW', text: 'NEW\nBODY\n'});
  },

};
buster.testCase("model", tc);
