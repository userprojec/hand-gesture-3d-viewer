const fs = require('fs');
const js = fs.readFileSync('dist/assets/index-gOdGX67l.js', 'utf8');
console.log('PolarGridHelper:', js.includes('PolarGridHelper'));
console.log('setupUI:', js.includes('setupUI'));
console.log('initHandTracking:', js.includes('initHandTracking'));
console.log('initScene:', js.includes('initScene'));
console.log('panel-toggle:', js.includes('panel-toggle'));
console.log('loadModel:', js.includes('loadModel'));
console.log('File size:', js.length, 'bytes');