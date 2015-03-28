var buster = require("buster");
var assert = buster.referee.assert;
var refute = buster.referee.refute;


// TODO(wdm) editor be disabled if no selection.

/* TODO(wdm): how to test this?
  action  |  list  | selection  | editor
  --------------------------------------
  init        all       -          -
  cur down    all       1          1
  'task'      1, 3      1          1
  'tasks'     3         -          -
  'tasksZ'    -         -          -
*/


var db = require("../lib/db");
var app = require("../lib/app");
var tc;

var testNotes = db.parseFile(
    '[//]: # (NVC:NOTE.33)\n2. Pancake recipe\n\nEggs milk flour!\n' +
    '[//]: # (NVC:NOTE.22)\n1. Task today\n\nMake pancakes.\n' +
    '[//]: # (NVC:NOTE.44)\n3. Tasks tomorrow\n\nDiet.\n');

tc = {
  "=>init ok": function() {
    app.init(testNotes);

    // Nothing selected. TODO(wdm) Check
    assert.equals(app.debug_notelistEl.querySelector('.selected'), null);

    // All notes shown in alphbetical order.
    assert.match(app.debug_notelistEl.querySelectorAll('b'), [
      {textContent: '1. Task today'},
      {textContent: '2. Pancake recipe'},
      {textContent: '3. Tasks tomorrow'}
    ]);
  },
};
buster.testCase("app", tc);
