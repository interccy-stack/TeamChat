var fs = require('fs');
var s = fs.readFileSync('index.js', 'utf8');

// Find the problematic area
var start = s.indexOf('// 主界面动画区域');
var end = start + 25000;
if (end > s.length) end = s.length;
var block = s.substring(start, end);

// Count parentheses
var parens = 0;
var inString = false;
var stringChar = '';
var lines = block.split('\n');
for (var li = 0; li < lines.length; li++) {
  var line = lines[li];
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
  // console.log('Line ' + (start_line + li) + ': ' + line.substring(0, 80));
}

console.log('Block paren balance:', parens);
console.log('Block starts at char:', start);
// Find where balance goes negative
parens = 0;
inString = false;
stringChar = '';
var firstNeg = -1;
for (var i = 0; i < block.length; i++) {
  var ch = block[i];
  var prev = i > 0 ? block[i-1] : '';
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
      if (parens < 0 && firstNeg < 0) {
        firstNeg = i;
      }
    }
  }
}
console.log('First negative paren at block offset:', firstNeg);
if (firstNeg >= 0) {
  console.log('Context: ' + block.substring(Math.max(0, firstNeg-30), firstNeg+30));
}
