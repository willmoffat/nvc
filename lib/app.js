var app = (function() {
  var notes;

  function init(opt_notes) {
    notes = opt_notes || debug_load();

    ui.editor.init($('#editor'));
    ui.searchBox.init($('#search'), onSearch);
    noteList.init($('#searchResults'), onSelect);

    document.addEventListener('keydown', keys.makeHandler({
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
    }));

    app.debug_notelistEl = $('#searchResults');

    // Trigger inital display.
    onSearch('');
  }

  function onSearch(q) {
    var terms = q.split(/\s+/);  // TODO(wdm) Better term detection.
    var regexp = highlight.regexpForSearch(terms);
    var results = search(regexp, notes);
    noteList.display(terms, results);
  }

  function onSelect(note) { ui.editor.setNote(note); }

  function debug_load() {
    return db.parseFile(
        '[//]: # (NVC:NOTE.22)\nTask today\n\nMake pancakes.\n' +
        '[//]: # (NVC:NOTE.33)\nPancake recipe\n\nEggs milk flour!\n' +
        '[//]: # (NVC:NOTE.44)\nTasks tomorrow\n\nDiet.\n');
  }

  function $(sel) {
    var el = document.querySelector(sel);
    if (!el) {
      throw new Error('invalid dom selector ' + sel);
    }
    return el;
  }

  return {
    init: init,
  };  // HACK

})();

// NodeJS support.
if (typeof module !== 'undefined') {
  var db = require('./db');
  var highlight = require('./highlight');
  var search = require('./search');
  var noteList = require('./noteList');
  var ui = require('./ui');
  var keys = require('./keys');
  var HTML = require('fs').readFileSync(__dirname + '/../window.html',
                                        {encoding: 'utf8'});
  var JSDOM_OPTS = {
    features: {FetchExternalResources: []}
  };
  var document = require('jsdom').jsdom(HTML, JSDOM_OPTS);
  module.exports = app;
}

app.init();
