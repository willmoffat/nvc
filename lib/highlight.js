var safeHtml;

var highlight = (function() {

  function safeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegExp(str) {
    return str.replace(/[.^$*+?()[{\\|\]-]/g, '\\$&');
  }

  // Don't hightlight 1 and 2 char words.
  // TODO(wdm) Highlight [], #.
  function keepTerm(term) { return term.length > 2; }

  function highlight(terms, text) {
    if (!terms || !Array.isArray(terms)) {
      throw new Error('invalid terms args');
    }
    if (typeof text !== 'string') {
      throw new Error('text must be a string');
    }
    text = safeHtml(text);
    if (terms && terms.length) {
      var regexStr = terms.filter(keepTerm).map(escapeRegExp).join('|');
      var regex = new RegExp(regexStr, 'gi');
      text = text.replace(regex, '<q>$&</q>');
    }
    return text;
  }
  return highlight;
})();


// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = highlight;
  var document;
  require('jsdom')
      .env("", [], function(errors, window) { document = window.document; });
}
