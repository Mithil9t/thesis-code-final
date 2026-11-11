import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'welcome_user',
  password: process.env.DB_PASSWORD || 'welcome_dev_password',
  database: process.env.DB_NAME || 'smart_welcome',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  timezone: 'Z',
  multipleStatements: true
};
export const pool = mysql.createPool(config);
export const query = async (sql, args=[]) => (await pool.execute(sql,args))[0];
export const one = async (sql, args=[]) => (await query(sql,args))[0] || null;

export async function initializeDatabase() {
  const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
  const schema = await fs.readFile(schemaPath,'utf8');
  await pool.query(schema);
  if (process.env.SEED_DEMO !== 'false') { await seedDemo(); await migratePreviousDemoBranding(); }
}

async function migratePreviousDemoBranding() {
  // Exact-value updates exclusively for the first version's seeded demonstration data.
  // A previously created Docker MySQL volume retains its original demo users.
  // Migrate the Aisha seed in-place so connected applications and housing records remain intact.
  const previousDemoStudent=await one('SELECT id FROM users WHERE email=? AND role=?', ['aisha@welcome.test','student']);
  if(previousDemoStudent){
    const conflict=await one('SELECT id FROM users WHERE email=?', ['mithil@welcome.test']);
    if(conflict){
      console.warn('Demo migration skipped: mithil@welcome.test already exists. Resolve the duplicate demo account manually.');
    }else{
      await query('UPDATE users SET full_name=?,email=?,nationality=?,major=?,student_number=? WHERE id=? AND role=?',
        ['Mithil Mahbub','mithil@welcome.test','Bangladesh','Computer Science','DMU-DEMO-001',previousDemoStudent.id,'student']);
      console.log('Existing demo student updated: Aisha -> Mithil (related records retained).');
    }
  }
  for (const [oldId,newId] of [['NTU2026001','DMU-DEMO-001'],['NTU2026002','DMU-DEMO-002'],['NTU2026003','DMU-DEMO-003'],['NTU2026004','DMU-DEMO-004']]) {
    await query('UPDATE users SET student_number=? WHERE student_number=? AND email LIKE ?', [newId,oldId,'%@welcome.test']);
  }
  await query('UPDATE applications SET intake=?, statement=? WHERE intake=? AND statement=?', ['2026/27 (demo)','I look forward to exploring this De Montfort University onboarding demonstration.','Fall 2026','I look forward to joining Nantong University.']);
  await query('UPDATE accommodations SET building_preference=? WHERE building_preference=?', ['DMU accommodation preference (demo)','International Student Residence']);
  await query('UPDATE announcements SET title=?,body=? WHERE title=?', ['Welcome to your DMU-inspired Smart Welcome demo','This is an academic demonstration inspired by De Montfort University in Leicester. Try updating a profile, submitting an example application and uploading fictional documents. It is not connected to official university services.','Welcome to Nantong University']);
  await query('UPDATE announcements SET body=? WHERE title=? AND body=?', ['The prototype offers example categories: passport, academic transcript, certificate and photo. These are not confirmed DMU enrolment requirements; never upload real documents into a public demo.','Document checklist','Prepare a passport, academic transcript, graduation certificate and recent identification photo for verification.']);
}

async function seedDemo() {
  const existing = await one('SELECT id FROM users WHERE email=?', ['admin@welcome.test']);
  if (existing) return;
  const adminHash = await bcrypt.hash('Admin123!', 12);
  await query('INSERT INTO users (role,full_name,email,password_hash) VALUES (?,?,?,?)', ['admin','Demo Administrator','admin@welcome.test',adminHash]);
  const examples = [
    ['Mithil Mahbub','mithil@welcome.test','Bangladesh','Computer Science','DMU-DEMO-001'],
    ['Daniel Kim','daniel@welcome.test','South Korea','Business Management','DMU-DEMO-002'],
    ['Sofia Martins','sofia@welcome.test','Portugal','Software Engineering','DMU-DEMO-003'],
    ['Amara Okafor','amara@welcome.test','Nigeria','Media and Communication','DMU-DEMO-004']
  ];
  const hash = await bcrypt.hash('Student123!',12);
  for (let i=0;i<examples.length;i++) {
    const [name,email,nationality,major,studentNumber] = examples[i];
    const out = await query('INSERT INTO users (role,full_name,email,password_hash,nationality,major,student_number) VALUES (?,?,?,?,?,?,?)', ['student',name,email,hash,nationality,major,studentNumber]);
    const status = ['approved','in_review','pending','changes_requested'][i];
    await query('INSERT INTO applications (user_id,program,intake,previous_school,qualification,statement,status,submitted_at) VALUES (?,?,?,?,?,?,?,NOW())', [out.insertId,major,'2026/27 (demo)','International Secondary School','High School Diploma','I look forward to exploring this De Montfort University onboarding demonstration.',status]);
    if (i<3) await query('INSERT INTO accommodations (user_id,room_type,building_preference,status) VALUES (?,?,?,?)', [out.insertId,i===1?'Single room':'Shared room','DMU accommodation preference (demo)',i===0?'approved':'pending']);
  }
  const admin = await one('SELECT id FROM users WHERE email=?', ['admin@welcome.test']);
  const news = [
    ['Welcome to your DMU-inspired Smart Welcome demo','This is an academic demonstration inspired by De Montfort University in Leicester. Try updating a profile, submitting an example application and uploading fictional documents. It is not connected to official university services.','general'],
    ['Document checklist','The prototype offers example categories: passport, academic transcript, certificate and photo. These are not confirmed DMU enrolment requirements; never upload real documents into a public demo.','documents'],
    ['Accommodation demo workflow','Use the Accommodation page to test submitting a room preference and receiving an administrator decision. This does not book real university housing.','housing']
  ];
  for (const item of news) await query('INSERT INTO announcements (title,body,category,created_by) VALUES (?,?,?,?)', [...item,admin.id]);
  console.log('Demo accounts and example application records created.');
}
