// Zetrix AI Academy Tutor — Zetrix-Only Knowledge Base
// No Cambridge/IGCSE/A-Level subjects. Pure Zetrix AI Academy content.

const API_URL = 'https://round-breeze-1dcc.m-14324261.workers.dev';

const SYSTEM_PROMPT = `You are the Zetrix AI Academy Tutor.

Your purpose: help learners understand AI, Zetrix Avatar, Zetrix Claw, automation, coding, business, sales, marketing, and productivity.

Rules:
- Answer the question first, then expand if needed
- Use simple language for beginners; technical terms for advanced
- Never invent Zetrix features, pricing, or capabilities you cannot verify
- Distinguish verified facts from general industry knowledge
- Be encouraging, practical, and concise
- Offer quizzes, flashcards, or exercises when relevant
- If unsure about a Zetrix-specific detail, say so clearly`;

// questionBank is separate from zetrixKnowledgeBase for quick local quizzes
const questionBank = {
  'ai-brain': [
    { q: 'What does RAG stand for?', a: 'Retrieval-Augmented Generation', hint: 'It retrieves info before generating a response.' },
    { q: 'What is the basic hierarchy: AI → ? → ? → Neural Networks', a: 'AI → Machine Learning → Deep Learning → Neural Networks', hint: 'Think of nested subsets.' },
    { q: 'What do transformers use to determine which input parts are most relevant?', a: 'Attention / Self-attention', hint: 'It "attends" to important tokens.' },
    { q: 'What is a token in language models?', a: 'A unit of text (part of a word, a word, or punctuation)', hint: 'Not always one word.' }
  ],
  avatar: [
    { q: 'What is the main difference between a chatbot and an AI avatar?', a: 'An avatar can combine conversation + identity + voice + visual + knowledge + tools + actions', hint: 'An avatar is more than just text.' },
    { q: 'In a voice agent pipeline, what comes after speech recognition?', a: 'Text/representation sent to the AI model', hint: 'Speech → Text → AI → Response → Speech.' },
    { q: 'What is the difference between knowledge and memory in an avatar?', a: 'Knowledge = general info; Memory = info about past interactions/users', hint: 'One is static, one is personal.' },
    { q: 'Name one trade-off when building digital humans.', a: 'Realism vs speed, or quality vs computational cost, or complexity vs reliability', hint: 'More realism usually costs more.' }
  ],
  automation: [
    { q: 'Name two good automation candidates.', a: 'Repetitive tasks, rule-based decisions, data entry, scheduled reports (any two)', hint: 'Think boring, repeatable work.' },
    { q: 'What is a webhook used for in automation?', a: 'To trigger workflows when an external event happens', hint: 'It sends a signal to start something.' },
    { q: 'What does RPA stand for?', a: 'Robotic Process Automation', hint: 'Software robots doing human clicks.' },
    { q: 'Why should automation include error handling?', a: 'So failures are caught, logged, and recovered instead of silently breaking', hint: 'Things go wrong — plan for it.' }
  ],
  'sales-marketing': [
    { q: 'What does CAC stand for?', a: 'Customer Acquisition Cost', hint: 'How much to get one customer.' },
    { q: 'Name one AI copywriting framework.', a: 'AIDA, PAS, or FAB (any one)', hint: 'Attention-Interest-Desire-Action.' },
    { q: 'What is lead scoring?', a: 'Ranking leads by likelihood to convert so sales focuses on the best ones', hint: 'Not all leads are equal.' },
    { q: 'What is one benefit of email automation?', a: 'Sends the right message at the right time without manual work', hint: 'Set it and forget it.' }
  ],
  productivity: [
    { q: 'What is the main purpose of an AI meeting assistant?', a: 'Transcribe, summarize, and extract action items from meetings', hint: 'So you do not have to take notes.' },
    { q: 'How can AI help with scheduling?', a: 'Find optimal meeting times across time zones automatically', hint: 'No more email ping-pong.' },
    { q: 'What is a knowledge-management use case for AI?', a: 'Search across documents, summarize notes, or surface relevant info', hint: 'Find what you need instantly.' }
  ],
  coding: [
    { q: 'What is the main benefit of AI coding assistants?', a: 'Faster code generation, autocomplete, and bug detection', hint: 'Like a pair programmer.' },
    { q: 'Name one thing AI can help with in code review.', a: 'Style consistency, security issues, logic errors, or documentation gaps', hint: 'Catches what humans miss.' },
    { q: 'What does API stand for?', a: 'Application Programming Interface', hint: 'How two systems talk to each other.' },
    { q: 'Which HTTP method is used to create a resource?', a: 'POST', hint: 'GET reads, POST creates, PUT updates, DELETE removes.' }
  ],
  business: [
    { q: 'What is a one-person company (OPC)?', a: 'A business run entirely by one person using AI and automation instead of employees', hint: 'You + AI = company.' },
    { q: 'Name one department where AI customer service is commonly used.', a: 'Support, sales, onboarding, or operations (any one)', hint: 'Answering repetitive questions.' },
    { q: 'What is the first step in the OPC framework?', a: 'Identify a profitable niche or problem to solve', hint: 'Find the pain point first.' }
  ],
  general: [
    { q: 'What is the Perfect Prompt Formula?', a: 'Role + Goal + Context + Format + Constraints', hint: 'Five building blocks.' },
    { q: 'What does the Zetrix AI Academy offer?', a: 'Courses on AI avatars, automation, coding, sales, productivity, and business', hint: 'Practical AI education.' },
    { q: 'What is fine-tuning in AI?', a: 'Training a pre-trained model further on a specific dataset for a specialized task', hint: 'Customize a general model.' }
  ]
};

