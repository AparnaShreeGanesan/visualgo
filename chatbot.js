
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class AIChatbot {
    constructor() {
        this.widget = document.getElementById('aiWidget');
        this.toggleBtn = document.getElementById('aiToggle');
        this.messagesContainer = document.getElementById('aiMessages');
        this.input = document.getElementById('aiInput');
        this.sendBtn = document.getElementById('aiSend');
        this.keyInput = document.getElementById('groqKey');

        this.apiKey = localStorage.getItem('visualalgo_groq_key') || '';
        if (this.apiKey) {
            this.keyInput.value = this.apiKey;
            this.keyInput.style.display = 'none'; // Hide if already set
        }

        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.keyInput.addEventListener('change', (e) => {
            this.apiKey = e.target.value;
            localStorage.setItem('visualalgo_groq_key', this.apiKey);
        });
    }

    toggle() {
        this.widget.classList.toggle('closed');
    }

    addMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${role}`;
        msgDiv.innerHTML = text; // Allow HTML for formatting
        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        if (!this.apiKey) {
            this.addMessage('system', 'Please enter your Groq API Key first.');
            return;
        }

        this.addMessage('user', text);
        this.input.value = '';
        this.input.disabled = true;
        this.sendBtn.disabled = true;

        // Context from the app
        const code = document.getElementById('recursionEditor')?.value || '';
        const context = `
      User Code:
      \`\`\`javascript
      ${code}
      \`\`\`
    `;

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert algorithms tutor for VisualAlgo. Help the user understand their code, debug recursion, and analyze complexity. Be concise and friendly.'
                        },
                        {
                            role: 'user',
                            content: `Context: ${context}\n\nUser Question: ${text}`
                        }
                    ],
                    model: 'llama3-70b-8192',
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const botReply = data.choices[0].message.content;
            this.addMessage('assistant', this.formatReply(botReply));

        } catch (error) {
            this.addMessage('system', `Error: ${error.message}. Check your API Key.`);
        } finally {
            this.input.disabled = false;
            this.sendBtn.disabled = false;
            this.input.focus();
        }
    }

    formatReply(text) {
        // specific formatting to make markdown-like text look okay in HTML
        return text.replace(/\n/g, '<br>').replace(/`([^`]+)`/g, '<code>$1</code>');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AIChatbot();
});
