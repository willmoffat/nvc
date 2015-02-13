chrome.app.runtime.onLaunched.addListener(launch);

// We only support one command for now.
// TODO(wdm) Support paste from cliboard or browser URL?
chrome.commands.onCommand.addListener(debug_reset); // TODO(wdm) revert to launch?

// Close without saving! Useful if save code is broken. Then reload.
function debug_reset() {
  var windows = chrome.app.window.getAll();
  if (windows.length) {
    windows[0].contentWindow.close(); // Raw close.
  }
  setTimeout(launch,100);
}

function launch() {
  var windows = chrome.app.window.getAll();
  if (windows.length) {
    windows[0].show();
  } else {
    var launchData = null;  // TODO(wdm) Anything to pass in?
    createWin(launchData);
  }
}

function createWin(launchData) {
  var opts = {
    id: 'NVC-win',
    bounds: {width: 400, height: 500},
    frame: "none",
    // alwaysOnTop: true  // TODO(wdm) Optional. Now it's useful for debugging.
  };
  var callback = function(win) {
    // win.contentWindow.launchData = launchData;
  };
  chrome.app.window.create('window.html', opts, callback);
}
