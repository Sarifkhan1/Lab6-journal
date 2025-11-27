// ===================================
// MAIN.JS - DOM Manipulation & Event Handlers
// ===================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Learning Journal PWA...');
    await initializeApp();
});

/**
 * Main initialization function
 */
async function initializeApp() {
    try {
        // 1. Apply saved theme
        applySavedTheme();

        // 2. Setup theme toggle
        setupThemeToggle();

        // 3. Get and display location
        await initializeLocation();

        // 4. Load and render journal entries
        await renderJournalEntries();

        // 5. Setup form submission
        setupFormSubmission();

        // 6. Initialize music player
        if (typeof MusicPlayer !== 'undefined') {
            MusicPlayer.init();
        }

        // 7. Initialize YouTube and Facebook services
        if (typeof YouTubeService !== 'undefined') {
            YouTubeService.init();
        }
        if (typeof FacebookService !== 'undefined') {
            FacebookService.init();
        }

        // 8. Show welcome modal for first-time visitors
        if (typeof WelcomeModal !== 'undefined') {
            WelcomeModal.show();
        }

        // 9. Setup modal close handlers
        setupModalHandlers();

        // 10. Setup location click handler for map
        setupLocationClickHandler();

        // 11. Setup clear all entries button
        setupClearAllButton();

        // 12. Setup export button
        setupExportButton();

        // 13. Setup filter controls
        setupFilterControls();

        console.log('App initialized successfully!');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

/**
 * Apply saved theme preference
 */
function applySavedTheme() {
    const savedTheme = StorageManager.getTheme();
    const body = document.body;

    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
    }

    // Update theme toggle button icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = savedTheme === 'light' ? '☀️' : '🌙';
    }

    console.log('Theme applied:', savedTheme);
}

/**
 * Setup theme toggle button
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
        const body = document.body;
        const isLightMode = body.classList.contains('light-mode');
        const newTheme = isLightMode ? 'dark' : 'light';

        // Toggle classes
        if (newTheme === 'light') {
            body.classList.add('light-mode');
            body.classList.remove('dark-mode');
            themeToggle.textContent = '☀️';
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            themeToggle.textContent = '🌙';
        }

        // Save preference
        StorageManager.saveTheme(newTheme);
        console.log('Theme toggled to:', newTheme);
    });
}

/**
 * Initialize location service and display in navbar
 */
async function initializeLocation() {
    try {
        const location = await LocationService.getFullLocation();
        LocationService.displayInNav(location);
        console.log('Location initialized:', location);
    } catch (error) {
        console.error('Error initializing location:', error);
        LocationService.displayInNav({
            city: 'Location unavailable',
            country: 'Please enable location permissions'
        });
    }
}

/**
 * Render all journal entries from JSON file (with localStorage fallback)
 */
async function renderJournalEntries() {
    const entriesGrid = document.getElementById('journal-entries-grid');
    const emptyState = document.getElementById('entries-empty-state');

    if (!entriesGrid) {
        console.warn('Journal entries grid not found');
        return;
    }

    // Fetch entries from JSON file first
    let entries = await StorageManager.fetchEntriesFromJSON();

    // If JSON fetch failed or empty, fallback to localStorage
    if (entries.length === 0) {
        entries = StorageManager.getAllEntries();
        console.log('Using localStorage entries as fallback');
    } else {
        // Sync JSON entries with localStorage
        entries = StorageManager.syncWithJSON(entries);
    }

    // Update entry counter
    updateEntryCounter(entries.length);

    // Show empty state if no entries (but keep static entries visible)
    if (entries.length === 0) {
        if (emptyState) emptyState.style.display = 'none';
        return;
    }

    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';

    // Clear existing dynamic entries (only remove previously added dynamic ones)
    const dynamicEntries = entriesGrid.querySelectorAll('.journal-card[data-dynamic]');
    dynamicEntries.forEach(card => card.remove());

    // Render each entry
    entries.forEach(entry => {
        const entryCard = createEntryCard(entry);
        // Insert dynamic entries at the beginning, before static entries
        entriesGrid.insertBefore(entryCard, entriesGrid.firstChild);
    });

    console.log(`Rendered ${entries.length} journal entries from JSON file`);
}

