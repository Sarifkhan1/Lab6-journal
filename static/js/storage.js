// ===================================
// STORAGE API - LocalStorage Functions
// ===================================

const StorageManager = {
    // Storage keys
    KEYS: {
        ENTRIES: 'journalEntries',
        THEME: 'themePreference',
        VOLUME: 'musicVolume',
        FIRST_VISIT: 'hasVisitedBefore'
    },

    /**
     * Save a journal entry to LocalStorage
     * @param {Object} entry - Entry object with title, content, date, timestamp, location
     * @returns {boolean} - Success status
     */
    saveEntry(entry) {
        try {
            const entries = this.getAllEntries();

            // Create entry object with all required fields
            const newEntry = {
                id: Date.now().toString(), // Unique ID based on timestamp
                title: entry.title || '',
                content: entry.content || '',
                date: entry.date || new Date().toISOString().split('T')[0],
                timestamp: entry.timestamp || Date.now(),
                location: entry.location || { city: 'Unknown', country: 'Unknown' },
                ...entry // Allow additional fields
            };

            entries.unshift(newEntry); // Add to beginning of array
            localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(entries));

            console.log('Entry saved successfully:', newEntry);
            return true;
        } catch (error) {
            console.error('Error saving entry:', error);
            return false;
        }
    },

    /**
     * Get all journal entries from LocalStorage
     * @returns {Array} - Array of entry objects
     */
    getAllEntries() {
        try {
            const entries = localStorage.getItem(this.KEYS.ENTRIES);
            return entries ? JSON.parse(entries) : [];
        } catch (error) {
            console.error('Error retrieving entries:', error);
            return [];
        }
    },

    /**
     * Delete a specific entry by ID
     * @param {string} entryId - ID of entry to delete
     * @returns {boolean} - Success status
     */
    deleteEntry(entryId) {
        try {
            const entries = this.getAllEntries();
            const filteredEntries = entries.filter(entry => entry.id !== entryId);
            localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(filteredEntries));

            console.log('Entry deleted:', entryId);
            return true;
        } catch (error) {
            console.error('Error deleting entry:', error);
            return false;
        }
    },

    /**
     * Clear all journal entries
     * @returns {boolean} - Success status
     */
    clearAllEntries() {
        try {
            localStorage.removeItem(this.KEYS.ENTRIES);
            console.log('All entries cleared');
            return true;
        } catch (error) {
            console.error('Error clearing entries:', error);
            return false;
        }
    },

    /**
     * Save theme preference (light/dark)
     * @param {string} theme - 'light' or 'dark'
     * @returns {boolean} - Success status
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.KEYS.THEME, theme);
            console.log('Theme saved:', theme);
            return true;
        } catch (error) {
            console.error('Error saving theme:', error);
            return false;
        }
    },

    /**
     * Get saved theme preference
     * @returns {string} - 'light' or 'dark' (default: 'dark')
     */
    getTheme() {
        try {
            return localStorage.getItem(this.KEYS.THEME) || 'dark';
        } catch (error) {
            console.error('Error retrieving theme:', error);
            return 'dark';
        }
    },

    /**
     * Save music volume preference
     * @param {number} volume - Volume level (0-1)
     * @returns {boolean} - Success status
     */
    saveVolume(volume) {
        try {
            localStorage.setItem(this.KEYS.VOLUME, volume.toString());
            console.log('Volume saved:', volume);
            return true;
        } catch (error) {
            console.error('Error saving volume:', error);
            return false;
        }
    },

    /**
     * Get saved volume preference
     * @returns {number} - Volume level (0-1, default: 0.7)
     */
    getVolume() {
        try {
            const volume = localStorage.getItem(this.KEYS.VOLUME);
            return volume ? parseFloat(volume) : 0.7;
        } catch (error) {
            console.error('Error retrieving volume:', error);
            return 0.7;
        }
    },

    /**
     * Check if user has visited before
     * @returns {boolean} - True if visited before, false if first visit
     */
    hasVisitedBefore() {
        try {
            return localStorage.getItem(this.KEYS.FIRST_VISIT) === 'true';
        } catch (error) {
            console.error('Error checking visit status:', error);
            return false;
        }
    },

    /**
     * Mark that user has visited
     */
    markAsVisited() {
        try {
            localStorage.setItem(this.KEYS.FIRST_VISIT, 'true');
            console.log('User marked as visited');
        } catch (error) {
            console.error('Error marking visit:', error);
        }
    },

    // ===================================
    // JSON FILE STORAGE METHODS
    // ===================================

    /**
     * API Configuration
     * For PythonAnywhere, use relative paths (empty string)
     * For local development, use 'http://localhost:5000'
     */
    API_BASE: '', // Empty for same-origin requests (PythonAnywhere)
    USE_API: true, // Set to true when API server is running

    /**
     * Fetch entries from JSON file or API
     * @returns {Promise<Array>} - Array of entries
     */
    async fetchEntriesFromJSON() {
        try {
            if (this.USE_API) {
                // Fetch from Flask API server
                const response = await fetch(`${this.API_BASE}/reflections`);
                if (!response.ok) throw new Error('API request failed');
                const entries = await response.json();
                console.log('Entries fetched from Flask API:', entries.length);
                return entries;
            } else {
                // Fetch from static JSON file (fallback)
                const response = await fetch('/static/backend/reflections.json');
                if (!response.ok) throw new Error('Failed to fetch JSON file');
                const entries = await response.json();
                console.log('Entries fetched from JSON file:', entries.length);
                return entries;
            }
        } catch (error) {
            console.error('Error fetching entries from JSON:', error);
            return [];
        }
    },

    /**
     * Save entry to JSON file via API
     * @param {Object} entry - Entry object
     * @returns {Promise<boolean>} - Success status
     */
    async saveEntryToJSON(entry) {
        if (!this.USE_API) {
            console.warn('API is disabled. Entry not saved to JSON file.');
            return false;
        }

        try {
            const response = await fetch(`${this.API_BASE}/add_reflection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entry)
            });

            if (!response.ok) {
                throw new Error('Failed to save entry via API');
            }

            const result = await response.json();
            console.log('Entry saved to JSON via Flask API:', result);
            return true;
        } catch (error) {
            console.error('Error saving entry to JSON:', error);
            return false;
        }
    },

    /**
     * Delete entry from JSON file via API
     * @param {string} entryId - ID of entry to delete
     * @returns {Promise<boolean>} - Success status
     */
    async deleteEntryFromJSON(entryId) {
        if (!this.USE_API) {
            console.warn('API is disabled. Entry not deleted from JSON file.');
            return false;
        }

        try {
            const response = await fetch(`${this.API_BASE}/delete_reflection/${entryId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete entry via API');
            }

            const result = await response.json();
            console.log('Entry deleted from JSON via Flask API:', result);
            return true;
        } catch (error) {
            console.error('Error deleting entry from JSON:', error);
            return false;
        }
    },

    /**
     * Clear all entries from JSON file via API
     * @returns {Promise<boolean>} - Success status
     */
    async clearAllEntriesFromJSON() {
        if (!this.USE_API) {
            console.warn('API is disabled. Entries not cleared from JSON file.');
            return false;
        }

        // Clear all by deleting each entry individually
        // (Flask doesn't have a clear-all endpoint, so we'll fetch all and delete them)
        try {
            const entries = await this.fetchEntriesFromJSON();
            const deletePromises = entries.map(entry => 
                this.deleteEntryFromJSON(entry.id)
            );
            await Promise.all(deletePromises);
            console.log('All entries cleared from JSON via Flask API');
            return true;
        } catch (error) {
            console.error('Error clearing entries from JSON:', error);
            return false;
        }
    },

    /**
     * Update entry in JSON file via API
     * @param {string} entryId - ID of entry to update
     * @param {Object} updates - Object with fields to update
     * @returns {Promise<boolean>} - Success status
     */
    async updateEntryInJSON(entryId, updates) {
        if (!this.USE_API) {
            console.warn('API is disabled. Entry not updated in JSON file.');
            return false;
        }

        try {
            const response = await fetch(`${this.API_BASE}/update_reflection/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error('Failed to update entry via API');
            }

            const result = await response.json();
            console.log('Entry updated in JSON via Flask API:', result);
            return true;
        } catch (error) {
            console.error('Error updating entry in JSON:', error);
            return false;
        }
    },

    /**
     * Search entries on the server side
     * @param {string} query - Search keyword
     * @param {string} dateFrom - Start date (optional)
     * @param {string} dateTo - End date (optional)
     * @returns {Promise<Array>} - Array of filtered entries
     */
    async searchEntriesInJSON(query = '', dateFrom = '', dateTo = '') {
        if (!this.USE_API) {
            console.warn('API is disabled. Falling back to client-side search.');
            const entries = await this.fetchEntriesFromJSON();
            return this.clientSideSearch(entries, query, dateFrom, dateTo);
        }

        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const response = await fetch(`${this.API_BASE}/reflections/search?${params.toString()}`);
            if (!response.ok) throw new Error('Search request failed');
            
            const entries = await response.json();
            console.log('Entries searched via Flask API:', entries.length);
            return entries;
        } catch (error) {
            console.error('Error searching entries:', error);
            // Fallback to client-side search
            const entries = await this.fetchEntriesFromJSON();
            return this.clientSideSearch(entries, query, dateFrom, dateTo);
        }
    },

    /**
     * Client-side search fallback
     * @param {Array} entries - Entries to search
     * @param {string} query - Search keyword
     * @param {string} dateFrom - Start date
     * @param {string} dateTo - End date
     * @returns {Array} - Filtered entries
     */
    clientSideSearch(entries, query, dateFrom, dateTo) {
        let filtered = entries;

        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(entry => {
                const titleMatch = entry.title?.toLowerCase().includes(lowerQuery);
                const contentMatch = entry.content?.toLowerCase().includes(lowerQuery);
                return titleMatch || contentMatch;
            });
        }

        if (dateFrom) {
            filtered = filtered.filter(entry => entry.date >= dateFrom);
        }

        if (dateTo) {
            filtered = filtered.filter(entry => entry.date <= dateTo);
        }

        return filtered;
    },

    /**
     * Export entries as JSON file download
     * @param {Array} entries - Entries to export
     */
    exportJSON(entries) {
        try {
            const dataStr = JSON.stringify(entries, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `journal-reflections-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('Entries exported successfully');
            return true;
        } catch (error) {
            console.error('Error exporting JSON:', error);
            return false;
        }
    },

    /**
     * Get total count of entries
     * @param {Array} entries - Array of entries
     * @returns {number} - Count of entries
     */
    getEntriesCount(entries) {
        return entries ? entries.length : 0;
    },

    /**
     * Sync localStorage with JSON entries
     * @param {Array} jsonEntries - Entries from JSON file
     */
    syncWithJSON(jsonEntries) {
        try {
            const localEntries = this.getAllEntries();

            // Merge entries (prioritize JSON entries)
            const mergedEntries = [...jsonEntries];

            // Add local entries that don't exist in JSON
            localEntries.forEach(localEntry => {
                const exists = jsonEntries.some(je => je.id === localEntry.id);
                if (!exists) {
                    mergedEntries.push(localEntry);
                }
            });

            // Save merged entries to localStorage
            localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(mergedEntries));
            console.log('Synced entries - JSON:', jsonEntries.length, 'Local:', localEntries.length, 'Merged:', mergedEntries.length);

            return mergedEntries;
        } catch (error) {
            console.error('Error syncing with JSON:', error);
            return jsonEntries;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}

