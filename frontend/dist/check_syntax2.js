var fs = require('fs');
var s = fs.readFileSync('index.js', 'utf8');
var lines = s.split('\n');
var L = lines[6113];

// Find SVG string boundaries
var strStart = L.indexOf("__html:'");
var strEnd = L.lastIndexOf("'})");
console.log('String start:', strStart);
console.log('String end:', strEnd);

if (strStart >= 0 && strEnd >= 0) {
  var svg = L.substring(strStart + 7, strEnd);
  console.log('SVG length:', svg.length);

  // Count single quotes in SVG
  var sqCount = 0;
  for (var i = 0; i < svg.length; i++) {
    if (svg[i] === "'") sqCount++;
  }
  console.log('Single quotes in SVG:', sqCount);
}

// Also check line 6115 for any issues
var L6115 = lines[6114];
console.log('\nLine 6115:');
// Check for object literal syntax issues
var objStart = L6115.indexOf('{style:{');
if (objStart >= 0) {
  console.log('Has style object starting at:', objStart);
  var afterStyle = L6115.substring(objStart, objStart + 100);
  console.log('Style context:', afterStyle);
}
