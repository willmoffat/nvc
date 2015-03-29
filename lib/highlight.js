var highlight = (function() {
  "use strict";

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

  function buildRegexp(terms, flags) {
    terms = terms.filter(keepTerm);
    if (!terms.length) {
      return null;
    }
    var regexStr = terms.map(escapeRegExp).join('|');
    return new RegExp(regexStr, flags);
  }

  function regexpForSearch(terms) { return buildRegexp(terms, 'i'); }

  function regexpForHighlight(terms) { return buildRegexp(terms, 'gi'); }

  // Highlight terms in text.
  function text(regexp, text) {
    if (typeof text !== 'string') {
      throw new Error('text must be a string');
    }
    text = safeHtml(text);
    if (regexp) {
      text = text.replace(regexp, '<q>$&</q>');
    }
    return text;
  }
  return {
    text: text,
    regexpForHighlight: regexpForHighlight,
    regexpForSearch: regexpForSearch,
  };

})();
