import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initializeDatabase, one, pool, query } from './db.js';
import { answerQuestion } from './chatbot.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || '';
if (JWT_SECRET.length < 32) { console.error('JWT_SECRET must be at least 32 characters; see server/.env.example'); process.exit(1); }
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './data/uploads');
await fs.mkdir(UPLOAD_DIR,{recursive:true});
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(s=>s.trim())}));
app.use(express.json({limit:'256kb'}));
const authLimiter = rateLimit({windowMs:15*60*1000,limit:40,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many attempts. Please try again later.'}});
const passwordLimiter = rateLimit({windowMs:60*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many recovery requests. Please try later.'}});

function fail(status,message) {const e=new Error(message);e.status=status;throw e;}
function asyncRoute(fn) {return (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);}
function requiredString(value,label,max=255) {const s=typeof value==='string'?value.trim():'';if(!s)fail(400,`${label} is required.`);if(s.length>max)fail(400,`${label} is too long.`);return s;}
function optionalString(value,label,max=255) {if(value===null||value===undefined||value==='')return null;if(typeof value!=='string'||value.trim().length>max)fail(400,`Invalid ${label}.`);return value.trim();}
function emailString(value){const s=requiredString(value,'Email',190).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))fail(400,'Enter a valid email address.');return s;}
function strongPassword(value){if(typeof value!=='string'||value.length<8||value.length>128||!/[A-Za-z]/.test(value)||!/[0-9]/.test(value))fail(400,'Password must have 8–128 characters including letters and numbers.');return value;}
function pickStatus(value,allowed){if(!allowed.includes(value))fail(400,'Invalid status.');return value;}
function idParam(req){const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<=0)fail(400,'Invalid record ID.');return id;}
function cleanDate(value){
  if(!value)return null;
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail(400,'Enter a valid date (YYYY-MM-DD).');
  const [year,month,day]=value.split('-').map(Number);
  const d=new Date(Date.UTC(year,month-1,day));
  if(d.getUTCFullYear()!==year||d.getUTCMonth()+1!==month||d.getUTCDate()!==day)fail(400,'Enter a valid calendar date.');
  return value;
}
function validTelephone(value){
  if(value===undefined || value===null || value==='')return null;
  if(typeof value!=='string' || !/^[0-9]{7,15}$/.test(value))fail(400,'Telephone number must contain 7 to 15 digits only.');
  return value;
}
function validatePersonalDates(birth,arrival){
  if(birth && birth>new Date().toISOString().slice(0,10))fail(400,'Date of birth cannot be in the future.');
  if(birth && arrival && arrival<birth)fail(400,'Expected arrival cannot be earlier than date of birth.');
}
const userFields='id,role,full_name,email,student_number,nationality,major,faculty,phone,gender,date_of_birth,arrival_date,contact_address,created_at';
const tokenFor=(user)=>jwt.sign({sub:String(user.id),role:user.role},JWT_SECRET,{expiresIn:'12h',algorithm:'HS256'});
async function authentication(req,res,next){try{const auth=req.headers.authorization||'';if(!auth.startsWith('Bearer '))fail(401,'Please log in to continue.');const payload=jwt.verify(auth.slice(7),JWT_SECRET,{algorithms:['HS256']});const user=await one(`SELECT ${userFields} FROM users WHERE id=?`,[Number(payload.sub)]);if(!user||user.role!==payload.role)fail(401,'Your session is no longer valid.');req.user=user;next();}catch(err){if(err.name==='TokenExpiredError'||err.name==='JsonWebTokenError')return next(Object.assign(new Error('Session expired. Please log in again.'),{status:401}));next(err);}}
function adminOnly(req,res,next){if(req.user.role!=='admin')return next(Object.assign(new Error('Administrator access required.'),{status:403}));next();}
async function studentOnly(req,res,next){if(req.user.role!=='student')return next(Object.assign(new Error('Student access required.'),{status:403}));next();}

app.get('/api/health', asyncRoute(async(req,res)=>{await query('SELECT 1 AS ok');res.json({ok:true,service:'DMU Smart Welcome Prototype API'});}));

app.post('/api/auth/register',authLimiter,asyncRoute(async(req,res)=>{
  const name=requiredString(req.body.full_name,'Full name',150);
  const email=emailString(req.body.email);
  const hash=await bcrypt.hash(strongPassword(req.body.password),12);
  const nationality=optionalString(req.body.nationality,'nationality',100);
  const major=optionalString(req.body.major,'major',150);
  if(await one('SELECT id FROM users WHERE email=?',[email]))fail(409,'This email is already registered.');
  let result;try {result=await query('INSERT INTO users (role,full_name,email,password_hash,nationality,major) VALUES (?,?,?,?,?,?)',['student',name,email,hash,nationality,major]);}catch(e){if(e.code==='ER_DUP_ENTRY')fail(409,'This email is already registered.');throw e;}
  const user=await one(`SELECT ${userFields} FROM users WHERE id=?`,[result.insertId]);
  res.status(201).json({token:tokenFor(user),user});
}));
app.post('/api/auth/login',authLimiter,asyncRoute(async(req,res)=>{
  const email=emailString(req.body.email);
  const password=req.body.password;
  if(typeof password!=='string')fail(400,'Password is required.');
  const record=await one('SELECT id,role,password_hash FROM users WHERE email=?',[email]);
  if(!record||!await bcrypt.compare(password,record.password_hash))fail(401,'Incorrect email or password.');
  const user=await one(`SELECT ${userFields} FROM users WHERE id=?`,[record.id]);
  res.json({token:tokenFor(user),user});
}));
app.post('/api/auth/forgot',passwordLimiter,asyncRoute(async(req,res)=>{
  const email=emailString(req.body.email);
  const pw=strongPassword(req.body.new_password);
  const reason=optionalString(req.body.reason,'reason',250);
  const account=await one('SELECT id FROM users WHERE email=? AND role=?',[email,'student']);
  if(account){
    const hash=await bcrypt.hash(pw,12);
    await query('DELETE FROM password_reset_requests WHERE user_id=? AND status=?',[account.id,'pending']);
    await query('INSERT INTO password_reset_requests (user_id,proposed_password_hash,reason) VALUES (?,?,?)',[account.id,hash,reason]);
  }
  res.json({message:'If the account exists, a request has been sent to an administrator. Your new password will work only after staff verify your identity and approve it.'});
}));
app.get('/api/auth/me',authentication,(req,res)=>res.json({user:req.user}));

app.use('/api',authentication);
app.get('/api/profile',(req,res)=>res.json({profile:req.user}));
app.put('/api/profile',studentOnly,asyncRoute(async(req,res)=>{
  const updates={full_name:requiredString(req.body.full_name,'Name',150),nationality:optionalString(req.body.nationality,'nationality',100),major:optionalString(req.body.major,'major',150),faculty:optionalString(req.body.faculty,'faculty',150),phone:validTelephone(req.body.phone),gender:optionalString(req.body.gender,'gender',32),student_number:optionalString(req.body.student_number,'student number',40),date_of_birth:cleanDate(req.body.date_of_birth),arrival_date:cleanDate(req.body.arrival_date),contact_address:optionalString(req.body.contact_address,'address',250)};
  validatePersonalDates(updates.date_of_birth,updates.arrival_date);
  await query(`UPDATE users SET ${Object.keys(updates).map(k=>k+'=?').join(',')} WHERE id=?`,[...Object.values(updates),req.user.id]);
  res.json({profile:await one(`SELECT ${userFields} FROM users WHERE id=?`,[req.user.id]),message:'Profile updated.'});
}));

const appColumns='id,user_id,program,intake,previous_school,qualification,statement,status,review_note,submitted_at,reviewed_at,created_at,updated_at';
app.get('/api/applications',studentOnly,asyncRoute(async(req,res)=>res.json({applications:await query(`SELECT ${appColumns} FROM applications WHERE user_id=? ORDER BY updated_at DESC,id DESC`,[req.user.id])})));
app.post('/api/applications',studentOnly,asyncRoute(async(req,res)=>{
  const data=[requiredString(req.body.program,'Program',160),requiredString(req.body.intake,'Intake',80),optionalString(req.body.previous_school,'previous school',180),optionalString(req.body.qualification,'qualification',120),optionalString(req.body.statement,'statement',4000)];
  const submit=req.body.submit===true;
  const result=await query('INSERT INTO applications (user_id,program,intake,previous_school,qualification,statement,status,submitted_at) VALUES (?,?,?,?,?,?,?,?)',[req.user.id,...data,submit?'pending':'draft',submit?new Date():null]);
  res.status(201).json({application:await one(`SELECT ${appColumns} FROM applications WHERE id=?`,[result.insertId])});
}));
app.put('/api/applications/:id',studentOnly,asyncRoute(async(req,res)=>{
  const record=await one('SELECT * FROM applications WHERE id=? AND user_id=?',[idParam(req),req.user.id]);
  if(!record)fail(404,'Application not found.');
  if(!['draft','changes_requested'].includes(record.status))fail(409,'Only drafts or change requests can be edited.');
  const data=[requiredString(req.body.program,'Program',160),requiredString(req.body.intake,'Intake',80),optionalString(req.body.previous_school,'previous school',180),optionalString(req.body.qualification,'qualification',120),optionalString(req.body.statement,'statement',4000)];
  const submit=req.body.submit===true;
  await query('UPDATE applications SET program=?,intake=?,previous_school=?,qualification=?,statement=?,status=?,submitted_at=IF(?,NOW(),submitted_at),review_note=NULL,reviewed_at=NULL WHERE id=?',[...data,submit?'pending':'draft',submit,record.id]);
  res.json({application:await one(`SELECT ${appColumns} FROM applications WHERE id=?`,[record.id])});
}));
app.post('/api/applications/:id/submit',studentOnly,asyncRoute(async(req,res)=>{
  const row=await one('SELECT id,status FROM applications WHERE id=? AND user_id=?',[idParam(req),req.user.id]);
  if(!row)fail(404,'Application not found.');
  if(!['draft','changes_requested'].includes(row.status))fail(409,'This application cannot be submitted again.');
  await query("UPDATE applications SET status='pending',submitted_at=NOW(),review_note=NULL,reviewed_at=NULL WHERE id=?",[row.id]);
  res.json({message:'Application submitted.'});
}));

const documentsQuery=`SELECT d.id,d.user_id,d.category,d.original_name,d.mime_type,d.size_bytes,d.status,d.review_note,d.uploaded_at,d.reviewed_at FROM documents d`;
app.get('/api/documents',studentOnly,asyncRoute(async(req,res)=>res.json({documents:await query(`${documentsQuery} WHERE user_id=? ORDER BY uploaded_at DESC,id DESC`,[req.user.id])})));
const disk = multer.diskStorage({destination:UPLOAD_DIR,filename:(req,file,cb)=>cb(null,randomUUID())});
const upload = multer({storage:disk,limits:{fileSize:8*1024*1024,files:1},fileFilter:(req,file,cb)=>{if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.mimetype))return cb(new Error('Only PDF, JPG, PNG and WEBP files are allowed.'));cb(null,true);}});
function safeUpload(req,res,next){upload.single('file')(req,res,err=>{if(err)return next(Object.assign(err,{status:400}));next();});}
function detectMime(bytes){if(bytes.subarray(0,5).toString()==='%PDF-')return 'application/pdf';if(bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return 'image/webp';return null;}
app.post('/api/documents/upload',studentOnly,safeUpload,asyncRoute(async(req,res)=>{
  if(!req.file)fail(400,'Choose a file.');
  try{
    const category=pickStatus(req.body.category,['passport','transcript','certificate','photo','other']);
    const bytes=await fs.readFile(req.file.path);
    const detected=detectMime(bytes);
    if(!detected||detected!==req.file.mimetype)fail(400,'File contents do not match the supported file type.');
    const result=await query('INSERT INTO documents (user_id,category,original_name,stored_name,mime_type,size_bytes) VALUES (?,?,?,?,?,?)',[req.user.id,category,path.basename(req.file.originalname).slice(0,255),req.file.filename,detected,req.file.size]);
    res.status(201).json({document:await one(`${documentsQuery} WHERE d.id=?`,[result.insertId])});
  }catch(e){await fs.unlink(req.file.path).catch(()=>{});throw e;}
}));
app.get('/api/documents/:id/download',asyncRoute(async(req,res)=>{
  const doc=await one('SELECT * FROM documents WHERE id=?',[idParam(req)]);
  if(!doc)fail(404,'Document not found.');
  if(req.user.role!=='admin'&&doc.user_id!==req.user.id)fail(403,'Not allowed to access this document.');
  const fpath=path.join(UPLOAD_DIR,doc.stored_name);
  try{await fs.access(fpath);}catch{fail(404,'Uploaded file is missing.');}
  const safeName=doc.original_name.replace(/[\r\n"\\]/g,'_');
  res.setHeader('Content-Type',doc.mime_type);
  res.setHeader('Content-Disposition',`attachment; filename="${safeName.replace(/[^\x20-\x7E]/g,'_')}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.sendFile(fpath);
}));
app.delete('/api/documents/:id',studentOnly,asyncRoute(async(req,res)=>{
  const doc=await one('SELECT * FROM documents WHERE id=? AND user_id=?',[idParam(req),req.user.id]);
  if(!doc)fail(404,'Document not found.');
  if(doc.status==='verified')fail(409,'Verified documents cannot be deleted; contact your administrator.');
  await query('DELETE FROM documents WHERE id=?',[doc.id]);
  await fs.unlink(path.join(UPLOAD_DIR,doc.stored_name)).catch(()=>{});
  res.json({message:'Document removed.'});
}));

app.get('/api/accommodation',studentOnly,asyncRoute(async(req,res)=>res.json({accommodation:await one('SELECT * FROM accommodations WHERE user_id=?',[req.user.id])})));
app.post('/api/accommodation',studentOnly,asyncRoute(async(req,res)=>{
  const room=pickStatus(req.body.room_type,['Shared room','Single room','No preference']);
  const building=requiredString(req.body.building_preference,'Preferred residence',120);
  const moveIn=cleanDate(req.body.move_in_date);
  const requests=optionalString(req.body.special_requests,'special requests',1500);
  const existing=await one('SELECT status FROM accommodations WHERE user_id=?',[req.user.id]);
  if(existing&&!['rejected','pending'].includes(existing.status))fail(409,'Approved accommodation requests cannot be changed online.');
  await query("INSERT INTO accommodations (user_id,room_type,building_preference,move_in_date,special_requests,status,review_note) VALUES (?,?,?,?,?,'pending',NULL) ON DUPLICATE KEY UPDATE room_type=VALUES(room_type),building_preference=VALUES(building_preference),move_in_date=VALUES(move_in_date),special_requests=VALUES(special_requests),status='pending',review_note=NULL",[req.user.id,room,building,moveIn,requests]);
  res.json({accommodation:await one('SELECT * FROM accommodations WHERE user_id=?',[req.user.id])});
}));
app.get('/api/announcements',asyncRoute(async(req,res)=>res.json({announcements:await query('SELECT a.id,a.title,a.body,a.category,a.created_at,u.full_name AS author FROM announcements a LEFT JOIN users u ON u.id=a.created_by ORDER BY a.created_at DESC,a.id DESC LIMIT 100')})));
app.post('/api/chat',asyncRoute(async(req,res)=>res.json({reply:answerQuestion(req.body.message)})));
app.get('/api/dashboard',studentOnly,asyncRoute(async(req,res)=>{
  const [applications,documents,accommodation,announcements]=await Promise.all([
    query('SELECT id,program,intake,status,review_note,submitted_at,updated_at FROM applications WHERE user_id=? ORDER BY updated_at DESC LIMIT 5',[req.user.id]),
    query('SELECT id,category,status,uploaded_at FROM documents WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 15',[req.user.id]),
    one('SELECT id,room_type,building_preference,status,assigned_room,review_note FROM accommodations WHERE user_id=?',[req.user.id]),
    query('SELECT id,title,body,category,created_at FROM announcements ORDER BY created_at DESC,id DESC LIMIT 4')
  ]);
  const profileComplete=Boolean(req.user.full_name&&req.user.nationality&&req.user.major&&req.user.phone);
  const categories=['passport','transcript','certificate','photo'];
  const uploadedCount=categories.filter(c=>documents.some(d=>d.category===c&&d.status!=='rejected')).length;
  const milestones=[{label:'Create account',done:true},{label:'Complete your profile',done:profileComplete},{label:'Submit demo onboarding form',done:applications.some(a=>!['draft','changes_requested','rejected'].includes(a.status))},{label:'Upload required documents',done:uploadedCount===categories.length},{label:'Apply for accommodation',done:!!accommodation&&accommodation.status!=='rejected'}];
  res.json({profile:req.user,applications,documents,accommodation,announcements,milestones,uploaded_count:uploadedCount});
}));

// All routes below are administrator-only and require a verified JWT.
app.use('/api/admin',adminOnly);
app.get('/api/admin/overview',asyncRoute(async(req,res)=>{
  const [[studentCount],[applications],[docs],[housing],[resets],recent,announcements] = await Promise.all([
    query("SELECT COUNT(*) AS count FROM users WHERE role='student'"),
    query("SELECT COUNT(*) AS total,SUM(status='pending') AS pending,SUM(status='approved') AS approved,SUM(status='in_review') AS in_review FROM applications"),
    query("SELECT COUNT(*) AS total,SUM(status='pending') AS pending,SUM(status='verified') AS verified FROM documents"),
    query("SELECT COUNT(*) AS total,SUM(status='pending') AS pending FROM accommodations"),
    query("SELECT COUNT(*) AS pending FROM password_reset_requests WHERE status='pending'"),
    query('SELECT a.id,a.program,a.status,a.submitted_at,a.created_at,u.full_name,u.email FROM applications a JOIN users u ON a.user_id=u.id ORDER BY a.updated_at DESC LIMIT 6'),
    query('SELECT id,title,category,created_at FROM announcements ORDER BY created_at DESC LIMIT 4')
  ]);
  res.json({metrics:{students:studentCount.count,applications:applications.total,applications_pending:Number(applications.pending||0),applications_approved:Number(applications.approved||0),applications_in_review:Number(applications.in_review||0),documents:docs.total,documents_pending:Number(docs.pending||0),documents_verified:Number(docs.verified||0),housing:housing.total,housing_pending:Number(housing.pending||0),resets_pending:resets.pending},recent,announcements});
}));
app.get('/api/admin/students',asyncRoute(async(req,res)=>{
  const search=String(req.query.search||'').slice(0,100).trim();
  const like='%'+search+'%';
  const students=await query(`SELECT u.id,u.full_name,u.email,u.student_number,u.nationality,u.major,u.phone,u.created_at,
  (SELECT COUNT(*) FROM applications a WHERE a.user_id=u.id) AS application_count,
  (SELECT COUNT(*) FROM documents d WHERE d.user_id=u.id) AS document_count,
  (SELECT status FROM applications a WHERE a.user_id=u.id ORDER BY a.id DESC LIMIT 1) AS latest_status
  FROM users u WHERE u.role='student' AND (u.full_name LIKE ? OR u.email LIKE ? OR COALESCE(u.student_number,'') LIKE ?) ORDER BY u.created_at DESC,u.id DESC LIMIT 200`,[like,like,like]);
  res.json({students});
}));
app.patch('/api/admin/students/:id',asyncRoute(async(req,res)=>{
  const id=idParam(req);
  const student=await one("SELECT id FROM users WHERE id=? AND role='student'",[id]);
  if(!student)fail(404,'Student not found.');
  const fields={
    full_name:requiredString(req.body.full_name,'Full name',150),
    student_number:optionalString(req.body.student_number,'student number',40),
    nationality:optionalString(req.body.nationality,'nationality',100),
    major:optionalString(req.body.major,'major',150),
    faculty:optionalString(req.body.faculty,'faculty',150),
    phone:validTelephone(req.body.phone)
  };
  await query(`UPDATE users SET ${Object.keys(fields).map(k=>k+'=?').join(',')} WHERE id=?`,[...Object.values(fields),id]);
  res.json({student:await one(`SELECT ${userFields} FROM users WHERE id=?`,[id]),message:'Student record updated.'});
}));
app.get('/api/admin/students/:id',asyncRoute(async(req,res)=>{
  const user=await one(`SELECT ${userFields} FROM users WHERE id=? AND role='student'`,[idParam(req)]);
  if(!user)fail(404,'Student not found.');
  const [applications,documents,accommodation]=await Promise.all([query('SELECT * FROM applications WHERE user_id=? ORDER BY id DESC',[user.id]),query(`${documentsQuery} WHERE d.user_id=? ORDER BY d.id DESC`,[user.id]),one('SELECT * FROM accommodations WHERE user_id=?',[user.id])]);
  res.json({student:user,applications,documents,accommodation});
}));
app.get('/api/admin/applications',asyncRoute(async(req,res)=>res.json({applications:await query(`SELECT a.*,u.full_name,u.email,u.student_number FROM applications a JOIN users u ON a.user_id=u.id ORDER BY a.updated_at DESC,a.id DESC LIMIT 500`)})));
app.patch('/api/admin/applications/:id',asyncRoute(async(req,res)=>{
  const id=idParam(req);
  const status=pickStatus(req.body.status,['pending','in_review','changes_requested','approved','rejected']);
  const note=optionalString(req.body.review_note,'review note',3000);
  const record=await one('SELECT id FROM applications WHERE id=?',[id]);if(!record)fail(404,'Application not found.');
  await query('UPDATE applications SET status=?,review_note=?,reviewed_at=NOW() WHERE id=?',[status,note,id]);
  res.json({message:'Application review saved.'});
}));
app.get('/api/admin/documents',asyncRoute(async(req,res)=>res.json({documents:await query(`${documentsQuery} JOIN users u ON u.id=d.user_id WHERE u.role='student' ORDER BY d.uploaded_at DESC,d.id DESC LIMIT 500`.replace('SELECT d.id','SELECT u.full_name,u.email,d.id'))})));
app.patch('/api/admin/documents/:id',asyncRoute(async(req,res)=>{
  const id=idParam(req);
  const status=pickStatus(req.body.status,['pending','verified','rejected']);
  const note=optionalString(req.body.review_note,'review note',3000);
  const row=await one('SELECT id FROM documents WHERE id=?',[id]);if(!row)fail(404,'Document not found.');
  await query('UPDATE documents SET status=?,review_note=?,reviewed_at=NOW() WHERE id=?',[status,note,id]);
  res.json({message:'Document review saved.'});
}));
app.get('/api/admin/accommodations',asyncRoute(async(req,res)=>res.json({accommodations:await query('SELECT h.*,u.full_name,u.email,u.student_number FROM accommodations h JOIN users u ON u.id=h.user_id ORDER BY h.updated_at DESC,h.id DESC LIMIT 500')})));
app.patch('/api/admin/accommodations/:id',asyncRoute(async(req,res)=>{
  const id=idParam(req);const status=pickStatus(req.body.status,['pending','approved','rejected']);
  const note=optionalString(req.body.review_note,'review note',1500);
  const assigned=optionalString(req.body.assigned_room,'assigned room',100);
  const record=await one('SELECT id FROM accommodations WHERE id=?',[id]);if(!record)fail(404,'Accommodation request not found.');
  await query('UPDATE accommodations SET status=?,review_note=?,assigned_room=? WHERE id=?',[status,note,assigned,id]);
  res.json({message:'Accommodation review saved.'});
}));
app.get('/api/admin/reset-requests',asyncRoute(async(req,res)=>res.json({requests:await query("SELECT r.id,r.user_id,r.reason,r.status,r.created_at,r.reviewed_at,u.full_name,u.email FROM password_reset_requests r JOIN users u ON u.id=r.user_id ORDER BY (r.status='pending') DESC,r.created_at DESC,r.id DESC LIMIT 200")})));
app.patch('/api/admin/reset-requests/:id',asyncRoute(async(req,res)=>{
  const id=idParam(req);const status=pickStatus(req.body.status,['approved','rejected']);
  if(status==='approved'&&req.body.identity_verified!==true)fail(400,'Confirm identity verification before approving a password reset.');
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    const [rows]=await conn.execute('SELECT * FROM password_reset_requests WHERE id=? FOR UPDATE',[id]);
    const record=rows[0];if(!record)fail(404,'Reset request not found.');if(record.status!=='pending')fail(409,'Request has already been reviewed.');
    if(status==='approved')await conn.execute('UPDATE users SET password_hash=? WHERE id=?',[record.proposed_password_hash,record.user_id]);
    await conn.execute('UPDATE password_reset_requests SET status=?,proposed_password_hash=?,reviewed_at=NOW() WHERE id=?',[status,'[cleared]',id]);
    await conn.commit();
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
  res.json({message:status==='approved'?'Password reset approved.':'Password reset rejected.'});
}));
app.post('/api/admin/announcements',asyncRoute(async(req,res)=>{
  const title=requiredString(req.body.title,'Title',180);
  const body=requiredString(req.body.body,'Announcement',4000);
  const category=pickStatus(req.body.category,['general','deadline','housing','documents']);
  const insert=await query('INSERT INTO announcements (title,body,category,created_by) VALUES (?,?,?,?)',[title,body,category,req.user.id]);
  res.status(201).json({announcement:await one('SELECT * FROM announcements WHERE id=?',[insert.insertId])});
}));
app.delete('/api/admin/announcements/:id',asyncRoute(async(req,res)=>{
  await query('DELETE FROM announcements WHERE id=?',[idParam(req)]);
  res.json({message:'Announcement deleted.'});
}));

app.use((req,res)=>res.status(404).json({error:'API endpoint not found.'}));
app.use((err,req,res,next)=>{
  const status=err.status||((err instanceof multer.MulterError)?400:500);
  if(status>=500)console.error(err);
  res.status(status).json({error:status===500?'Internal server error.':err.message});
});

async function start(){
  for(let attempt=1;attempt<=35;attempt++){
    try{await initializeDatabase();break;}
    catch(err){if(attempt===35){console.error('Database unavailable after retries:',err);process.exit(1);}console.log(`Waiting for MySQL (${attempt}/35): ${err.code||err.message}`);await new Promise(resolve=>setTimeout(resolve,2000));}
  }
  app.listen(PORT,'0.0.0.0',()=>console.log(`Smart Welcome API listening on http://localhost:${PORT}`));
}
start();
