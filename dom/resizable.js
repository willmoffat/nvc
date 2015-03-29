(function() {
  var resizeEl = document.getElementById('noteList');

  function handleMove(e) {
    var w = e.clientX - resizeEl.offsetLeft - 4;
    resizeEl.style.width = w + 'px';
  }

  document.getElementById('dragbar').addEventListener('mousedown', function(e) {
    document.body.classList.add('resizing');
    e.preventDefault();
    document.addEventListener('mousemove', handleMove);
  });

  document.addEventListener('mouseup', function(e) {
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', handleMove);
  });
})();
