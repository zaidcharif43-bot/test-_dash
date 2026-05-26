const fs = require('fs');
const lines = fs.readFileSync('test-_dash/src/app/page.tsx', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('teamPasswordDrafts')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
