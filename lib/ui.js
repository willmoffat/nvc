
var ui = {};

ui.searchBox = (function() {
  var observer = function(terms) { console.log('search:', terms) };

  var searchEl;

  function init(searchEl_, opt_observer) {
    searchEl = searchEl_;  // Search text input.
    searchEl.addEventListener('input', onInput);
    if (typeof opt_observer === 'function') {
      observer = opt_observer;
    }
  }

  function onInput() {
    if (observer) {
      observer(searchEl.value);
    }
  }

  function reset() { searchEl.value = ''; }

  return {
    init: init,
    reset: reset,
  };

})();

ui.editor = (function() {

  var textEl;
  var note;   // Item to edit.
  var dirty;  // Has note been edited.

  function init(textEl_) {
    textEl = textEl_;
    textEl.addEventListener('input', onInput);
    reset();
  }

  function onInput() {
    if (!note) {
      throw new Error('editor has no note to edit');
    }
    dirty = (textEl.value !== note.text);
    // TODO(wdm) Notify change? Constantly edit note object?
  }

  function getText() { return textEl.value; }

  function focus() {
    textEl.focus();
    // Move to first line after title.
    var pos = note.title.length + 1;
    if (note.text[pos] === '\n') {
      pos++;
    }
    textEl.setSelectionRange(pos, pos);
    textEl.scrollTop = 0;
  }

  function setNote(note_) {
    if (!note_) {
      reset();
      return;
    }
    db.validate(note_);
    note = note_;
    textEl.value = note.text;
    textEl.disabled = false;
    dirty = false;
  }

  function reset() {
    if (dirty) {
      throw new Error('tried to reset dirty editor');
    }
    note = null;
    textEl.value = '';
    textEl.disabled = true;
  }

  return {
    init: init,
    getText: getText,
    setNote: setNote,
    reset: reset,
  };
})();

// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = ui;
}
