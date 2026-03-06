const stateKey = 'visualalgo_state_v1';

function todayISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
}

function daysBetweenISO(a, b) {
  const dateA = new Date(a);
  const dateB = new Date(b);
  const diff = dateB.getTime() - dateA.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function defaultState() {
  return {
    xp: 120,
    level: 2,
    streak: 1,
    badges: ['First Run', 'Visualizer Explorer'],
    lastActiveDate: todayISO(),
    completed: {
      linear: false, binary: false, bubble: false, quick: false,
      insertion: false, heap: false, recursion: false, backtracking: false,
      linkedlist: false, stack: false, queue: false, tree: false
    }
  };
}

function loadState() {
  const raw = localStorage.getItem(stateKey);
  if (!raw) {
    const state = defaultState();
    localStorage.setItem(stateKey, JSON.stringify(state));
    return state;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    const state = defaultState();
    localStorage.setItem(stateKey, JSON.stringify(state));
    return state;
  }
}

function saveState(state) {
  localStorage.setItem(stateKey, JSON.stringify(state));
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 12px; z-index: 1000;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'glass';
  toast.style.cssText = `
    padding: 16px 24px;
    border-radius: 12px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #fff;
    font-weight: 500;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  if (type === 'xp') {
    toast.style.background = 'rgba(139, 92, 246, 0.2)';
    toast.style.borderColor = 'rgba(139, 92, 246, 0.4)';
    toast.innerHTML = `⚡ ${message}`;
  } else {
    toast.textContent = message;
  }

  container.appendChild(toast);
  
  // Animation
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function addXP(amount, reason) {
  const state = loadState();
  state.xp += amount;
  const oldLevel = state.level;
  state.level = Math.floor(state.xp / 100) + 1;
  
  showToast(`+${amount} XP: ${reason}`, 'xp');
  
  if (state.level > oldLevel) {
    setTimeout(() => showToast(`🎉 Level Up! You are now Level ${state.level}!`), 500);
  }
  
  if (reason) {
    state.lastReason = reason;
  }
  saveState(state);
  renderGamification();
}

function updateStreak() {
  const state = loadState();
  const today = todayISO();
  if (state.lastActiveDate === today) {
    return;
  }
  const gap = daysBetweenISO(state.lastActiveDate, today);
  if (gap === 1) {
    state.streak += 1;
    showToast(`🔥 Streak increased to ${state.streak} days!`);
  } else {
    state.streak = 1;
  }
  state.lastActiveDate = today;
  saveState(state);
}

function completeTopic(topicKey) {
  const state = loadState();
  if (!state.completed[topicKey]) {
    state.completed[topicKey] = true;
    addXP(20, `Completed ${topicKey}`);
    if (Object.values(state.completed).every(Boolean) && !state.badges.includes('Full Map')) {
      state.badges.push('Full Map');
      addXP(50, 'Completed all topics');
    }
    saveState(state);
  }
}

function renderGamification() {
  const state = loadState();
  const streakEl = document.querySelector('#streakCount');
  const xpEl = document.querySelector('#xpCount');
  const levelEl = document.querySelector('#levelCount');
  if (streakEl) streakEl.textContent = `${state.streak}`;
  if (xpEl) xpEl.textContent = `${state.xp}`;
  if (levelEl) levelEl.textContent = `${state.level}`;

  // Update progress bars
  document.querySelectorAll('[data-progress]').forEach((bar) => {
    const key = bar.getAttribute('data-progress');
    if (key && state.completed[key]) {
      bar.style.width = '100%';
    }
  });
}

function setActiveNav() {
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach((link) => {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
    }
  });
}

function initTabs() {
  document.querySelectorAll('.code-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.classList.contains('code-tab')) {
        // Toggle active state
        header.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        // Mock content switch (since we don't have real separate content blocks in this demo)
        const container = header.parentElement;
        const content = container.querySelector('.code-content');
        if (e.target.textContent === 'Java') {
             // Simple regex replace for demo purposes to look like Java
             if (content.textContent.includes('def ')) {
                 content.textContent = content.textContent
                    .replace(/def /g, 'public int ')
                    .replace(/:/g, ' {')
                    .replace(/print/g, 'System.out.println')
                    .replace(/len\((.*)\)/g, '$1.length')
                    .replace(/True/g, 'true')
                    .replace(/False/g, 'false');
             }
        } else {
             // Reset or switch back would require storing original text, skipping for this simple UI demo
        }
      }
    });
  });
}

updateStreak();
window.addXP = addXP;
window.completeTopic = completeTopic;
window.loadState = loadState;
window.renderGamification = renderGamification;
window.showToast = showToast;

window.addEventListener('DOMContentLoaded', () => {
  renderGamification();
  setActiveNav();
  initTabs();
});