let conversationHistory = [];
let currentSubject = 'all';
let currentDiff = 'beginner';
let chatArea, userInput, sendBtn;

function initTutor() {
  chatArea = document.getElementById('chatArea');
  userInput = document.getElementById('userInput');
  sendBtn = document.getElementById('sendBtn');

  sendBtn.addEventListener('click', handleSend);
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSubject = btn.dataset.subject;
      updateSuggestions();
    });
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDiff = btn.dataset.diff;
    });
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      userInput.value = chip.textContent;
      handleSend();
    });
  });

  loadXP();
}

function updateSuggestions() {
  const suggestions = document.getElementById('suggestions');
  const map = {
    all: ['What is RAG?','Explain AI agents','What is an AI avatar?','How does fine-tuning work?','Quiz me on AI','Business automation tips'],
    'ai-brain': ['What are transformers?','Explain embeddings','How does RAG work?','What is fine-tuning?','Quiz me'],
    avatar: ['What is an AI avatar?','Voice agents vs chatbots','Digital humans explained','Avatar deployment basics','Quiz me'],
    automation: ['What is n8n?','Webhook vs API','RPA explained','Good automation candidates','Quiz me'],
    sales: ['What is CAC?','AI copywriting frameworks','Lead scoring basics','Email automation tips','Quiz me'],
    productivity: ['AI meeting assistants','Scheduling with AI','Knowledge management AI','Research automation','Quiz me'],
    coding: ['AI coding assistants','Debugging with AI','API basics','Code review with AI','Quiz me'],
    business: ['One-person company framework','AI customer service','AI sales automation','OPC first steps','Quiz me']
  };
  const items = map[currentSubject] || map.all;
  suggestions.innerHTML = items.map(s => `<span class="chip">${s}</span>`).join('');
  suggestions.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => { userInput.value = chip.textContent; handleSend(); });
  });
}

async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = '';

  addMessage(text, 'user');
  conversationHistory.push({ role: 'user', text });
  if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);

  showTyping();

  // Try AI API first if configured
  if (API_URL) {
    try {
      const messages = [{ role: 'system', content: SYSTEM_PROMPT + `\nCurrent learner level: ${currentDiff}. Current topic filter: ${currentSubject}.` }];
      const recent = conversationHistory.slice(-6);
      recent.forEach(m => {
        messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text.replace(/<[^>]+>/g, '') });
      });

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      const data = await res.json();
      hideTyping();

      if (data.reply) {
        const formatted = formatAIReply(data.reply);
        addMessage(formatted, 'bot');
        conversationHistory.push({ role: 'bot', text: formatted });
        if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
        awardXP(5);
        return;
      }
    } catch (err) {
      console.log('AI API failed, falling back to local:', err);
    }
  }

  // Fallback to local knowledge base
  const thinkTime = 500 + Math.random() * 600;
  setTimeout(() => {
    hideTyping();
    const response = getLocalResponse(text);
    addMessage(response, 'bot');
    conversationHistory.push({ role: 'bot', text: response });
    if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
    awardXP(5);
  }, thinkTime);
}

