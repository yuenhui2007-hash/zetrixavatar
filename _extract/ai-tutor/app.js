// AI Tutor Application

// State
let isExpanded = false;
let isSidebarOpen = window.innerWidth > 768;
let currentChat = [];
let isTyping = false;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');
const expandOverlay = document.getElementById('expandOverlay');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const expandIcon = document.getElementById('expandIcon');

// Initialize
function init() {
    messageInput.focus();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('collapsed');
        }
    });
}

// Toggle Sidebar (Mobile)
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}

// Toggle Expanded Mode
function toggleExpand() {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
        // Expand
        mainContent.classList.add('expanded');
        expandOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update icon to "compress"
        expandIcon.innerHTML = `
            <path d="M4 10V14M4 10H8M14 8V4M14 8H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        `;
        
        // Add active state to button
        document.querySelector('[title="Expand Chat"]').classList.add('active');
    } else {
        // Collapse
        mainContent.classList.remove('expanded');
        expandOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Update icon to "expand"
        expandIcon.innerHTML = `
            <path d="M4 14V10M4 14H8M14 4V8M14 4H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        `;
        
        // Remove active state
        document.querySelector('[title="Expand Chat"]').classList.remove('active');
    }
}

// Auto-resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// Handle keydown
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Send quick message from chips
function sendQuickMessage(text) {
    messageInput.value = text;
    autoResize(messageInput);
    sendMessage();
}

// Send Message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || isTyping) return;
    
    // Add user message
    addMessage(text, 'user');
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate AI response
    await simulateAIResponse(text);
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? 'Y' : 'AI';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (sender === 'ai') {
        // Parse markdown for AI messages
        content.innerHTML = marked.parse(text);
        // Highlight code blocks
        content.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
    } else {
        content.textContent = text;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Store in current chat
    currentChat.push({ sender, text });
}

// Show typing indicator
function showTypingIndicator() {
    isTyping = true;
    sendBtn.disabled = true;
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(indicator);
    
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    isTyping = false;
    sendBtn.disabled = false;
    
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Scroll to bottom
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Simulate AI Response
async function simulateAIResponse(userMessage) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    hideTypingIndicator();
    
    const response = generateResponse(userMessage);
    addMessage(response, 'ai');
}