/**
 * Create a journal entry card element
 * @param {Object} entry - Entry object
 * @returns {HTMLElement} - Card element
 */
function createEntryCard(entry) {
    const card = document.createElement('article');
    card.className = 'journal-card';
    card.setAttribute('data-dynamic', 'true');
    card.setAttribute('data-entry-id', entry.id);

    // Format date
    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Format time
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Location string
    const locationStr = entry.location
        ? `${entry.location.city}, ${entry.location.country}`
        : 'Location not available';

    card.innerHTML = `
        <div class="entry-header-actions">
            <button class="edit-entry-btn" data-entry-id="${entry.id}" aria-label="Edit entry">✏️ Edit</button>
            <button class="delete-entry-btn" data-entry-id="${entry.id}" aria-label="Delete entry">🗑️ Delete</button>
        </div>
        <div class="journal-header">
            <span class="week-badge">${entry.title || 'Journal Entry'}</span>
            <span class="journal-date">${formattedDate} at ${formattedTime}</span>
        </div>
        <h2 class="journal-title">${entry.title || 'Untitled Entry'}</h2>
        <p class="journal-excerpt">${escapeHtml(entry.content)}</p>
        <div class="journal-tags">
            <span class="tag">📍 ${locationStr}</span>
            <span class="tag">📅 ${formattedDate}</span>
        </div>
        <div class="entry-actions">
            <button class="share-btn facebook-share" data-entry-id="${entry.id}" aria-label="Share to Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Share to Facebook
            </button>
        </div>
    `;

    // Add delete button event listener
    const deleteBtn = card.querySelector('.delete-entry-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEntry(entry.id);
        });
    }

    // Add edit button event listener
    const editBtn = card.querySelector('.edit-entry-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editEntry(entry);
        });
    }

    // Add Facebook share button event listener
    const shareBtn = card.querySelector('.facebook-share');
    if (shareBtn && typeof FacebookService !== 'undefined') {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            FacebookService.shareNative(entry).catch(() => {
                FacebookService.shareEntry(entry);
            });
        });
    }

    return card;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Delete a journal entry
 * @param {string} entryId - ID of entry to delete
 */
async function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }

    // Delete from localStorage
    const localSuccess = StorageManager.deleteEntry(entryId);
    
    // Delete from JSON file via API
    const jsonSuccess = await StorageManager.deleteEntryFromJSON(entryId);

    if (localSuccess || jsonSuccess) {
        await renderJournalEntries();
        FormValidator.showModal('success', 'Entry deleted successfully!');
    } else {
        FormValidator.showModal('error', 'Failed to delete entry. Please try again.');
    }
}

/**
 * Setup form submission handler
 */
