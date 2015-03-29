var keys = (function() {
  "use strict";

  var keyNames = {
    8: 'Backspace',
    13: 'Enter',
    27: 'Escape',
    38: 'Up',
    40: 'Down',
  };

  function makeHandler(handlers) {
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

  return {
    makeHandler: makeHandler,
  };
})();
