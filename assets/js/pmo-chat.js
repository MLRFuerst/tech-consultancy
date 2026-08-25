document.addEventListener("DOMContentLoaded", () => {
  const chatHistory = document.getElementById('pmo-chat-history');
  const chatInput = document.getElementById('pmo-chat-input');
  const sendBtn = document.getElementById('pmo-chat-send-btn');

  if(!chatHistory || !chatInput || !sendBtn) return;

  // Auto-Resize Textarea
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

  // Scroll to bottom function
  const scrollToBottom = () => {
    chatHistory.scrollTop = chatHistory.scrollHeight;
  };

  // Add Message to DOM
  const appendMessage = (text, sender) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `pmo-message pmo-${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'pmo-message-content';
    contentDiv.textContent = text;
    
    msgDiv.appendChild(contentDiv);
    chatHistory.appendChild(msgDiv);
    scrollToBottom();
  };

  // Handle Send Action
  const handleSend = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    // 1. Append User Message
    appendMessage(text, 'user');
    
    // Reset Input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // 2. Simulate Async API Call to PMO Backend
    appendMessage("Verarbeite Anfrage...", 'system');
    
    try {
      // Simuliere Netzwerklatenz
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Entferne "Verarbeite..." Nachricht (letztes Element)
      chatHistory.removeChild(chatHistory.lastChild);
      
      // Füge Agenten-Antwort hinzu
      appendMessage("Befehl empfangen. Die Datenbank wurde abgefragt und die Task-Abhängigkeiten (DAG) wurden aktualisiert.", 'system');
      
    } catch (error) {
      chatHistory.removeChild(chatHistory.lastChild);
      appendMessage("Systemfehler: API nicht erreichbar.", 'system');
    }
  };

  // Event Listeners
  sendBtn.addEventListener('click', handleSend);
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Initial Scroll
  scrollToBottom();
});