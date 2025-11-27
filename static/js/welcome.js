// ===================================
// WELCOME MODAL - First Visit Greeting
// ===================================

const WelcomeModal = {
    /**
     * Show welcome modal for first-time visitors
     */
    async show() {
        // Check if user has visited before
        if (StorageManager.hasVisitedBefore()) {
            console.log('Returning visitor - welcome modal skipped');
            return;
        }

        // Get current location
        let location = { city: 'Unknown', country: 'Unknown' };
        try {
            location = await LocationService.getFullLocation();
        } catch (error) {
            console.warn('Could not get location for welcome modal:', error);
        }

        // Get current date and time
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Create modal HTML
        const modalHTML = `
            <div id="welcome-modal" class="welcome-modal active">
                <div class="welcome-modal-content">
                    <div class="welcome-animation">
                        <div class="success-icon">
                            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                                <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                        </div>
                        <div class="confetti">
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                            <div class="confetti-piece"></div>
                        </div>
                    </div>
                    <div class="welcome-header">
                        <h2 class="welcome-title">🎉 Welcome!</h2>
                        <p class="welcome-subtitle">Congratulations on your first visit!</p>
                    </div>
                    <div class="welcome-info">
                        <div class="info-item">
                            <span class="info-icon">📍</span>
                            <div class="info-content">
                                <span class="info-label">Location</span>
                                <span class="info-value">${location.city}, ${location.country}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">📅</span>
                            <div class="info-content">
                                <span class="info-label">Date</span>
                                <span class="info-value">${dateStr}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">🕐</span>
                            <div class="info-content">
                                <span class="info-label">Time</span>
                                <span class="info-value">${timeStr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="welcome-message">
                        <p>We're excited to have you here! Start documenting your learning journey today.</p>
                    </div>
                    <button class="welcome-close-btn btn btn-primary" id="close-welcome-btn">
                        Get Started
                    </button>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup close button
        const closeBtn = document.getElementById('close-welcome-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }

        // Mark as visited
        StorageManager.markAsVisited();

        // Auto-close after 10 seconds (optional)
        setTimeout(() => {
            if (document.getElementById('welcome-modal')) {
                this.close();
            }
        }, 10000);

        console.log('Welcome modal shown');
    },

    /**
     * Close welcome modal
     */
    close() {
        const modal = document.getElementById('welcome-modal');
        if (modal) {
            modal.classList.remove('active');
            // Remove from DOM after animation
            setTimeout(() => {
                modal.remove();
            }, 500);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WelcomeModal;
}

