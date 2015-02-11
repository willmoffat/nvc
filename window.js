var dirtMonitor = (function() {
  var isDirty = false;
  var titlebar = document.querySelector('.titlebar');
  var setDirty = function() {
    if (!isDirty) {
      isDirty = true;
      titlebar.classList.add('dirty');
    }
  };
  var setClean = function() {
    if (isDirty) {
      isDirty = false;
      titlebar.classList.remove('dirty');
    }
  };
  return {
    isDirty: function() { return isDirty; },
    setDirty: setDirty,
    setClean: setClean
  };
})();

function updateTextArea(text) {
  textarea.value = text;
  textarea.focus();
  // TODO(wdm) Restore actual previous position.
  textarea.setSelectionRange(0, 0);
  textarea.scrollTop = 0;
}

function setCaret(elem, pos) {
  var range = elem.createTextRange();
  range.collapse(true);
  range.moveEnd('character', pos);
  range.moveStart('character', pos);
  range.select();
}

function save(callback) {
  if (!dirtMonitor.isDirty) {
    console.log('skipping save');
    callback();
    return;
  }
  var blob = new Blob([textarea.value], {type: 'text/plain'});
  var wrappedCallback = function() {
    // TODO(wdm) IMPORTANT! error handling.
    console.log('done');
    dirtMonitor.setClean();
    if (callback) {
      callback();
    }
  };
  console.log('saving...');
  writeFileEntry(chosenEntry, blob, wrappedCallback);
}

function doClose() {
  save(function() { window.close(); });
}


var CODE_W = 'W'.charCodeAt(0);
var CODE_S = 'S'.charCodeAt(0);
var CODE_1 = '1'.charCodeAt(0);
var CODE_ESC = 27;

function onKeydown(e) {
  if (e.keyCode === CODE_ESC) {
    e.preventDefault();
    doClose();
  }
  if (e.altKey) {
    if (e.keyCode === CODE_1) {
      e.preventDefault();
      doClose();
    }
  }
  if (e.ctrlKey) {
    if (e.keyCode === CODE_W) {
      e.preventDefault();
      doClose();
    } else if (e.keyCode === CODE_S) {
      e.preventDefault();
      save();
    }
  }
}

function init() {
  restoreChosenFile();
  window.addEventListener('keydown', onKeydown);
  textarea.addEventListener('input', dirtMonitor.setDirty);
}

init();
