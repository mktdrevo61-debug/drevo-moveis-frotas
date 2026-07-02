const fs = require('fs');
const path = require('path');
const dirs = ['src/controllers', 'src/models', 'src/routes', 'src/config', 'src/services'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.js')) {
      const p = path.join(dir, f);
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('\\`')) {
        c = c.split('\\`').join('`');
        fs.writeFileSync(p, c);
        console.log(`Fixed ${p}`);
      }
    }
  });
});
