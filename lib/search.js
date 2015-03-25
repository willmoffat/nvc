var search = (function() {

  function byTitle(a, b) {
    if (a.title > b.title) {
      return 1;
    }
    if (a.title < b.title) {
      return -1;
    }
    return 0;
  }

  function searchFor(terms, notes) {
    if (!terms || !notes) {
      throw new Error('missing terms or notes');
    }
    var results = notes;
    if (terms.length) {
      results = notes.filter(function(note) {
        return terms.some(function(term) {
          return note.text.indexOf(term) !== -1;
        });
      });
    }
    return results.sort(byTitle);
  }

  return searchFor;

})();


// NodeJS support.
if (typeof module !== 'undefined') {
  module.exports = search;
}