function setupFormSubmission() {
    const form = document.getElementById('journal-entry-form');
    if (!form) {
        console.warn('Journal entry form not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form
        const validation = FormValidator.validate(form);

        if (!validation.valid) {
            // Show error messages
            validation.errors.forEach(error => {
                const errorElement = document.getElementById(`${error.field}-error`);
                if (errorElement) {
                    errorElement.textContent = error.message;
                }
            });

            FormValidator.showModal('error', 'Please fix the errors in the form.');
            return;
        }

        // Clear error messages
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        // Check if we're editing an existing entry
        const editingId = form.getAttribute('data-editing-id');
        const isUpdating = form.querySelector('button[type="submit"]')?.getAttribute('data-updating') === 'true';

        // Get form values
        const title = form.querySelector('#journal-title').value.trim();
        const content = form.querySelector('#journal-content').value.trim();

        if (isUpdating && editingId) {
            // Update existing entry
            const updates = {
                title: title,
                content: content
            };

            // Update in localStorage
            const entries = StorageManager.getAllEntries();
            const entryIndex = entries.findIndex(e => e.id === editingId);
            if (entryIndex !== -1) {
                entries[entryIndex] = { ...entries[entryIndex], ...updates };
                localStorage.setItem(StorageManager.KEYS.ENTRIES, JSON.stringify(entries));
            }

            // Update in JSON file via API
            const jsonSuccess = await StorageManager.updateEntryInJSON(editingId, updates);

            if (jsonSuccess) {
                FormValidator.showModal('success', 'Entry updated successfully!');
                
                // Reset form
                FormValidator.clearForm(form);
                form.removeAttribute('data-editing-id');
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Save Entry';
                    submitBtn.removeAttribute('data-updating');
                }

                // Re-render entries
                await renderJournalEntries();
            } else {
                FormValidator.showModal('error', 'Failed to update entry. Please try again.');
            }
        } else {
            // Create new entry
            // Get current location
            const location = await LocationService.getFullLocation();

            // Create entry object
            const entry = {
                title: title,
                content: content,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),
                location: {
                    city: location.city || 'Unknown',
                    state: location.state || '',
                    country: location.country || 'Unknown',
                    lat: location.lat || null,
                    lon: location.lon || null
                }
            };

            // Save entry to localStorage
            const localSuccess = StorageManager.saveEntry(entry);

            // Save entry to JSON file via API (if enabled)
            const jsonSuccess = await StorageManager.saveEntryToJSON(entry);

            if (localSuccess || jsonSuccess) {
                // Show success modal
                const message = jsonSuccess
                    ? 'Journal entry saved successfully to both localStorage and JSON file!'
                    : 'Journal entry saved to localStorage (JSON API unavailable)';
                FormValidator.showModal('success', message);

                // Clear form
                FormValidator.clearForm(form);

                // Re-render entries
                await renderJournalEntries();

                // Scroll to new entry (optional)
                setTimeout(() => {
                    const newEntry = document.querySelector(`[data-entry-id="${entry.id}"]`);
                    if (newEntry) {
                        newEntry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);
            } else {
                FormValidator.showModal('error', 'Failed to save entry. Please try again.');
            }
        }
    });
}

/**
 * Setup modal close handlers
 */
function setupModalHandlers() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

/**
 * Setup location click handler to open map
 */
function setupLocationClickHandler() {
    const locationElement = document.getElementById('nav-location');
    if (!locationElement) return;

    locationElement.addEventListener('click', () => {
        const lat = locationElement.getAttribute('data-lat');
        const lon = locationElement.getAttribute('data-lon');

        if (lat && lon) {
            MapService.showMap(parseFloat(lat), parseFloat(lon));
        } else {
            FormValidator.showModal('error', 'Location data not available. Please allow location access.');
        }
    });
}

/**
 * Setup clear all entries button
 */
function setupClearAllButton() {
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (!clearAllBtn) return;

    clearAllBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete ALL journal entries? This action cannot be undone.')) {
            return;
        }

        // Clear from localStorage
        const localSuccess = StorageManager.clearAllEntries();
        
        // Clear from JSON file via API
        const jsonSuccess = await StorageManager.clearAllEntriesFromJSON();

        if (localSuccess || jsonSuccess) {
            await renderJournalEntries();
            FormValidator.showModal('success', 'All entries cleared successfully!');
        } else {
            FormValidator.showModal('error', 'Failed to clear entries. Please try again.');
        }
    });
}

/**
 * Update entry counter display
 * @param {number} count - Number of entries
 */
function updateEntryCounter(count) {
    const counterElement = document.getElementById('entries-counter');
    if (counterElement) {
        counterElement.textContent = `${count} ${count === 1 ? 'Entry' : 'Entries'}`;
    }
}

/**
 * Setup export button
 */
function setupExportButton() {
    const exportBtn = document.getElementById('export-json-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', async () => {
        // Get all entries
        let entries = await StorageManager.fetchEntriesFromJSON();
        if (entries.length === 0) {
            entries = StorageManager.getAllEntries();
        }

        if (entries.length === 0) {
            FormValidator.showModal('error', 'No entries to export!');
            return;
        }

        // Export as JSON file
        const success = StorageManager.exportJSON(entries);
        if (success) {
            FormValidator.showModal('success', `Exported ${entries.length} entries successfully!`);
        } else {
            FormValidator.showModal('error', 'Failed to export entries. Please try again.');
        }
    });
}

