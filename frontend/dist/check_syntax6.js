var fs = require('fs');
var s = fs.readFileSync('index.js', 'utf8');

// Try to find exact error by evaluating the problematic line
// First, find the exact area and try to parse functions around it

// Try using acorn or esprima... but they may not be available
// Let's just find the error by binary search in the file

// Extract a safe prefix that compiles
function isSyntaxOK(code) {
  try {
    new Function(code);
    return true;
  } catch(e) {
    return false;
  }
}

// Find the problematic position by bisecting
var start = s.indexOf("// 主界面动画区域");
var prefix = s.substring(0, start);

// Find from the end to avoid node --check issues
for (var i = start + 50; i < s.length && i < start + 30000; i++) {
  var fragment = prefix + s.substring(start, i);
  try {
    new Function(fragment);
  } catch(e) {
    // Check if this is the same error as --check
    if (e.message.indexOf("Unexpected token") >= 0) {
      console.log("Error at offset", i, "relative to block start:", i - start);
      var context = s.substring(Math.max(0, i-50), Math.min(s.length, i+50));
      console.log("Context:", JSON.stringify(context));
      break;
    }
  }
}
