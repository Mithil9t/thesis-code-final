import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {digitsOnly, phoneKeyAllowed, blockNonDigitKey, blockNonDigitBeforeInput, phoneAfterPaste} from '../client/src/phoneInput.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const get = file => readFileSync(path.join(root,file),'utf8');
const shell = get('client/src/App.jsx');
const css = get('client/src/styles.css');
const ui = get('client/src/ui.jsx');
const student = get('client/src/StudentPages.jsx');
const admin = get('client/src/AdminPages.jsx');
const api = get('server/src/index.js');

// Non-digit characters cannot become part of an input value, even via paste/autofill.
assert.equal(digitsOnly('abc012 345-6789x'), '0123456789');
assert.equal(digitsOnly('12345678901234567890'), '123456789012345');
assert.equal(digitsOnly(''), '');
assert.equal(phoneKeyAllowed({key:'5',ctrlKey:false,metaKey:false,altKey:false}), true);
assert.equal(phoneKeyAllowed({key:'A',ctrlKey:false,metaKey:false,altKey:false}), false);
assert.equal(phoneKeyAllowed({key:'?',ctrlKey:false,metaKey:false,altKey:false}), false);
assert.equal(phoneKeyAllowed({key:'Backspace',ctrlKey:false,metaKey:false,altKey:false}), true);
assert.equal(phoneKeyAllowed({key:'a',ctrlKey:true,metaKey:false,altKey:false}), true);
let blocked = false;
blockNonDigitKey({key:'r',ctrlKey:false,metaKey:false,altKey:false,preventDefault:()=>{blocked=true}});
assert.equal(blocked,true);
blocked = false;
blockNonDigitBeforeInput({data:'o',preventDefault:()=>{blocked=true}});
assert.equal(blocked,true);
blocked = false;
blockNonDigitBeforeInput({data:'7',preventDefault:()=>{blocked=true}});
assert.equal(blocked,false);
assert.deepEqual(phoneAfterPaste('07189','abcd33x',2,3),{value:'073389',caret:4});
assert.deepEqual(phoneAfterPaste('', '123456789012345678',0,0), {value:'123456789012345',caret:15});

// Shared field is used by student AND administrator, with every input path guarded.
assert.match(ui,/export function PhoneNumberInput\(/);
for(const handler of ['onBeforeInput={blockNonDigitBeforeInput}', 'onKeyDown={blockNonDigitKey}', 'onPaste={paste}', 'onInput={update}', 'onChange={update}']) assert.ok(ui.includes(handler),handler);
assert.match(ui,/maxLength={PHONE_MAX_LENGTH}/);
assert.match(ui,/minLength=\{7\}/);
assert.ok(ui.includes('pattern="[0-9]{7,15}"'));
assert.match(student,/<PhoneNumberInput label="Telephone number \(7-15 digits\)"/);
assert.match(admin,/<PhoneNumberInput label="Telephone number \(7-15 digits\)"/);
assert.match(api,/\^\[0-9\]\{7,15\}\$/);

// The header hamburger is the ONLY navigation toggle, both large and small viewports.
assert.equal(shell.includes('className="sidebar-close'),false);
assert.equal(shell.includes('<X size={19}'),false);
assert.match(shell,/onClick={toggleSidebar}/);
assert.match(shell,/setDesktopCollapsed\(collapsed=>!collapsed\)/);
assert.match(shell,/setSidebarOpen\(open=>!open\)/);
assert.match(shell,/hamburger-drawer-open/);
assert.match(css,/@media\(min-width:1021px\)\{\s*\.desktop-sidebar-collapsed \.sidebar\{display:none!important\}/);
assert.match(css,/\.topbar \.hamburger\.hamburger-drawer-open\{position:fixed;z-index:32/);
assert.match(css,/\.sidebar-nav\{flex:1 1 auto;min-height:0;overflow-y:auto/);
assert.equal(css.includes('.sidebar .sidebar-close{display:inline-flex'),false);
assert.ok(get('update-windows.bat').includes('docker compose build --no-cache web api'));
console.log('PASS: digits-only typing, clipboard insertion, 7–15 digit limits, student/admin fields and hamburger-only responsive sidebar.');
