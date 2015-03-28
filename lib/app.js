/*
Lifecycle:
 getfile, db.parseFile, app.setNotes
 observe editor, searchBox

*/

//////////////////
// Key Handling //
//////////////////

function handleKeys(handlers) {
  var keyNames = {
    8: 'Backspace',
    13: 'Enter',
    27: 'Escape',
    38: 'Up',
    40: 'Down',
  };
  return function keyHandler(e) {
    var k = e.keyCode;
    var key;
    if (k > 48) {
      key = String.fromCharCode(k);
    } else {
      key = keyNames[k];
    }
    if (!key) {
      return;
    }
    var pressed = (e.ctrlKey ? 'Ctrl-' : '') + (e.altKey ? 'Alt-' : '') + key;
    var handler = handlers.globalKeys[pressed];
    if (!handler && (e.target.id !== 'editor')) {
      handler = handlers.globalExceptInEditor[pressed];
    }
    if (handler) {
      e.preventDefault();
      handler();
    }
  };
}

var app = (function() {
  var notes;

  function init() {
    var keyHandlers = {
      globalKeys: {
        'Escape': function() {
          ui.searchBox.reset();
          // TODO(wdm) Shouldn't searchBox.reset trigger other two actions?
          // TODO(wdm) Is this testable?
          noteList.clearSelection();
          ui.editor.reset();
        },
        // 'Alt-1': win.hide,
        // 'Ctrl-W': win.close,
        // 'Ctrl-S': backup.save,
      },
      globalExceptInEditor: {
        // 'Enter': search.selectOrCreateNote,
        'Down': noteList.selectNext,
        'Up': noteList.selectPrev,
        // 'Ctrl-Backspace': search.deleteSelectedNote,
      }
    };

    document.addEventListener('keydown', handleKeys(keyHandlers));
    notes = db.parseFile("[//]: # (NVC:NOTE.22)\nTest 1\n\nAll about foo.\n" +
                         "[//]: # (NVC:NOTE.44)\nTest 2\n\nAll about bar.\n");

    ui.editor.init(document.getElementById('editor'));
    ui.searchBox.init(document.getElementById('search'), onSearch);

    noteList.init(document.getElementById('searchResults'), onSelect);
    noteList.display([], notes);
  }

  function onSearch(q) {
    console.log('q: "' + q + '"');
    var terms = q.split(' ');  // HACK
    var regexp = highlight.regexpForSearch(terms);
    var results = search(regexp, notes);
    noteList.display(terms, results);
  }

  function onSelect(note) { ui.editor.setNote(note); }

  return {
    init: init,
  };  // HACK

})();

// NodeJS support.
if (typeof module !== 'undefined') {
  var db = require('./db');
  var noteList = require('./noteList');
  var ui = require('./ui');
  var HTML = require('fs').readFileSync(__dirname + '/../window.html',
                                        {encoding: 'utf8'});
  var JSDOM_OPTS = {
    features: {FetchExternalResources: []}
  };
  var document = require('jsdom').jsdom(HTML, JSDOM_OPTS);
  module.exports = app;
}

app.init();
