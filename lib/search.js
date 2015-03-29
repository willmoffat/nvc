var search = (function() {
  "use strict";

  function byTitle(a, b) {
    if (a.title > b.title) {
      return 1;
    }
    if (a.title < b.title) {
      return -1;
    }
    return 0;
  }

  function searchFor(regexp, notes) {
    if (!notes) {
      throw new Error('missing notes');
    }
    var results = notes;
    if (regexp) {
      results =
          notes.filter(function(note) { return note.text.match(regexp); });
    }
    return results.sort(byTitle);
  }

  return searchFor;

})();
