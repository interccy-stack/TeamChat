var fs = require('fs');
var s = fs.readFileSync('index.js', 'utf8');

// Find the problematic area
var start = s.indexOf('// 主界面动画区域');
if (start < 0) {
  console.log('Not found');
  process.exit(1);
}

var block = s.substring(start, start + 25000);

// Count parens from start of block, but properly handle strings
var parens = 0;
var inString = false;
var stringChar = '';
var lines = block.split('\n');
var prevLine = '';

for (var li = 0; li < lines.length; li++) {
  var line = lines[li];
  var inLineStr = inString ? '(inString) ' : '';
  
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    var prev = i > 0 ? line[i-1] : '';
    
    if (inString) {
      if (ch === stringChar && prev !== '\\') {
        inString = false;
      }
    } else {
      if (ch === "'" || ch === '"' || ch === '`') {
        inString = true;
        stringChar = ch;
      } else if (ch === '(') {
        parens++;
      } else if (ch === ')') {
        parens--;
      }
    }
  }
  
  if (parens < 0) {
    console.log('NEGATIVE at line', li+1, '(offset from block start), parens:', parens);
    console.log('Prev line:', JSON.stringify(prevLine));
    console.log('This line:', JSON.stringify(line));
    break;
  }
  
  // Check for string still open at end of line
  if (inString) {
    console.log('STRING OPEN at line', li+1, 'char:', stringChar);
  }
  
  prevLine = line;
}

console.log('Final parens:', parens);
