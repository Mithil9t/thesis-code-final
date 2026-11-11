// Built-in answers keep the student assistant responsive for frequently asked
// questions even when the demo backend is temporarily unavailable.
// These describe the academic prototype, not official DMU procedures.
export const CHAT_FAQS = [
  {
    question: 'How to apply?',
    keywords: ['apply', 'application', 'submit', 'registration', 'admission', 'enrolment'],
    answer: 'To submit an application in this demo: 1) Open Applications from the student menu. 2) Select New application. 3) Enter your programme, example intake and other details. 4) Choose Submit application. You can monitor its status on Applications or Dashboard. This is not an official DMU admissions application.'
  },
  {
    question: 'Required documents',
    keywords: ['documents', 'document', 'required', 'passport', 'transcript', 'certificate', 'photo', 'upload', 'files'],
    answer: 'The demo document checklist contains four example categories: passport, academic transcript, qualification certificate and identification photo. Open Documents, choose a category and upload a sample PDF, JPG, PNG or WEBP file (up to 8 MB). These are NOT confirmed DMU requirements. Use fictional or redacted files only.'
  },
  {
    question: 'Accommodation',
    keywords: ['accommodation', 'housing', 'room', 'residence', 'live', 'dorm', 'move in'],
    answer: 'To make a sample accommodation request: open Accommodation, choose a room type, select a demo residence preference and optionally provide a move-in date or special requests. Submit it to appear in the admin review queue. This does not reserve or book accommodation at DMU; use the official university channels for real housing.'
  },
  {
    question: 'How do I track my application?',
    keywords: ['track', 'tracking', 'status', 'progress', 'review', 'pending', 'approved'],
    answer: 'Open Applications to see your submitted forms and their statuses, or check Dashboard for a summary. Pending means awaiting review, In Review means a demo administrator is checking it, and Approved or Rejected shows the decision. Any reviewer notes appear with the record.'
  },
  {
    question: 'How do I upload a document?',
    keywords: ['upload a document', 'upload passport', 'upload file', 'upload files', 'uploading'],
    answer: 'Go to Documents, select the appropriate document category, choose a sample PDF or image (JPG, PNG or WEBP, maximum 8 MB), then upload. The uploaded item appears in your document list for administrator review. Do not upload genuine identity documents to this academic demo.'
  },
  {
    question: 'What if my document is rejected?',
    keywords: ['document rejected', 'rejected document', 'file rejected', 'verification failed'],
    answer: 'Open Documents and review the administrator note on the rejected file. Correct the issue, then upload a replacement sample under the relevant category. Rejected files do not count as completed onboarding documents.'
  },
  {
    question: 'How do I update my profile?',
    keywords: ['profile', 'personal', 'name', 'nationality', 'major', 'phone', 'student number'],
    answer: 'Select My Profile from the student menu, update your personal and study information, and save your changes. Your demo profile and onboarding progress will then reflect the information stored in the local database.'
  },
  {
    question: 'I forgot my password. What should I do?',
    keywords: ['password', 'forgot', 'reset', 'login', 'sign in', 'account recovery'],
    answer: 'On the login page select Forgot password?, enter your demo account email and a proposed new password, and submit the request. A demo administrator needs to review and approve it before the new password can be used.'
  },
  {
    question: 'How do I check my onboarding progress?',
    keywords: ['onboarding', 'checklist', 'milestone', 'complete steps', 'dashboard'],
    answer: 'Open Dashboard to see your onboarding checklist. It tracks account creation, profile completion, application submission, example document uploads and an accommodation request. This progress applies only to the prototype.'
  },
  {
    question: 'What are the application deadlines?',
    keywords: ['deadline', 'deadlines', 'dates', 'intake', 'term', 'start date'],
    answer: 'Intake labels and dates in the platform are illustrative demonstration data, not official DMU deadlines. Please use De Montfort University’s official website or admissions team for current dates.'
  },
  {
    question: 'Where is De Montfort University?',
    keywords: ['where', 'location', 'leicester', 'dmu', 'university'],
    answer: 'De Montfort University (DMU) is located in Leicester, United Kingdom. This Smart Welcome website is a student research prototype and is not connected to live DMU systems.'
  },
  {
    question: 'How can I contact university staff?',
    keywords: ['contact', 'support', 'staff', 'help desk', 'email', 'human'],
    answer: 'For this prototype, administrators can review application, document and accommodation records inside the Admin Portal. For a real admissions, enrolment or accommodation enquiry, please contact DMU through its official website and support channels.'
  }
];

const normalise = text => String(text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const stopWords = new Set(['how','can','do','i','the','a','an','is','are','what','where','my','to','for','and','in','of','please','tell','me','about','does','it','your','you']);

export function suggestedQuestions(input, max = 5) {
  const search = normalise(input);
  if (!search) return [];
  const words = search.split(' ').filter(word => word.length >= 2 && !stopWords.has(word));
  return CHAT_FAQS.map((faq, index) => {
    const question = normalise(faq.question);
    const terms = faq.keywords.map(normalise);
    let score = 0;
    if (question.startsWith(search)) score += 25;
    else if (question.includes(search)) score += 17;
    if (terms.some(term => term.startsWith(search))) score += 15;
    else if (terms.some(term => term.includes(search))) score += 9;
    for (const word of words) {
      if (question.split(' ').some(part => part.startsWith(word))) score += 3;
      if (terms.some(term => term.split(' ').some(part => part.startsWith(word)))) score += 4;
    }
    return {faq, score, index};
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, max).map(item => item.faq);
}

export function preparedAnswer(question) {
  const match = normalise(question);
  return CHAT_FAQS.find(faq => normalise(faq.question) === match)?.answer || null;
}

export function offlineAnswer(question) {
  const input = normalise(question);
  const exact = preparedAnswer(question);
  if (exact) return exact;
  // Prioritise compound questions: “apply for accommodation” is about housing,
  // while “application status” is about tracking rather than a new application.
  if (/accommodat|housing|residence|dorm|\broom\b/.test(input)) return CHAT_FAQS[2].answer;
  if (/reject|verification fail/.test(input) && /document|file/.test(input)) return CHAT_FAQS[5].answer;
  if (/password|forgot|reset|login|sign in/.test(input)) return CHAT_FAQS[7].answer;
  if (/deadline|term date|intake/.test(input)) return CHAT_FAQS[9].answer;
  if (/track|status|pending|review/.test(input)) return CHAT_FAQS[3].answer;
  if (/upload|attach/.test(input)) return CHAT_FAQS[4].answer;
  const found = suggestedQuestions(input, 1)[0];
  if (found) return found.answer;
  return 'I can help with demo applications, required documents, accommodation, account access and onboarding progress. Please try one of the suggested questions. For official DMU guidance, consult the university directly.';
}
