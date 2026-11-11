import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNIVERSITY } from '../client/src/university.js';
import { answerQuestion } from '../server/src/chatbot.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.equal(UNIVERSITY.name,'De Montfort University');
assert.equal(UNIVERSITY.city,'Leicester');
assert.equal(UNIVERSITY.faculty,'Faculty of Computing, Engineering and Media');
assert.equal(UNIVERSITY.degree,'Computer Science BSc (Hons)');
assert.equal(UNIVERSITY.author,'Mithil Mahbub');
assert.equal(UNIVERSITY.supervisor,'Bernice Bryan');
assert.equal(UNIVERSITY.module,'CTEC3451');
assert(fs.statSync(path.join(root,'client/public/dmu-logo.png')).size>5000,'missing official logo from user template');
for (const file of ['client/src/App.jsx','client/src/ui.jsx','client/src/StudentPages.jsx','client/index.html']) {
  const text=fs.readFileSync(path.join(root,file),'utf8');
  assert(!/Nantong|NTU202600|Fall 2026|Chinese/.test(text),`Previous university content in ${file}`);
}
assert(answerQuestion('When is the deadline?').includes('not official De Montfort University deadlines')); 
assert(answerQuestion('Where is DMU?').includes('Leicester'));
assert(answerQuestion('Accommodation').includes('does not book accommodation'));
console.log('PASS: DMU contract details, logo, onboarding safety notices and chatbot routing');
