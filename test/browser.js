// Simulated browser. Loads vanilla JS files and DOM.

var fs = require('fs');
var jsdom = require('jsdom');
var vm = require('vm');

function read(filename) {
  return fs.readFileSync(__dirname + '/' + filename, {encoding: 'utf8'});
}

function exec(context, filename) {
  var js = read(filename);
  vm.runInNewContext(js, context, filename);
}

var browser = {
  document: function(opt_filename) {
    var html = '';
    if (opt_filename) {
      html = read(opt_filename);
    }
    var opts = {
      // Don't fetch scripts.
      features: {FetchExternalResources: []}
    };
    return jsdom.jsdom(html, opts);
  },
  evalFiles: function(files) {
    var context = {};
    files.forEach(function(filename) { exec(context, filename); });
    return context;
  },
};

module.exports = browser;
