document.addEventListener("DOMContentLoaded", () => {
  const chatHistory = document.getElementById('pmo-chat-history');
  const chatInput = document.getElementById('pmo-chat-input');
  const sendBtn = document.getElementById('pmo-chat-send-btn');
  const agentSelect = document.getElementById('pmo-agent-select');

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
  const appendMessage = (text, sender, agentName = null) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `pmo-message pmo-${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'pmo-message-content';
    
    // Add Agent Badge if provided
    if (agentName) {
      const badge = document.createElement('span');
      badge.className = 'pmo-agent-badge';
      badge.textContent = agentName;
      contentDiv.appendChild(badge);
    }
    
    // Add Message Text
    const textNode = document.createTextNode(text);
    contentDiv.appendChild(textNode);
    
    msgDiv.appendChild(contentDiv);
    chatHistory.appendChild(msgDiv);
    scrollToBottom();
  };

  // Handle Send Action
  const handleSend = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    // Get selected agent
    const selectedAgentValue = agentSelect.value;
    const selectedAgentText = agentSelect.options[agentSelect.selectedIndex].text;

    // 1. Append User Message (showing who it is addressed to)
    appendMessage(text, 'user', `An: ${selectedAgentText}`);
    
    // Reset Input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // 2. Simulate Async API Call
    appendMessage("Verarbeite Anfrage...", 'system', selectedAgentText);
    
    try {
      // Simuliere Netzwerklatenz
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Entferne "Verarbeite..." Nachricht
      chatHistory.removeChild(chatHistory.lastChild);
      
      // Agenten-spezifische Dummy-Antwort
      let responseText = "Befehl empfangen und verarbeitet.";
      if(selectedAgentValue === 'pm_agent') {
        responseText = "Projektstatus in pmo.projects aktualisiert. Meilensteine sind on track.";
      } else if(selectedAgentValue === 'db_agent') {
        responseText = "Datenbank-Query erfolgreich ausgeführt. Schema validiert.";
      } else if(selectedAgentValue === 'qa_agent') {
        responseText = "Code-Review abgeschlossen. Keine kritischen Fehler gefunden.";
      }
      
      appendMessage(responseText, 'system', selectedAgentText);
      
    } catch (error) {
      chatHistory.removeChild(chatHistory.lastChild);
      appendMessage("Systemfehler: API nicht erreichbar.", 'system', 'System Error');
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