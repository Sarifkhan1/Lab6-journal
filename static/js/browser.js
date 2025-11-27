// ===================================
// BROWSER APIs - Geolocation & Validation
// ===================================

const LocationService = {
    // Cache location for session
    cachedLocation: null,
    cachedTimestamp: null,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

    /**
     * Get user's current location using Geolocation API
     * @returns {Promise<Object>} - Promise resolving to {lat, lon} or null
     */
    async getCurrentLocation() {
        // Check cache first
        if (this.cachedLocation && this.cachedTimestamp) {
            const cacheAge = Date.now() - this.cachedTimestamp;
            if (cacheAge < this.CACHE_DURATION) {
                console.log('Using cached location');
                return this.cachedLocation;
            }
        }

        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser');
                resolve(null);
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    
                    // Cache the location
                    this.cachedLocation = location;
                    this.cachedTimestamp = Date.now();
                    
                    console.log('Location retrieved:', location);
                    resolve(location);
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    resolve(null);
                },
                options
            );
        });
    },

    /**
     * Reverse geocode coordinates to get city, state, country
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Promise resolving to {city, state, country} or null
     */
    async reverseGeocode(lat, lon) {
        try {
            // Using Nominatim (OpenStreetMap) - free, no API key needed
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'LearningJournalApp/1.0'
                }
            });

            if (!response.ok) {
                throw new Error('Reverse geocoding failed');
            }

            const data = await response.json();
            const address = data.address || {};

            const location = {
                city: address.city || address.town || address.village || address.municipality || 'Unknown City',
                state: address.state || address.region || '',
                country: address.country || 'Unknown Country'
            };

            console.log('Reverse geocoded:', location);
            return location;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return {
                city: 'Unknown City',
                state: '',
                country: 'Unknown Country'
            };
        }
    },

    /**
     * Get full location info (coordinates + reverse geocoded)
     * @returns {Promise<Object>} - Promise resolving to location object
     */
    async getFullLocation() {
        const coords = await this.getCurrentLocation();
        
        if (!coords) {
            return {
                lat: null,
                lon: null,
                city: 'Location unavailable',
                state: '',
                country: 'Please enable location permissions'
            };
        }

        const address = await this.reverseGeocode(coords.lat, coords.lon);
        
        return {
            lat: coords.lat,
            lon: coords.lon,
            ...address
        };
    },

    /**
     * Display location in navbar
     * @param {Object} location - Location object with city and country
     */
    displayInNav(location) {
        const locationElement = document.getElementById('nav-location');
        if (!locationElement) {
            console.warn('Location display element not found');
            return;
        }

        if (location && location.city && location.country) {
            locationElement.textContent = `📍 ${location.city}, ${location.country}`;
            locationElement.setAttribute('data-lat', location.lat || '');
            locationElement.setAttribute('data-lon', location.lon || '');
            locationElement.style.cursor = location.lat ? 'pointer' : 'default';
        } else {
            locationElement.textContent = '📍 Location unavailable';
        }
    }
};

const FormValidator = {
    /**
     * Validate journal entry form
     * @param {HTMLFormElement} form - Form element to validate
     * @returns {Object} - {valid: boolean, errors: Array}
     */
    validate(form) {
        const errors = [];
        const title = form.querySelector('#journal-title') || form.querySelector('input[name="title"]');
        const content = form.querySelector('#journal-content') || form.querySelector('textarea[name="content"]');

        // Validate title
        if (!title || !title.value.trim()) {
            errors.push({ field: 'title', message: 'Title is required' });
            if (title) {
                title.classList.add('error');
            }
        } else {
            if (title) title.classList.remove('error');
        }

        // Validate content
        if (!content || !content.value.trim()) {
            errors.push({ field: 'content', message: 'Content is required' });
            if (content) {
                content.classList.add('error');
            }
        } else {
            if (content) content.classList.remove('error');
        }

        // Check minimum word count for content (if exists)
        if (content && content.value.trim()) {
            const wordCount = content.value.trim().split(/\s+/).length;
            if (wordCount < 10) {
                errors.push({ field: 'content', message: 'Content must be at least 10 words' });
                content.classList.add('error');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Show modal with message
     * @param {string} type - 'success' or 'error'
     * @param {string} message - Message to display
     */
    showModal(type, message) {
        const modal = document.getElementById('form-modal');
        const modalMessage = document.getElementById('modal-message');
        const modalType = document.getElementById('modal-type');

        if (!modal || !modalMessage) {
            console.warn('Modal elements not found');
            // Fallback: use alert
            alert(message);
            return;
        }

        // Set message and type
        modalMessage.textContent = message;
        if (modalType) {
            modalType.textContent = type === 'success' ? '✓ Success' : '✗ Error';
            modalType.className = `modal-type ${type}`;
        }

        // Show modal
        modal.classList.add('active');

        // Auto-hide after 3 seconds for success, 5 seconds for error
        const hideDelay = type === 'success' ? 3000 : 5000;
        setTimeout(() => {
            this.hideModal();
        }, hideDelay);
    },

    /**
     * Hide modal
     */
    hideModal() {
        const modal = document.getElementById('form-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Clear form inputs
     * @param {HTMLFormElement} form - Form to clear
     */
    clearForm(form) {
        if (!form) return;
        
        form.reset();
        
        // Remove error classes
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => input.classList.remove('error'));
        
        // Clear any error messages
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LocationService, FormValidator };
}