// Simple response generator (replace with actual AI API)
function generateResponse(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('derivative') || lower.includes('calculus')) {
        return `## Derivatives Explained

A **derivative** measures how a function changes as its input changes. Think of it as the instantaneous rate of change.

### Key Concept
If you have a function $f(x)$, its derivative $f'(x)$ tells you:
- The slope of the tangent line at any point
- How fast the function is increasing or decreasing

### Basic Rules
1. **Power Rule**: If $f(x) = x^n$, then $f'(x) = nx^{n-1}$
2. **Constant Rule**: If $f(x) = c$, then $f'(x) = 0$
3. **Sum Rule**: $(f + g)' = f' + g'$

### Example
\`\`\`javascript
// Find derivative of f(x) = x² + 3x
function f(x) {
    return x**2 + 3*x;
}

// f'(x) = 2x + 3
function derivative(x) {
    return 2*x + 3;
}
\`\`\`

Would you like me to explain more about differentiation techniques?`;
    }
    
    if (lower.includes('solve') && lower.includes('equation')) {
        return `## Solving $x² + 5x + 6 = 0$

I'll solve this step-by-step using factoring:

### Step 1: Identify the form
This is a quadratic equation in the form $ax² + bx + c = 0$ where:
- $a = 1$
- $b = 5$ 
- $c = 6$

### Step 2: Find factors
We need two numbers that:
- Multiply to give $ac = 6$
- Add to give $b = 5$

Those numbers are **2** and **3** (since $2 × 3 = 6$ and $2 + 3 = 5$)

### Step 3: Factor
$$x² + 5x + 6 = (x + 2)(x + 3) = 0$$

### Step 4: Solve
- $x + 2 = 0$ → **$x = -2$**
- $x + 3 = 0$ → **$x = -3$**

### Verification
\`\`\`python
def verify(x):
    return x**2 + 5*x + 6

print(verify(-2))  # Output: 0 ✓
print(verify(-3))  # Output: 0 ✓
\`\`\`

The solutions are **$x = -2$** and **$x = -3$**.`;
    }
    
    if (lower.includes('machine learning') || lower.includes('ml')) {
        return `## Machine Learning Key Concepts

### 1. **Supervised Learning**
Learning from labeled data where the algorithm maps inputs to known outputs.
- **Classification**: Predicting categories (spam/not spam)
- **Regression**: Predicting continuous values (house prices)

### 2. **Unsupervised Learning**
Finding patterns in unlabeled data.
- **Clustering**: Grouping similar data points
- **Dimensionality Reduction**: Reducing features while preserving information

### 3. **Neural Networks**
Inspired by biological neurons, these are the foundation of deep learning.

\`\`\`python
# Simple neural network layer
import numpy as np

def neural_layer(inputs, weights, bias):
    return np.dot(inputs, weights) + bias

# Activation function
def relu(x):
    return np.maximum(0, x)
\`\`\`

### 4. **Training Process**
1. Forward pass: Make predictions
2. Calculate loss: Measure error
3. Backpropagation: Calculate gradients
4. Update weights: Adjust to reduce error

Would you like to dive deeper into any of these topics?`;
    }
    
    if (lower.includes('quiz') || lower.includes('history')) {
        return `## 🌍 World History Quiz

Here's a quick quiz to test your knowledge:

### Question 1
**In what year did World War II end?**
- A) 1943
- B) 1944
- C) 1945 ✓
- D) 1946

### Question 2
**Who was the first Emperor of Rome?**
- A) Julius Caesar
- B) Augustus ✓
- C) Nero
- D) Trajan

### Question 3
**The Renaissance began in which Italian city?**
- A) Rome
- B) Venice
- C) Florence ✓
- D) Milan

### Question 4
**What year did the Berlin Wall fall?**
- A) 1987
- B) 1988
- C) 1989 ✓
- D) 1990

---

**Score: 4/4** 🎉

Want me to quiz you on a different topic or go deeper into any historical period?`;
    }
    
    return `## Great Question!

I've received your message: **"${message}"**

This is a demo response. In a full implementation, this would connect to an AI API (like OpenAI's GPT, Claude, or similar) to provide intelligent, context-aware responses.

### Features included in this tutor:
- ✅ Expandable chatbox (click the expand icon in the header)
- ✅ Markdown rendering with code highlighting
- ✅ Math expression support
- ✅ Chat history sidebar
- ✅ Quick suggestion chips
- ✅ Typing indicators
- ✅ Mobile responsive design

Would you like me to explain how any of these features work, or do you have another question?`;
}

// Start new chat
function startNewChat() {
    currentChat = [];
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
                    <rect width="28" height="28" rx="8" fill="#4F46E5"/>
                    <path d="M8 14C8 10.686 10.686 8 14 8C17.314 8 20 10.686 20 14C20 17.314 17.314 20 14 20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="14" cy="14" r="2.5" fill="white"/>
                </svg>
            </div>
            <h2>New Chat Started</h2>
            <p>How can I help you learn today?</p>
            <div class="suggestion-chips">
                <button class="chip" onclick="sendQuickMessage('Explain derivatives in simple terms')">📐 Explain derivatives</button>
                <button class="chip" onclick="sendQuickMessage('Help me solve x² + 5x + 6 = 0')">🧮 Solve an equation</button>
                <button class="chip" onclick="sendQuickMessage('What are the key concepts in machine learning?')">🤖 Machine learning basics</button>
                <button class="chip" onclick="sendQuickMessage('Quiz me on world history')">📚 History quiz</button>
            </div>
        </div>
    `;
    
    // Update chat title
    document.querySelector('.chat-title h1').textContent = 'New Chat';
    
    // Add to history
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C4.686 2 2 4.686 2 8C2 9.092 2.296 10.12 2.816 11L2.5 13.5L5 13.184C5.88 13.704 6.908 14 8 14C11.314 14 14 11.314 14 8C14 4.686 11.314 2 8 2Z" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <span>New Chat</span>
    `;
    
    document.querySelector('.history-section').appendChild(historyItem);
    
    messageInput.focus();
}

// Initialize on load
init();
