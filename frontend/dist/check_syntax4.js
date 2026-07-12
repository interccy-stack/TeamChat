var fs = require('fs');
var s = fs.readFileSync('index.js', 'utf8');

// Use Node's built-in parser to find the exact error location
try {
  require('module')._compile(s, 'test.js');
} catch(e) {
  console.log('Error message:', e.message);
  // Try to parse the stack for location
  var stack = e.stack;
  console.log('Stack:', stack);
}
