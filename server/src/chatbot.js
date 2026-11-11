// Rule-based guidance for an academic demonstration, not an official DMU service.
// Match specific intents before broad keywords (e.g. accommodation application).
const responses = {
  apply: 'To submit an application in this demo: open Applications, select New application, fill in a programme and example intake, then submit the form. Track its status from Applications or Dashboard. This does not submit an official DMU admissions application.',
  documents: 'The Required documents list is a prototype checklist: passport, academic transcript, qualification certificate and identification photo. Go to Documents to upload fictional or redacted PDF, JPG, PNG or WEBP files (8 MB maximum). These are NOT confirmed DMU enrolment requirements.',
  upload: 'Open Documents, select a category, choose a sample PDF or JPG/PNG/WEBP (8 MB maximum), and upload it. A demo administrator can then review the file. Never upload real identity documents to this academic prototype.',
  accommodation: 'Open Accommodation to request a sample room preference, residence preference, and optional move-in date. Submit the demo request for administrator review. This does not book accommodation at De Montfort University; use official university housing services for real bookings.',
  tracking: 'Open Applications or Dashboard to track your application status. Pending means it awaits review; In Review means a demo administrator is reviewing it; Approved or Rejected is the recorded decision.',
  rejected: 'Open Documents to read the administrator’s note on a rejected sample file. Correct the problem and upload a replacement document under the relevant category.',
  profile: 'Open My Profile to edit your details, nationality, programme, student number, and contact information. Save to update the local demonstration database.',
  password: 'Use Forgot password on the login page and enter your demo account email and proposed new password. A demo administrator must approve the reset before the new password will work.',
  progress: 'Your Dashboard shows the onboarding checklist, including profile completion, application submission, document categories and accommodation requests. Progress is for this prototype only.',
  dates: 'The prototype’s intake and date examples are illustrative, not official De Montfort University deadlines. Contact DMU or check its official website for real dates.',
  location: 'De Montfort University is in Leicester, United Kingdom. This Smart Welcome Platform is an academic prototype, not an official DMU student service.',
  contact: 'You can use the Help Center and Welcome Assistant for demonstration guidance. For actual DMU admissions, enrolment or housing enquiries, use official university channels.',
  greeting: 'Hello! I can help with applications, required documents, accommodation, tracking, profile updates, deadlines, and password help. Try one of the suggested questions.'
};

export function answerQuestion(message) {
  const text = String(message || '').trim().slice(0, 1000);
  if (!text) return 'Please type your question.';
  if (/accommodat|housing|dorm|residence|\broom\b/i.test(text)) return responses.accommodation;
  if (/reject|reupload|verification fail/i.test(text) && /document|file|upload/i.test(text)) return responses.rejected;
  if (/password|forgot|reset|log\s*in|sign\s*in/i.test(text)) return responses.password;
  if (/deadline|intake|term date|start date/i.test(text)) return responses.dates;
  if (/status|track|\bprogress\b|pending|review|approved/i.test(text)) return responses.tracking;
  if (/upload|attach|add a file/i.test(text)) return responses.upload;
  if (/document|passport|transcript|certificate|photo|\bfiles?\b/i.test(text)) return responses.documents;
  if (/\bapply\b|application|admission|submit|register|registration/i.test(text)) return responses.apply;
  if (/checklist|onboarding|milestone/i.test(text)) return responses.progress;
  if (/profile|nationality|major|personal|student number/i.test(text)) return responses.profile;
  if (/contact|staff|support|human|help desk/i.test(text)) return responses.contact;
  if (/leicester|\bdmu\b|where.*university|university.*where/i.test(text)) return responses.location;
  if (/\bhello\b|\bhi\b|\bhey\b|\bhelp\b/i.test(text)) return responses.greeting;
  return 'I can help with demo applications, required documents, accommodation, tracking, profile updates and sign-in. Try a suggested question. For real DMU decisions or deadlines, contact official university services.';
}
