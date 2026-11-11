import { offlineAnswer } from './chatKnowledge.js';

/** A pure, deterministic state transition for the rule-based chatbot. */
export function nextChatMessages(history, question) {
  const prompt = String(question ?? '').trim().slice(0, 1000);
  if (!prompt) return history;
  let response;
  try {
    response = offlineAnswer(prompt);
  } catch (error) {
    response = 'Please try another question or consult the Help Center.';
  }
  return [
    ...history,
    { from: 'me', text: prompt },
    { from: 'bot', text: String(response || 'Please try another question.') }
  ];
}
