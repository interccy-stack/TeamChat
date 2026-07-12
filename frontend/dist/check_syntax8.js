var fs = require('fs');
var s = fs.readFileSync('index.js', 'utf8');
var lines = s.split('\n');
var L6113 = lines[6113]; // line 6114 (0-indexed)
var L6114 = lines[6114]; // line 6115
var L6115 = lines[6115]; // line 6116
var L6116 = lines[6116]; // line 6117

// Check the end of line 6113 (the inner SVG div)
console.log('Line 6114 end:', JSON.stringify(L6113.slice(-15)));
console.log('Line 6115 start:', JSON.stringify(L6114.slice(0, 15)));
console.log('Line 6115:', JSON.stringify(L6114.trim()));
console.log('Line 6116:', JSON.stringify(L6115.trim()));
console.log('Line 6117:', JSON.stringify(L6116.trim()));

// Check for escaped quotes
var strStart = L6113.indexOf("__html:'");
var strEnd = L6113.lastIndexOf("'})");
console.log('\nString from', strStart, 'to', strEnd);

// Check if there's any `\` escaping
var beforeQuote = L6113.substring(strEnd - 3, strEnd + 2);
console.log('Before closing quote:', JSON.stringify(beforeQuote));

// Check for any unusual characters in the SVG
var svgContent = L6113.substring(strStart + 7, strEnd);
var unusual = [];
for (var i = 0; i < svgContent.length; i++) {
  var c = svgContent.charCodeAt(i);
  if (c < 32 && c !== 10 && c !== 13) {
    unusual.push({pos: i, char: c, context: svgContent.substring(Math.max(0,i-5), i+5)});
  }
  // Check for backtick
  if (svgContent[i] === '`') unusual.push({pos: i, char: 'BACKTICK', context: svgContent.substring(Math.max(0,i-5), i+5)});
}
if (unusual.length > 0) {
  console.log('Unusual chars:', JSON.stringify(unusual));
} else {
  console.log('No unusual characters found');
}
