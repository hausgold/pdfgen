const fs = require('fs');
const pug = require('pug');

// The pug template and the destination of the rendered HTML file
const [source, destination] = process.argv.slice(2);

if (!source || !destination) {
  console.log('Usage: render.js SOURCE DESTINATION');
  process.exit(1);
}

// Render the template, pug inlines all the included assets on its own
fs.writeFileSync(destination, pug.renderFile(source));
