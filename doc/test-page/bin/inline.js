var fs = require('fs');

if (!process.argv[2]) {
  console.log('No file given.')
  process.exit(1);
}

var inliner = require('inline-resource');
var result = inliner.inline({
  inlineAll: true,
  files: [process.argv[2]],
  js: true,
  css: true,
  img: true
});

if (!result.length) {
  console.log('File not found or processing error.');
  process.exit(1);
}

result = result.shift();
fs.writeFileSync(result.path, result.data);
