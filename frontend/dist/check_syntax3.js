var fs = require('fs');
var s = fs.readFileSync('index.js', 'utf8');
var lines = s.split('\n');
var L = lines[6113];

var strStart = L.indexOf("__html:'");
var strEnd = L.lastIndexOf("'})");
var svg = L.substring(strStart + 7, strEnd);

// Find the single quote
var sqPos = svg.indexOf("'");
console.log('Single quote at SVG position:', sqPos);
console.log('Context (50 chars around):');
console.log('Before:', JSON.stringify(svg.substring(Math.max(0, sqPos-40), sqPos)));
console.log('At:', JSON.stringify(svg[sqPos]));
console.log('After:', JSON.stringify(svg.substring(sqPos+1, sqPos+40)));
