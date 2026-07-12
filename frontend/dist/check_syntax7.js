var fs = require('fs');
var s = fs.readFileSync('index.js', 'utf8');

// Check for \r issues - replace all \r\n with \n and test
var cleaned = s.replace(/\r\n/g, '\n');
try {
  new Function(cleaned);
  console.log('After \\r\\n→\\n: SYNTAX OK');
} catch(e) {
  console.log('After \\r\\n→\\n: SYNTAX ERROR:', e.message);
}

// Also check for standalone \r
var cleaned2 = s.replace(/\r/g, '');
try {
  new Function(cleaned2);
  console.log('After \\r→empty: SYNTAX OK');
} catch(e) {
  console.log('After \\r→empty: SYNTAX ERROR:', e.message);
}
