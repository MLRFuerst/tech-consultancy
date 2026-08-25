document.addEventListener("DOMContentLoaded", () => {
  // Deine echte Cloud Run API URL
  const API_BASE = 'https://aiagents-engine-dpb4xu6i3a-ey.a.run.app/api/v1';
  
  const chatHistory = document.getElementById('pmo-chat-history');
  const chatInput = document.getElementById('pmo-chat-input');
  const sendBtn = document.getElementById('pmo-chat-send-btn');
  const agentList = document.querySelector('.pmo-compact-tree');
  
  let currentContext = [];

  // --- 1. ECHTE AGENTEN AUS DER DATENBANK LADEN ---
  async function fetchAgents() {
    try {
      // Erwartet eine Route in deinem Backend, die aiagents.agent_definitions ausliest
      const response = await fetch(`${API_BASE}/agents`);
      if (!response.ok) throw new Error('API Route /agents nicht erreichbar');
      const agents = await response.json();
      
      agentList.innerHTML = ''; // Dummy-Daten entfernen
      
      agents.forEach(agent => {
        const li = document.createElement('li');
        li.className = 'pmo-tree-item';
        li.innerHTML = `
          <div class="pmo-agent-header">
            <span class="pmo-status-dot ${agent.is_active ? 'green' : 'yellow'}"></span>
            <span class="pmo-agent-name">${agent.name}</span>
            <span class="pmo-tool-badges">
              ${agent.enable_postgres_tool ? '🗄️' : ''} 
              ${agent.enable_github_tool ? '🐙' : ''}
            </span>
          </div>
          <div class="pmo-agent-metrics">
            <span title="Total Runs">T: ${agent.total_runs || 0}</span> <span class="pmo-divider">|</span> 
            <span title="Errors" class="${agent.total_errors > 0 ? 'pmo-error-text' : ''}">E: ${agent.total_errors || 0}</span> <span class="pmo-divider">|</span> 
            <span title="Cost" class="pmo-mono">$${(agent.total_cost_usd || 0).toFixed(4)}</span>
          </div>
        `;
        agentList.appendChild(li);
      });
    } catch (error) {
      console.warn("Frontend-Hinweis: Konnte Agenten nicht laden. Bitte stelle sicher, dass die Route GET /api/v1/agents in deiner FastAPI existiert.", error);
    }
  }

  // --- 2. ECHTE HISTORIE AUS DER DATENBANK LADEN ---
  async function fetchHistory() {
    try {
      // Erwartet eine Route, die aiagents.prompt_history ausliest
      const response = await fetch(`${API_BASE}/history`);
      if (!response.ok) throw new Error('API Route /history nicht erreichbar');
      const history = await response.json();
      
      chatHistory.innerHTML = ''; // Dummy-Daten entfernen
      
      history.forEach(entry => {
        appendMessage(entry.user_prompt, 'user');
        if (entry.agent_response) {
          appendMessage(entry.agent_response, 'system', '🤖 Agent');
        }
      });
    } catch (error) {
      console.warn("Frontend-Hinweis: Konnte Historie nicht laden. Bitte stelle sicher, dass die Route GET /api/v1/history in deiner FastAPI existiert.", error);
    }
  }

  // --- 3. NACHRICHT AN CLOUD RUN API SENDEN ---
  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Modus auslesen (Standard vs Interactive)
    const mode = document.querySelector('input[name="exec_mode"]:checked').value;
    const endpoint = mode === 'interactive' ? '/execute-interactive' : '/execute';

    // Notizen auslesen
    const notes = document.querySelector('.pmo-notes-input').value;

    // Lade-Indikator anzeigen
    const loadingId = 'loading-' + Date.now();
    appendMessage("Verarbeite Anfrage über Cloud Run...", 'system', '⏳ System', loadingId);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context_items: currentContext,
          note_source: notes
        })
      });
      
      const data = await response.json();
      
      // Lade-Indikator entfernen
      document.getElementById(loadingId)?.remove();
      
      // Echte Antwort anhängen
      appendMessage(data.response || data.result || "Keine Antwort vom Agenten erhalten.", 'system', data.agent_name || '🤖 Agent');
      
      // Kontext nach dem Senden leeren
      currentContext = [];
      
    } catch (error) {
      document.getElementById(loadingId)?.remove();
      appendMessage(`Systemfehler: API nicht erreichbar (${error.message})`, 'system', '⚠️ Error');
    }
  }

  // --- 4. ECHTE FUNKTIONEN FÜR DIE CONTEXT BUTTONS ---
  const contextBtns = document.querySelectorAll('.pmo-icon-btn');
  
  // Button 1: Datei Upload
  contextBtns[0].addEventListener('click', () => { 
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
      const file = e.target.files[0];
      currentContext.push({ type: 'file', name: file.name });
      alert(`Datei "${file.name}" wurde als Kontext für den nächsten Prompt angehängt.`);
    };
    input.click();
  });
  
  // Button 2: Web URL
  contextBtns[1].addEventListener('click', () => { 
    const url = prompt("Bitte Web-URL eingeben, die der Agent lesen soll:");
    if (url) {
      currentContext.push({ type: 'url', value: url });
      alert(`URL angehängt: ${url}`);
    }
  });

  // Button 3: Google Drive
  contextBtns[2].addEventListener('click', () => { 
    const driveUrl = prompt("Bitte Google Drive Link eingeben:");
    if (driveUrl) {
      currentContext.push({ type: 'drive', value: driveUrl });
      alert(`Google Drive Dokument angehängt.`);
    }
  });

  // Button 4: Code Snippet
  contextBtns[3].addEventListener('click', () => { 
    const code = prompt("Bitte Code-Snippet einfügen:");
    if (code) {
      currentContext.push({ type: 'code', value: code });
      alert(`Code-Snippet angehängt.`);
    }
  });

  // --- HILFSFUNKTIONEN ---
  const scrollToBottom = () => { chatHistory.scrollTop = chatHistory.scrollHeight; };
  
  const appendMessage = (text, sender, badgeText = "", id = "") => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `pmo-message pmo-${sender}`;
    if (id) msgDiv.id = id;
    let badgeHtml = badgeText ? `<span class="pmo-agent-badge">${badgeText}</span>` : '';
    msgDiv.innerHTML = `<div class="pmo-message-content">${badgeHtml}${text}</div>`;
    chatHistory.appendChild(msgDiv);
    scrollToBottom();
  };

  // Event Listeners für Input
  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // INITIALISIERUNG: Echte Daten beim Laden der Seite abrufen
  fetchAgents();
  fetchHistory();
});