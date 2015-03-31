var app = (function() {
  "use strict";

  function init(opt_notes) {
    model.init(opt_notes || debug_load(), onNoteUpdate);

    ui.editor.init($('#editor'), onNoteUpdate);
    ui.searchBox.init($('#search'), onSearch);
    noteList.init($('#noteList'), onSelect);

    var keyConfig = {
      globalKeys: {
        'Escape': ui.searchBox.reset,
        // 'Alt-1': win.hide,
        // 'Ctrl-W': win.close,
        // 'Ctrl-S': backup.save,
      },
      globalExceptInEditor: {
        'Enter': onEnter,
        'Down': noteList.selectNext,
        'Up': noteList.selectPrev,
        // 'Ctrl-Backspace': search.deleteSelectedNote,
      }
    };
    document.addEventListener('keydown', keys.makeHandler(keyConfig));

    app.debug.keyConfig = keyConfig;
    app.debug.onSearch = onSearch;

    // Trigger inital display.
    onSearch('');
  }

  function onNoteUpdate(note) {
    noteList.updateNote(note);
  }

  var lastQ;
  function onSearch(q) {
    var terms = null;
    var regexp = null;
    if (q) {
      lastQ = q;
      terms = q.split(/\s+/);  // TODO(wdm) Better term detection.
      regexp = highlight.regexpForSearch(terms);
    }
    var results = search(regexp, model.getNotes());
    noteList.display(terms, results);
  }

  function onEnter() {
    if (!noteList.isSelection()) {
      createNote($('#search').value);
    }
    $('#editor').focus();
  }

  function onSelect(note) { ui.editor.setNote(note); }

  function createNote(title) {
    // One newline is required to mark end of title. The next newline is
    // optional but looks nicer.
    var text = title + '\n\n';
    var note = model.newNote(text);
    // This will trigger onNoteUpdate.
  }

  function debug_load() {
    return db.parseFile(
        '[//]: # (NVC:NOTE.33)\n2. Pancake recipe\n\nEggs milk flour!\n' +
        '[//]: # (NVC:NOTE.22)\n1. Task today\n\nMake pancakes.\n' +
        '[//]: # (NVC:NOTE.44)\n3. Tasks tomorrow\n\nDiet.\n');
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
    debug: {},
  };

})();