/**
 * Setup filter controls
 */
function setupFilterControls() {
    const filterForm = document.getElementById('filter-form');
    if (!filterForm) return;

    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await applyFilters();
    });

    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', async () => {
            filterForm.reset();
            await renderJournalEntries();
        });
    }
}

/**
 * Apply filters to journal entries (using server-side search)
 */
async function applyFilters() {
    const entriesGrid = document.getElementById('journal-entries-grid');
    if (!entriesGrid) return;

    // Get filter values
    const keyword = document.getElementById('filter-keyword')?.value.trim();
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo = document.getElementById('filter-date-to')?.value;

    // Use server-side search if API is enabled
    let filteredEntries = [];
    if (StorageManager.USE_API && (keyword || dateFrom || dateTo)) {
        filteredEntries = await StorageManager.searchEntriesInJSON(keyword, dateFrom, dateTo);
    } else {
        // Fetch all entries and filter client-side
        let entries = await StorageManager.fetchEntriesFromJSON();
        if (entries.length === 0) {
            entries = StorageManager.getAllEntries();
        }
        filteredEntries = StorageManager.clientSideSearch(entries, keyword || '', dateFrom || '', dateTo || '');
    }

    // Clear and render filtered entries
    const dynamicEntries = entriesGrid.querySelectorAll('.journal-card[data-dynamic]');
    dynamicEntries.forEach(card => card.remove());

    if (filteredEntries.length === 0) {
        FormValidator.showModal('info', 'No entries match your filters.');
        updateEntryCounter(0);
        return;
    }

    filteredEntries.forEach(entry => {
        const entryCard = createEntryCard(entry);
        entriesGrid.insertBefore(entryCard, entriesGrid.firstChild);
    });

    updateEntryCounter(filteredEntries.length);
    console.log(`Filtered entries: ${filteredEntries.length}`);
}

/**
 * Edit a journal entry
 * @param {Object} entry - Entry object to edit
 */
function editEntry(entry) {
    // Populate form with entry data
    const form = document.getElementById('journal-entry-form');
    if (!form) return;

    const titleInput = form.querySelector('#journal-title');
    const contentInput = form.querySelector('#journal-content');

    if (titleInput) titleInput.value = entry.title || '';
    if (contentInput) contentInput.value = entry.content || '';

    // Store entry ID for update
    form.setAttribute('data-editing-id', entry.id);

    // Change submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Update Entry';
        submitBtn.setAttribute('data-updating', 'true');
    }

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Focus on title input
    if (titleInput) titleInput.focus();
}

// Keep existing functionality from original main.js for other pages
// Mobile navigation toggle
const mobileToggle = document.querySelector('.mobile-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function () {
        navMenu.classList.toggle('active');

        const hamburger = this.querySelector('.hamburger');
        if (navMenu.classList.contains('active')) {
            hamburger.style.background = 'transparent';
            hamburger.style.transform = 'rotate(45deg)';
        } else {
            hamburger.style.background = 'var(--text-primary)';
            hamburger.style.transform = 'rotate(0)';
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navMenu.classList.remove('active');
            const hamburger = mobileToggle.querySelector('.hamburger');
            hamburger.style.background = 'var(--text-primary)';
            hamburger.style.transform = 'rotate(0)';
        });
    });
}

// Scroll to top button
const scrollTopBtn = document.querySelector('.scroll-top');

if (scrollTopBtn) {
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    scrollTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            const delay = entry.target.getAttribute('data-aos-delay');
            if (delay) {
                entry.target.style.animationDelay = delay + 'ms';
            }
        }
    });
}, observerOptions);

const animatedElements = document.querySelectorAll('[data-aos]');
animatedElements.forEach(el => observer.observe(el));

console.log('Learning Journal PWA - All systems ready! 🚀');
