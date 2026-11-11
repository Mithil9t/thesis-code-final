import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {CHAT_FAQS, suggestedQuestions, preparedAnswer, offlineAnswer} from '../client/src/chatKnowledge.js';
import {answerQuestion} from '../server/src/chatbot.js';
import {nextChatMessages} from '../client/src/chatSession.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=fs.readFileSync(path.join(root,'client/src/App.jsx'),'utf8');
const chat=fs.readFileSync(path.join(root,'client/src/WelcomeChat.jsx'),'utf8');
const db=fs.readFileSync(path.join(root,'server/src/db.js'),'utf8');

assert.equal(CHAT_FAQS.length,12,'expected twelve prepared questions');
for(const faq of CHAT_FAQS){
  assert.equal(preparedAnswer(faq.question),faq.answer,`Missing prepared answer: ${faq.question}`);
  assert(faq.answer.length>70,`Insufficient guidance: ${faq.question}`);
  assert(offlineAnswer(faq.question).includes(faq.answer),`Offline fallback missed: ${faq.question}`);
}
for(const [query,expectedQuestion] of [
  ['apply','How to apply?'],
  ['required doc','Required documents'],
  ['accom','Accommodation'],
  ['application status','How do I track my application?'],
  ['passw','I forgot my password. What should I do?'],
  ['profile','How do I update my profile?'],
  ['deadline','What are the application deadlines?'],
  ['leicester','Where is De Montfort University?']
]){
  const result=suggestedQuestions(query);
  assert(result.some(f=>f.question===expectedQuestion),`Suggestion for '${query}' missing '${expectedQuestion}'`);
}
assert.deepEqual(suggestedQuestions(''),[]);
assert(offlineAnswer('How do I apply for accommodation?').includes('room type'),'offline housing intent not prioritised');
assert(offlineAnswer('Where is my application status?').includes('Pending'),'offline status intent not prioritised');
assert(offlineAnswer('unexpected question about quantum foam').startsWith('I can help'),'unknown requests need safe fallback');
assert.equal(suggestedQuestions('accom').length,1);
for(const [prompt,fragment] of [
  ['How to apply?','Applications'],
  ['Required documents','passport'],
  ['Accommodation','accommodation'],
  ['How can I apply for accommodation?','Accommodation'],
  ['I forgot my password','Forgot password'],
  ['How to upload a document?','Documents'],
  ['What if my document is rejected?','rejected'],
  ['How do I track my application?','Pending'],
  ['Where is DMU?','Leicester']
]) assert(answerQuestion(prompt).toLowerCase().includes(fragment.toLowerCase()),`Server bot missed ${prompt}`);
assert(chat.includes('onClick={() => ask(faq.question)}'),'Quick/suggested buttons not connected to ask');
assert(chat.includes('onKeyDown={handleKeyDown}'),'Keyboard suggestion selection missing');
assert(chat.includes('nextChatMessages(previous, prompt)'),'Atomic local chatbot message update missing');
assert(app.includes('<WelcomeChat/>'),'Welcome assistant not present on student pages');
assert(!chat.includes('scrollIntoView(') || chat.includes('// scrollIntoView('),'Chat should not call scrollIntoView');
assert(chat.includes('class ChatErrorBoundary'),'Missing chatbot crash isolation');
let history=[{from:'bot',text:'Welcome!'}];
for(const faq of CHAT_FAQS){
  const before=history;
  history=nextChatMessages(history,faq.question);
  assert.equal(history.length,before.length+2,'Question must append two messages');
  assert.equal(history.at(-2).text,faq.question);
  assert.equal(history.at(-1).text,faq.answer);
  assert.equal(before.length,history.length-2,'Must not mutate old React state');
}
assert.equal(nextChatMessages(history,'').length,history.length);
const unknown=nextChatMessages(history,'What is the colour of Jupiter?');
assert(unknown.at(-1).text.startsWith('I can help'),'Unknown questions need a helpful fallback');
assert(db.includes("'Mithil Mahbub','mithil@welcome.test','Bangladesh','Computer Science','DMU-DEMO-001'"),'Seed user not updated');
assert(db.includes('Existing demo student updated: Aisha -> Mithil'),'Existing-volume migration missing');
console.log('PASS: 12 client FAQ replies, 8 suggestion searches, 9 server intents, frontend interactions and demo-account migration.');
