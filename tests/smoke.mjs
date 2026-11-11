import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { answerQuestion } from '../server/src/chatbot.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const expected=[
 'README.md','docker-compose.yml','start.sh','start-windows.bat',
 'server/src/index.js','server/src/db.js','server/src/chatbot.js','server/schema.sql',
 'client/src/App.jsx','client/src/StudentPages.jsx','client/src/AdminPages.jsx','client/src/styles.css',
 'client/index.html','client/vite.config.js','client/package.json','server/package.json'
];
for(const file of expected)assert(fs.existsSync(path.join(root,file)),`Missing ${file}`);
const routes=fs.readFileSync(path.join(root,'server/src/index.js'),'utf8');
const endpoints=['/api/auth/register','/api/auth/login','/api/auth/forgot','/api/profile','/api/applications','/api/documents/upload','/api/accommodation','/api/dashboard','/api/chat','/api/admin/students','/api/admin/applications','/api/admin/documents','/api/admin/accommodations','/api/admin/reset-requests','/api/admin/announcements'];
for(const endpoint of endpoints)assert(routes.includes(endpoint),`Missing endpoint: ${endpoint}`);
for(const [question,keyword] of [
 ['How to apply?','application'],['How to upload passport?','Documents'],
 ['Can I request accommodation?','Accommodation'],['How to reset my password?','password'],
 ['Where is DMU?','Leicester']
]) assert(answerQuestion(question).toLowerCase().includes(keyword.toLowerCase()),`Chatbot missed ${question}`);
assert(answerQuestion('unexpected extraterrestrial inquiry').includes('I can help'), 'Chatbot fallback unavailable');
console.log(`PASS: ${expected.length} project files, ${endpoints.length} API endpoints, 6 chatbot cases.`);
