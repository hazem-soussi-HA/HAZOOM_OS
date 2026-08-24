let apiKey = null; // will be fetched/created on load
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

// Store full conversation locally for infinite context
const messages = [];

async function getApiKey() {
  // Try to get from localStorage first
  const stored = localStorage.getItem('chatdev-api-key');
  if (stored) return stored;
  // Request a new one from the server
  const resp = await fetch('/api/generate-key', { method: 'POST' });
  const data = await resp.json();
  localStorage.setItem('chatdev-api-key', data.apiKey);
  return data.apiKey;
}

function addMessage(content, role) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = content;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage(userText) {
  addMessage(userText, 'user');
  messages.push({ role: 'user', content: userText });
  // Show typing placeholder
  const placeholder = document.createElement('div');
  placeholder.className = 'message ai';
  placeholder.textContent = '...';
  chatBox.appendChild(placeholder);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ messages }),
    });
    const data = await resp.json();
    placeholder.remove();
    if (data.error) {
      addMessage(`Error: ${data.error}`, 'ai');
    } else {
      addMessage(data.reply, 'ai');
      messages.push({ role: 'assistant', content: data.reply });
    }
  } catch (e) {
    placeholder.remove();
    addMessage(`Network error: ${e.message}`, 'ai');
  }
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = '';
  await sendMessage(text);
});

// Initialise
(async () => {
  apiKey = await getApiKey();
  addMessage('Welcome to ChatDev! Your API key is ready.', 'ai');
})();
