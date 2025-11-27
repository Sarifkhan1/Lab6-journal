// Inject reusable navigation menu
const navHTML = `
    <nav class="container nav-container">
        <div class="logo" data-aos="fade-right">
            <span class="logo-icon">📚</span>
            <span class="logo-text">My Journal</span>
        </div>
        <ul class="nav-menu">
            <li><a href="/" class="nav-link">Home</a></li>
            <li><a href="/journal" class="nav-link">Journal</a></li>
            <li><a href="/projects" class="nav-link">Projects</a></li>
            <li><a href="/about" class="nav-link">About</a></li>
        </ul>
        <button class="mobile-toggle" aria-label="Toggle navigation">
            <span class="hamburger"></span>
        </button>
        <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">🌓</button>
    </nav>
`;

function injectNav() {
    const header = document.querySelector('header.navbar');
    if (header) {
        header.innerHTML = navHTML;
        
        // Set active link based on current route
        const path = window.location.pathname;
        const navLinks = header.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            // Check if current path matches the link
            if (path === '/' && href === '/') {
                link.classList.add('active');
            } else if (path === href || (href !== '/' && path.startsWith(href))) {
                link.classList.add('active');
            }
        });
    }
}
injectNav();

// Modern digital clock (date + ticking time)
function startClockBox() {
    const el = document.getElementById('current-date');
    if (!el) return;
    el.innerHTML = '<span class="clock-date"></span><span class="clock-time"></span>';
    const dateNode = el.querySelector('.clock-date');
    const timeNode = el.querySelector('.clock-time');
    el.classList.add('clock-box');
    function update() {
        const now = new Date();
        const dateString = now.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: '2-digit'});
        const timeString = now.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', second: '2-digit'});
        dateNode.textContent = dateString;
        timeNode.textContent = timeString;
    }
    update();
    setInterval(update, 1000);
}

startClockBox();

// Theme Switcher with Local Storage + Icon Change + Light Mode
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }
    // Update button icon
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = theme === 'light' ? '☀️' : '🌙';
    }
}

function getSavedTheme() {
    return localStorage.getItem('theme');
}

function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    saveTheme(newTheme);
}

document.addEventListener("DOMContentLoaded", () => {
    // Set theme from storage or default dark
    const savedTheme = getSavedTheme() || 'dark';
    applyTheme(savedTheme);
    // Attach theme toggle
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
});

// --- JOURNAL EXPAND/COLLAPSE, SIMPLE DELEGATED LOGIC ---
(function() {
  if (!window.location.pathname.includes('journal')) return;
  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('.journal-grid');
    if (!grid) return;
    // Set all excerpts visible and all buttons "Collapse" on load
    grid.querySelectorAll('.journal-excerpt').forEach(function (excerpt) {
      excerpt.style.display = 'block';
    });
    grid.querySelectorAll('.journal-toggle-btn').forEach(function (btn) {
      btn.textContent = 'Collapse';
      btn.setAttribute('aria-expanded', 'true');
    });
    // Event delegation
    grid.addEventListener('click', function (e) {
      if (e.target.classList.contains('journal-toggle-btn')) {
        var btn = e.target;
        var excerpt = btn.nextElementSibling;
        // In case there's a newline or comment node, skip to next element sibling until .journal-excerpt
        while (excerpt && !excerpt.classList.contains('journal-excerpt')) {
          excerpt = excerpt.nextElementSibling;
        }
        if (!excerpt) return;
        var open = excerpt.style.display !== 'none';
        if (open) {
          excerpt.style.display = 'none';
          btn.textContent = 'Expand';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          excerpt.style.display = 'block';
          btn.textContent = 'Collapse';
          btn.setAttribute('aria-expanded', 'true');
        }
      }
    });
  });
})();

