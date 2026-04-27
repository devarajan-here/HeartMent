import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessions } from '../store/SessionStore';
import type { Mode } from '../types';
import { Send, User, Heart } from 'lucide-react';

const ACTIVE_SESSION_KEY = 'heartmend_active_session';
const INTAKE_DRAFT_KEY = 'heartmend_intake_draft';

type IntakeDraft = {
  userName?: string;
  partnerName?: string;
  duration?: string;
  whoEnded?: string;
  story?: string;
  feeling?: string;
  mode?: Mode;
  language?: string;
};

const getSavedValue = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const HeartMendApp = () => {
  const { addSession, addMessage, getSession, getSessionMessages } = useSessions();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return getSavedValue<string | null>(ACTIVE_SESSION_KEY, null);
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Simplified: No longer checking for currentUser as we stay stateless and collect name in intake

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionParam = params.get('session');
    const newSession = params.get('new') === '1';
    if (newSession) {
      setActiveSessionId(null);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    if (sessionParam) {
      setActiveSessionId(sessionParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!activeSessionId) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }

    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(activeSessionId));
  }, [activeSessionId]);
  
  // Form state
  const savedDraft = getSavedValue<IntakeDraft>(INTAKE_DRAFT_KEY, {});
  const [userName, setUserName] = useState(savedDraft.userName ?? '');
  const [partnerName, setPartnerName] = useState(savedDraft.partnerName ?? '');
  const [duration, setDuration] = useState(savedDraft.duration ?? '');
  const [whoEnded, setWhoEnded] = useState(savedDraft.whoEnded ?? 'We mutually agreed');
  const [story, setStory] = useState(savedDraft.story ?? '');
  const [feeling, setFeeling] = useState(savedDraft.feeling ?? '');
  const [mode, setMode] = useState<Mode>(savedDraft.mode ?? 'CALM DOWN');
  const [language, setLanguage] = useState(savedDraft.language ?? 'Malayalam (Manglish requested)');

  // Chat state
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSessionId) return;

    localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({
      userName,
      partnerName,
      duration,
      whoEnded,
      story,
      feeling,
      mode,
      language
    }));
  }, [activeSessionId, userName, partnerName, duration, whoEnded, story, feeling, mode, language]);

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionData = { partnerName, duration, whoEnded, story, feeling, need: 'Support', mode, language, userName };
    const sessionId = addSession(sessionData);
    setActiveSessionId(sessionId);
    localStorage.removeItem(INTAKE_DRAFT_KEY);
    navigate(`/app?session=${sessionId}`, { replace: true });
    setIsTyping(true);

    // Trigger the AI to generate the FIRST greeting in the correct language
    try {
      const triggerHistory = [{
        role: 'user',
        content: `My name is ${userName || 'friend'}. Just broke up with ${partnerName} after ${duration}. Feeling ${feeling}. ${whoEnded}. Just start the conversation naturally, greet me warmly in the selected language.`
      }];
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: { ...sessionData, id: sessionId }, history: triggerHistory })
      });
      const aiMsg = await response.json();
      if (aiMsg && aiMsg.id) {
        // Add the AI greeting directly without showing the trigger user message
        addMessage({ sessionId, role: 'assistant', content: aiMsg.content });
      }
    } catch {
      addMessage({ sessionId, role: 'assistant', content: `Hi ${userName || 'friend'}. I'm here for you.` });
    }
    setIsTyping(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSessionId) return;

    const userMessage = input;
    setInput('');
    setIsTyping(true);
    
    await addMessage({
      sessionId: activeSessionId,
      role: 'user',
      content: userMessage
    });

    setIsTyping(false);
  };

  const activeSession = activeSessionId ? getSession(activeSessionId) : undefined;
  const messages = activeSessionId ? getSessionMessages(activeSessionId) : [];

  useEffect(() => {
    if (activeSessionId && !activeSession) {
      setActiveSessionId(null);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [activeSession, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeSessionId) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '800px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel">
          <h2 className="text-center" style={{ marginBottom: '2rem' }}>Tell me a little about what happened.</h2>
          <form onSubmit={startSession} className="flex-col">
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>What is your name?</label>
                <input required className="input-field" value={userName} onChange={e => setUserName(e.target.value)} placeholder="e.g. John" />
              </div>
              <div>
                <label>Partner's Name</label>
                <input required className="input-field" value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="e.g. Alex" />
              </div>
              <div>
                <label>How long were you together?</label>
                <input required className="input-field" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 years" />
              </div>
            </div>

            <label className="mt-4">Who ended it?</label>
            <select className="input-field" value={whoEnded} onChange={e => setWhoEnded(e.target.value)}>
              <option>They ended it</option>
              <option>I ended it</option>
              <option>We mutually agreed</option>
              <option>It's complicated</option>
            </select>

            <label className="mt-4">What happened? (Just briefly)</label>
            <textarea required className="input-field" rows={3} value={story} onChange={e => setStory(e.target.value)} placeholder="We grew apart..."></textarea>

            <label className="mt-4">How are you feeling right now?</label>
            <input required className="input-field" value={feeling} onChange={e => setFeeling(e.target.value)} placeholder="Lost, confused, angry..." />

            <label className="mt-4">Preferred Language</label>
            <select className="input-field" value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Malayalam (Manglish requested)">Malayalam (You can type in Manglish!)</option>
              <option value="Hindi">Hindi</option>
            </select>

            <label className="mt-4">What do you think you need most right now?</label>
            <select className="input-field" value={mode} onChange={e => setMode(e.target.value as Mode)}>
              <option value="CALM DOWN">To just calm down and feel safe</option>
              <option value="JUST VENT">To vent without advice</option>
              <option value="UNDERSTAND WHAT HAPPENED">To understand why this happened</option>
              <option value="MOVE ON">To take small steps to move on</option>
            </select>

            <button type="submit" className="btn mt-8" style={{ width: '100%' }}>Start Conversation</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '2rem 1rem' }}>
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>HeartMend</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>Current Mode: {activeSession?.mode ?? mode}</span>
          </div>
          <button onClick={() => { setActiveSessionId(null); navigate('/'); }} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Exit Session</button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? 'var(--surface-color)' : 'var(--accent-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {msg.role === 'user' ? <User size={16} /> : <Heart size={16} />}
                </div>
                <div style={{
                  background: msg.role === 'user' ? 'var(--surface-color)' : 'rgba(236,72,153,0.1)',
                  padding: '1rem',
                  borderRadius: '16px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  border: msg.role === 'assistant' ? '1px solid rgba(236,72,153,0.2)' : '1px solid var(--border-color)'
                }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={16} />
                </div>
                <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(236,72,153,0.1)', color: 'var(--text-secondary)' }}>
                  HeartMend is carefully thinking...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <input 
            className="input-field" 
            style={{ margin: 0, flex: 1, borderRadius: '99px', padding: '1rem 1.5rem' }} 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Type your message here..."
            disabled={isTyping}
          />
          <button type="submit" disabled={isTyping || !input.trim()} className="btn" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, opacity: (!input.trim() || isTyping) ? 0.5 : 1 }}>
            <Send size={20} style={{ marginLeft: '-2px' }} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeartMendApp;