function formatAIReply(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```(.*?)```/gs, '<div class="formula-block"><code>$1</code></div>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function getLocalResponse(text) {
  const lower = text.toLowerCase();

  // Quiz request
  if (/quiz|test me|question|practice/.test(lower)) {
    return generateQuiz(text);
  }

  // Search zetrixKnowledgeBase (from zetrix-knowledge.js)
  if (typeof zetrixKnowledgeBase !== 'undefined') {
    for (const key in zetrixKnowledgeBase) {
      const entry = zetrixKnowledgeBase[key];
      if (!entry.patterns) continue;
      if (entry.patterns.some(p => lower.includes(p))) {
        return entry.response;
      }
    }
  }

  // Fallback
  return `<h4>Zetrix AI Academy</h4>
<p>I don't have a specific entry for that yet, but I can help with:</p>
<ul>
  <li>AI concepts (neural networks, LLMs, RAG, fine-tuning, embeddings)</li>
  <li>Zetrix Avatar / Zetrix Claw (general concepts)</li>
  <li>Business automation (n8n, Zapier, webhooks, RPA)</li>
  <li>Sales & marketing AI (copywriting, lead scoring, email automation)</li>
  <li>Personal productivity (meeting assistants, scheduling, research)</li>
  <li>AI for coding (assistants, debugging, APIs, code review)</li>
  <li>One-person companies and AI entrepreneurship</li>
  <li>Quizzes, flashcards, and exercises</li>
</ul>
<p>Try asking about a specific topic, or say <strong>"quiz me"</strong> for practice questions!</p>`;
}

function generateQuiz(text) {
  const lower = text.toLowerCase();
  let topic = 'general';
  if (/avatar|voice|digital human/.test(lower)) topic = 'avatar';
  else if (/automation|n8n|zapier|webhook|rpa/.test(lower)) topic = 'automation';
  else if (/brain|neural|transformer|rag|llm|fine.tun|embed/.test(lower)) topic = 'ai-brain';
  else if (/sales|marketing|copy|lead|ad|email|cac/.test(lower)) topic = 'sales-marketing';
  else if (/productiv|meeting|schedul|research|knowledge/.test(lower)) topic = 'productivity';
  else if (/code|debug|api|http|program/.test(lower)) topic = 'coding';
  else if (/business|opc|one.person|company|customer service/.test(lower)) topic = 'business';

  // If a subject filter is active, use it
  if (currentSubject !== 'all' && questionBank[currentSubject]) topic = currentSubject;

  const bank = questionBank[topic] || questionBank.general;
  const q = bank[Math.floor(Math.random() * bank.length)];
  return `<h4>Quiz — ${topic.replace('-',' ').toUpperCase()}</h4>
<p><strong>Q:</strong> ${q.q}</p>
<p><em>Hint:</em> ${q.hint}</p>
<p style="margin-top:10px;"><strong>Answer:</strong> <span style="color:transparent; background:#e2e8f0; padding:2px 8px; border-radius:4px; cursor:pointer;" onclick="this.style.color='inherit'; this.style.background='transparent';">Click to reveal</span><span style="display:none">${q.a}</span></p>`;
}

function addMessage(html, sender) {
  const div = document.createElement('div');
  div.className = `message message-${sender}`;
  div.innerHTML = html;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showTyping() {
  const div = document.createElement('div');
  div.id = 'typingIndicator';
  div.className = 'typing';
  div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

// ===== XP / Progress =====
function loadXP() {
  const xp = parseInt(localStorage.getItem('zetrix_tutor_xp') || '0', 10);
  const level = Math.floor(xp / 100) + 1;
  const pct = xp % 100;
  const xpFill = document.getElementById('xpFill');
  const userLevel = document.getElementById('userLevel');
  const xpText = document.getElementById('xpText');
  if (xpFill) xpFill.style.width = pct + '%';
  if (userLevel) userLevel.textContent = level;
  if (xpText) xpText.textContent = xp + ' XP';
}

function awardXP(amount) {
  let xp = parseInt(localStorage.getItem('zetrix_tutor_xp') || '0', 10);
  xp += amount;
  localStorage.setItem('zetrix_tutor_xp', xp);
  loadXP();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initTutor);
