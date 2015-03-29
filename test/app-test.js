var buster = require("buster");
var assert = buster.referee.assert;
var refute = buster.referee.refute;

/*
  action  |  list  | selection  | editor
  --------------------------------------
  init        all       -          -
  cur down    all       1          1
  'task'      1, 3      1          1
  'tasks'     3         -          -
  'tasksZ'    -         -          -
  TODO(wdm) 'Enter' creates a new note.
  Escape     all       -           -
*/


var db = require("../lib/db");
var app = require("../lib/app");
var tc;

var testNotes = db.parseFile(
    '[//]: # (NVC:NOTE.33)\n2. Pancake recipe\n\nEggs milk flour!\n' +
    '[//]: # (NVC:NOTE.22)\n1. Task today\n\nMake pancakes.\n' +
    '[//]: # (NVC:NOTE.44)\n3. Tasks tomorrow\n\nDiet.\n');

tc = {
  "select and search": function() {
    var notelistEl = app.debug.document.getElementById('noteList');
    var editorEl = app.debug.document.getElementById('editor');
    // init
    // ----
    app.init(testNotes);
    // All notes shown (in alphbetical order).
    assert.match(notelistEl.querySelectorAll('b'), [
      {textContent: '1. Task today'},
      {textContent: '2. Pancake recipe'},
      {textContent: '3. Tasks tomorrow'}
    ]);
    // Nothing selected.
    assert.match(notelistEl.querySelectorAll('.selected'), []);
    // Nothing in editor.
    assert.equals(editorEl.disabled, true);

    // cur_down
    // --------
    app.debug.keyConfig.globalExceptInEditor['Down']();
    // All notes shown (as before).
    assert.match(notelistEl.querySelectorAll('b'), [
      {textContent: '1. Task today'},
      {textContent: '2. Pancake recipe'},
      {textContent: '3. Tasks tomorrow'}
    ]);
    // First note selected.
    assert.match(notelistEl.querySelectorAll('.selected'),
                     [{textContent: '1. Task today'}]);
    // First note shown in editor.
    assert.equals(editorEl.disabled, false);
    assert.contains(editorEl.value, '1. Task today');

    // type 'task'
    // -----------
    app.debug.onSearch('task');
    // Only notes 1 and 3 are shown.
    assert.match(
        notelistEl.querySelectorAll('b'),
        [{textContent: '1. Task today'}, {textContent: '3. Tasks tomorrow'}]);
    // First note remains selected.
    assert.match(notelistEl.querySelectorAll('.selected'),
                     [{textContent: '1. Task today'}]);
    // First note reamins shpwn in editor.
    assert.equals(editorEl.disabled, false);
    assert.contains(editorEl.value, '1. Task today');

    // type 'tasks'
    // -----------
    app.debug.onSearch('tasks');
    // Only note 3 is shown.
    assert.match(notelistEl.querySelectorAll('b'),
                     [{textContent: '3. Tasks tomorrow'}]);
    // Now nothing is selected.
    assert.match(notelistEl.querySelectorAll('.selected'), []);
    // And now nothing in editor.
    assert.equals(editorEl.disabled, true);

    // type 'tasksZ'
    // -------------
    app.debug.onSearch('tasksZ');
    // No notes shown.
    assert.match(notelistEl.querySelectorAll('b'), []);
    // Nothing selected.
    assert.match(notelistEl.querySelectorAll('.selected'), []);
    // Nothing in editor.
    assert.equals(editorEl.disabled, true);

    // Escape
    // ------
    app.debug.keyConfig.globalKeys['Escape']();
    // All notes shown.
    assert.match(notelistEl.querySelectorAll('b'), [
      {textContent: '1. Task today'},
      {textContent: '2. Pancake recipe'},
      {textContent: '3. Tasks tomorrow'}
    ]);
    // Nothing selected.
    assert.match(notelistEl.querySelectorAll('.selected'), []);
    // Nothing in editor.
    assert.equals(editorEl.disabled, true);

  },
};
buster.testCase("app", tc);