// ---- Journal Entry Form Logic ----
(function(){
  const grid = document.querySelector('.journal-grid');
  const form = document.getElementById('journal-entry-form');
  if (!form || !grid) return;
  const descError = document.getElementById('desc-error');
  // Storage helpers
  function getEntries() {
    try { return JSON.parse(localStorage.getItem('journal_entries')) || []; } catch { return []; }
  }
  function saveEntries(entries) {
    localStorage.setItem('journal_entries', JSON.stringify(entries));
  }
  function makeEntryCard(entry) {
    // creates HTML for card
    const article = document.createElement('article');
    article.className = 'journal-card';
    article.innerHTML = `
      <div class="journal-header">
        <span class="week-badge">${entry.week}</span>
        <span class="journal-date">${entry.date}</span>
      </div>
      <h2 class="journal-title">${entry.name}</h2>
      <button class="journal-toggle-btn btn btn-small" type="button">Collapse</button>
      <p class="journal-excerpt">${entry.description}</p>
      <div class="journal-tags">
        ${entry.technologies.map(tag=>`<span class="tag">${tag}</span>`).join(' ')}
      </div>
    `;
    return article;
  }
  function prependCard(entry) {
    const card = makeEntryCard(entry);
    grid.insertBefore(card, grid.firstChild);
  }
  // Load on page init
  getEntries().forEach(prependCard);
  // Validation and form submit
  form.addEventListener('submit', function(e){
    e.preventDefault();
    descError.textContent = '';
    const week = form.week.value.trim();
    const name = form.name.value.trim();
    const date = form.date.value;
    const taskname = form.taskname.value.trim();
    let description = form.description.value.replace(/\s+/g,' ').trim();
    if (description.split(' ').length < 10) {
      descError.textContent = 'Please enter at least 10 words.';
      form.description.focus();
      return;
    }
    const techs = Array.from(form.querySelectorAll('input[name="technologies"]:checked')).map(cb=>cb.value);
    const entry = {
      week,
      name: name + (taskname ? (': ' + taskname) : ''),
      date,
      description,
      technologies: techs
    };
    // Save to storage
    const entries = getEntries();
    entries.unshift(entry); // prepend new
    saveEntries(entries);
    // Show card
    prependCard(entry);
    // Reset
    form.reset();
    descError.textContent = '';
  });
})();

function setupCollapsibleSections() {
    // Projects Page - default visible with "See Less" toggle
    document.querySelectorAll('.toggle-project-desc').forEach(btn => {
        const desc = getNextElementSiblingWithClass(btn, 'project-compact-description');
        if (!desc) return;
        desc.style.display = 'block';
        btn.textContent = 'See Less';
        btn.setAttribute('aria-expanded', 'true');
        btn.addEventListener('click', function() {
            const open = desc.style.display !== 'none' && desc.style.display !== '';
            if (open) {
                desc.style.display = 'none';
                btn.textContent = 'Expand';
                btn.setAttribute('aria-expanded', 'false');
            } else {
                desc.style.display = 'block';
                btn.textContent = 'See Less';
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
}
document.addEventListener('DOMContentLoaded', setupCollapsibleSections);

// Delegated logic for Journal page (matches projects behavior)
(function(){
  if (!window.location.pathname.includes('journal')) return;
  document.addEventListener('DOMContentLoaded', function(){
    var grid = document.querySelector('.journal-grid');
    if (!grid) return;
    // Initialize
    grid.querySelectorAll('.journal-excerpt').forEach(function(excerpt){
      excerpt.style.display = 'block';
    });
    grid.querySelectorAll('.journal-toggle-btn').forEach(function(btn){
      btn.textContent = 'See Less';
      btn.setAttribute('aria-expanded', 'true');
    });
    // Delegate clicks
    grid.addEventListener('click', function(e){
      if (!e.target.classList.contains('journal-toggle-btn')) return;
      var btn = e.target;
      var excerpt = btn.nextElementSibling;
      while (excerpt && !excerpt.classList.contains('journal-excerpt')) {
        excerpt = excerpt.nextElementSibling;
      }
      if (!excerpt) return;
      var open = excerpt.style.display !== 'none';
      if (open) {
        excerpt.style.display = 'none';
        btn.textContent = 'Expand';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        excerpt.style.display = 'block';
        btn.textContent = 'See Less';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

// Projects page delegation using new class to avoid conflicting previous listeners
(function(){
  if (!window.location.pathname.includes('projects')) return;
  document.addEventListener('DOMContentLoaded', function(){
    var grid = document.querySelector('.projects-compact-grid');
    if (!grid) return;
    grid.querySelectorAll('.project-compact-description').forEach(function(desc){
      desc.style.display = 'block';
    });
    grid.querySelectorAll('.project-toggle-btn').forEach(function(btn){
      btn.textContent = 'See Less';
      btn.setAttribute('aria-expanded', 'true');
    });
    grid.addEventListener('click', function(e){
      if (!e.target.classList.contains('project-toggle-btn')) return;
      var btn = e.target;
      var desc = btn.nextElementSibling;
      while (desc && !desc.classList.contains('project-compact-description')) {
        desc = desc.nextElementSibling;
      }
      if (!desc) return;
      var open = desc.style.display !== 'none';
      if (open) {
        desc.style.display = 'none';
        btn.textContent = 'Expand';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        desc.style.display = 'block';
        btn.textContent = 'See Less';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
