import React, { Component, useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { CHAT_FAQS, suggestedQuestions } from './chatKnowledge';
import { nextChatMessages } from './chatSession';

// A failure inside the assistant must never unmount the university dashboard.
// React error boundaries catch rendering/lifecycle failures in their children.
class ChatErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    // A diagnostic for the browser console without exposing sensitive user data.
    console.error('Welcome Assistant error:', error);
  }
  render() {
    if (this.state.failed) {
      return (
        <section className="chat-widget" role="alert" aria-label="Welcome assistant recovery">
          <div className="chat-head"><strong>Welcome Assistant</strong></div>
          <div className="chat-recovery">
            <p>The assistant encountered an error. Your dashboard is still available.</p>
            <button type="button" onClick={() => this.setState({ failed: false })}>Restart assistant</button>
            <button type="button" onClick={this.props.close}>Close</button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

const GREETING = 'Hello! I am your Smart Welcome assistant. Select a question below or type to see suggested questions.';

function ChatPanel({ close }) {
  const [text, setText] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [messages, setMessages] = useState([{ from: 'bot', text: GREETING }]);
  const messagePaneRef = useRef(null);
  const matches = suggestedQuestions(text);

  // Scroll only the message pane, not the document or a fixed-position element.
  // scrollIntoView on a fixed chat widget could move the entire viewport and
  // hide the page in some browsers; this local scroll does not do that.
  useEffect(() => {
    const pane = messagePaneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [messages]);

  function ask(question) {
    const prompt = String(question ?? '').trim().slice(0, 1000);
    if (!prompt) return;
    // Append the question and matching answer in one state transition.
    setMessages(previous => nextChatMessages(previous, prompt));
    setText('');
    setActiveSuggestion(-1);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setActiveSuggestion(-1);
      return;
    }
    if (!matches.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion(previous => (previous + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion(previous => previous <= 0 ? matches.length - 1 : previous - 1);
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      const selected = matches[activeSuggestion];
      if (selected) ask(selected.question);
    }
  }

  return (
    <section className="chat-widget" role="dialog" aria-label="Welcome assistant">
      <div className="chat-head">
        <div className="chat-logo"><Sparkles size={21}/></div>
        <div><strong>Welcome Assistant</strong><small><span className="online-dot"/> Onboarding questions answered instantly</small></div>
        <button type="button" className="icon-btn" onClick={close} aria-label="Close assistant"><X size={19}/></button>
      </div>
      <div className="chat-messages" ref={messagePaneRef} aria-live="polite" aria-relevant="additions">
        {messages.map((message, index) => <div key={index} className={'chat-bubble ' + (message.from === 'me' ? 'chat-me' : 'chat-bot')}>{message.text}</div>)}
      </div>
      {!text.trim() && <div className="chat-suggestions" aria-label="Popular questions">
        {CHAT_FAQS.slice(0, 3).map(faq => <button type="button" key={faq.question} onClick={() => ask(faq.question)}>{faq.question}</button>)}
      </div>}
      {text.trim() && matches.length > 0 && <div className="chat-autocomplete" aria-label="Suggested questions">
        <span className="chat-autocomplete-title">Suggested questions - click to ask</span>
        {matches.map((faq, index) => <button
          type="button" key={faq.question} className={index === activeSuggestion ? 'selected' : ''}
          onClick={() => ask(faq.question)}
        ><MessageCircle size={14}/><span>{faq.question}</span><ArrowRight size={14}/></button>)}
      </div>}
      <form className="chat-input" onSubmit={event => { event.preventDefault(); ask(text); }}>
        <input aria-label="Ask the welcome assistant" placeholder="Type a question..." value={text}
          onChange={event => { setText(event.target.value); setActiveSuggestion(-1); }}
          onKeyDown={handleKeyDown} maxLength={1000} />
        <button type="submit" disabled={!text.trim()} aria-label="Send message"><Send size={17}/></button>
      </form>
      <div className="chat-disclaimer">Academic demo only - confirm official requirements with DMU</div>
    </section>
  );
}

export default function WelcomeChat() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="floating-chat" aria-label={open ? 'Hide welcome assistant' : 'Open welcome assistant'}
      aria-expanded={open} onClick={() => setOpen(previous => !previous)}>
      {open ? <X size={24}/> : <MessageCircle size={24}/>}
      <span>{open ? 'Close chat' : 'Ask Welcome'}</span>
    </button>
    {open && <ChatErrorBoundary close={() => setOpen(false)}><ChatPanel close={() => setOpen(false)}/></ChatErrorBoundary>}
  </>;
}
