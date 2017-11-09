// Lets do it the vanilla way
document.addEventListener("DOMContentLoaded", function() {
  // Collect all the pages
  var pagesNumbers = document.getElementsByClassName('page-number');

  // Add the total page number count to each
  Array.from(pagesNumbers).forEach(function(number) {
    number.innerHTML = pagesNumbers.length;
  });
});
