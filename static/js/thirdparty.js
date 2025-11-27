// ===================================
// THIRD-PARTY APIs - Music & Maps
// ===================================

const MusicPlayer = {
    currentTrack: null,
    currentAudio: null,
    playlist: [
        {
            title: "Focus Flow",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            duration: "4:40"
        },
        {
            title: "Study Beats",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            duration: "5:12"
        },
        {
            title: "Calm Coding",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            duration: "4:25"
        },
        {
            title: "Deep Work",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            duration: "5:00"
        },
        {
            title: "Productive Vibes",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
            duration: "4:55"
        }
    ],

    /**
     * Initialize music player
     */
    init() {
        this.createPlaylistUI();
        this.restoreVolume();
        this.setupEventListeners();
        console.log('Music player initialized');
    },

    /**
     * Create playlist UI dynamically
     */
    createPlaylistUI() {
        const playlistContainer = document.getElementById('music-playlist');
        if (!playlistContainer) {
            console.warn('Playlist container not found');
            return;
        }

        let html = `
            <div class="playlist-header">
                <h3>🎵 Study Playlist</h3>
                <div class="volume-control">
                    <label for="volume-slider">🔊</label>
                    <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="${StorageManager.getVolume()}">
                    <span id="volume-value">${Math.round(StorageManager.getVolume() * 100)}%</span>
                </div>
            </div>
            <div class="playlist-tracks">
        `;

        this.playlist.forEach((track, index) => {
            html += `
                <div class="track-item" data-track-index="${index}">
                    <div class="track-info">
                        <span class="track-title">${track.title}</span>
                        <span class="track-duration">${track.duration}</span>
                    </div>
                    <div class="track-controls">
                        <button class="play-btn" data-track-index="${index}" aria-label="Play ${track.title}">
                            ▶️
                        </button>
                        <div class="progress-container">
                            <div class="progress-bar" data-track-index="${index}">
                                <div class="progress-fill" data-track-index="${index}"></div>
                            </div>
                        </div>
                    </div>
                    <div class="now-playing-indicator" data-track-index="${index}" style="display: none;">
                        <span>🎵 Now Playing</span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        playlistContainer.innerHTML = html;
    },

    /**
     * Setup event listeners for music player
     */
    setupEventListeners() {
        // Play buttons
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const trackIndex = parseInt(e.target.getAttribute('data-track-index'));
                this.play(trackIndex);
            });
        });

        // Volume slider
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                this.setVolume(volume);
                StorageManager.saveVolume(volume);
            });
        }
    },

    /**
     * Play a track
     * @param {number} trackIndex - Index of track in playlist
     */
    play(trackIndex) {
        // Pause current track if playing
        if (this.currentAudio && !this.currentAudio.paused) {
            this.pause();
        }

        // Create new audio element if needed
        if (!this.currentAudio || this.currentTrack !== trackIndex) {
            if (this.currentAudio) {
                this.currentAudio.removeEventListener('timeupdate', this.updateProgress);
                this.currentAudio.removeEventListener('ended', this.onTrackEnd);
            }

            const track = this.playlist[trackIndex];
            this.currentAudio = new Audio(track.url);
            this.currentTrack = trackIndex;

            // Set volume
            this.currentAudio.volume = StorageManager.getVolume();

            // Event listeners
            this.currentAudio.addEventListener('timeupdate', () => this.updateProgress());
            this.currentAudio.addEventListener('ended', () => this.onTrackEnd());
            this.currentAudio.addEventListener('loadstart', () => this.showLoading(trackIndex));
            this.currentAudio.addEventListener('canplay', () => this.hideLoading(trackIndex));
        }

        // Play the track
        this.currentAudio.play()
            .then(() => {
                this.updateUI();
                console.log('Playing track:', this.playlist[trackIndex].title);
            })
            .catch(error => {
                console.error('Error playing track:', error);
                FormValidator.showModal('error', 'Failed to play track. Please check your connection.');
            });
    },

    /**
     * Pause current track
     */
    pause() {
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            this.updateUI();
            console.log('Track paused');
        }
    },

    /**
     * Set volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        if (this.currentAudio) {
            this.currentAudio.volume = volume;
        }
        
        const volumeValue = document.getElementById('volume-value');
        if (volumeValue) {
            volumeValue.textContent = `${Math.round(volume * 100)}%`;
        }
    },

    /**
     * Restore volume from LocalStorage
     */
    restoreVolume() {
        const volume = StorageManager.getVolume();
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = volume;
            this.setVolume(volume);
        }
    },

    /**
     * Update UI to reflect current playing state
     */
    updateUI() {
        // Update all play buttons
        document.querySelectorAll('.play-btn').forEach((btn, index) => {
            if (index === this.currentTrack && this.currentAudio && !this.currentAudio.paused) {
                btn.textContent = '⏸️';
                btn.setAttribute('aria-label', `Pause ${this.playlist[index].title}`);
            } else {
                btn.textContent = '▶️';
                btn.setAttribute('aria-label', `Play ${this.playlist[index].title}`);
            }
        });

        // Update now playing indicators
        document.querySelectorAll('.now-playing-indicator').forEach((indicator, index) => {
            if (index === this.currentTrack && this.currentAudio && !this.currentAudio.paused) {
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
        });
    },

    /**
     * Update progress bar
     */
    updateProgress() {
        if (!this.currentAudio || this.currentTrack === null) return;

        const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
        const progressFill = document.querySelector(`.progress-fill[data-track-index="${this.currentTrack}"]`);
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    },

    /**
     * Handle track end
     */
    onTrackEnd() {
        console.log('Track ended');
        this.updateUI();
    },

    /**
     * Show loading state
     * @param {number} trackIndex - Index of track loading
     */
    showLoading(trackIndex) {
        const trackItem = document.querySelector(`.track-item[data-track-index="${trackIndex}"]`);
        if (trackItem) {
            trackItem.classList.add('loading');
        }
    },

    /**
     * Hide loading state
     * @param {number} trackIndex - Index of track
     */
    hideLoading(trackIndex) {
        const trackItem = document.querySelector(`.track-item[data-track-index="${trackIndex}"]`);
        if (trackItem) {
            trackItem.classList.remove('loading');
        }
    }
};

const MapService = {
    map: null,
    marker: null,

    /**
     * Show map modal with user's location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     */
    showMap(lat, lon) {
        const mapModal = document.getElementById('map-modal');
        if (!mapModal) {
            console.warn('Map modal not found');
            return;
        }

        // Show modal
        mapModal.classList.add('active');

        // Initialize map after a short delay to ensure modal is visible
        setTimeout(() => {
            this.initMap(lat, lon);
        }, 100);
    },

    /**
     * Initialize Leaflet map
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     */
    initMap(lat, lon) {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) {
            console.warn('Map container not found');
            return;
        }

        // Clear existing map if any
        if (this.map) {
            this.map.remove();
        }

        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet.js not loaded');
            FormValidator.showModal('error', 'Map library not loaded. Please refresh the page.');
            return;
        }

        // Initialize map
        this.map = L.map('map-container').setView([lat, lon], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add marker at user's location
        this.marker = L.marker([lat, lon])
            .addTo(this.map)
            .bindPopup('📍 Your Location')
            .openPopup();

        console.log('Map initialized at:', lat, lon);
    },

    /**
     * Close map modal
     */
    closeMap() {
        const mapModal = document.getElementById('map-modal');
        if (mapModal) {
            mapModal.classList.remove('active');
        }
    }
};

// ===================================
// YOUTUBE API - Video Embedding & Control
// ===================================

const YouTubeService = {
    // Popular educational/tech YouTube channels videos (public, embeddable)
    videoPlaylist: [
        {
            id: 'PkZNo7MFNFg',
            title: 'JavaScript Tutorial for Beginners: Learn JavaScript in 1 Hour',
            channel: 'Programming with Mosh',
            thumbnail: 'https://img.youtube.com/vi/PkZNo7MFNFg/mqdefault.jpg'
        },
        {
            id: 'hdI2bqOjy3c',
            title: 'JavaScript Crash Course For Beginners',
            channel: 'Traversy Media',
            thumbnail: 'https://img.youtube.com/vi/hdI2bqOjy3c/mqdefault.jpg'
        },
        {
            id: 'jS4aFq5-91M',
            title: 'HTML & CSS Full Course - Beginner to Pro',
            channel: 'SuperSimpleDev',
            thumbnail: 'https://img.youtube.com/vi/jS4aFq5-91M/mqdefault.jpg'
        },
        {
            id: '1Rs2ND1ryYc',
            title: 'CSS Tutorial - Zero to Hero (Complete Course)',
            channel: 'FreeCodeCamp',
            thumbnail: 'https://img.youtube.com/vi/1Rs2ND1ryYc/mqdefault.jpg'
        },
        {
            id: 'bMknfKXIFA8',
            title: 'React Course - Beginner\'s Tutorial for React JavaScript Library',
            channel: 'FreeCodeCamp',
            thumbnail: 'https://img.youtube.com/vi/bMknfKXIFA8/mqdefault.jpg'
        },
        {
            id: 'SqcY0GlETPk',
            title: 'Git and GitHub for Beginners - Crash Course',
            channel: 'FreeCodeCamp',
            thumbnail: 'https://img.youtube.com/vi/SqcY0GlETPk/mqdefault.jpg'
        }
    ],

    currentPlayer: null,
    currentVideoId: null,

    /**
     * Initialize YouTube IFrame API
     */
    init() {
        // Load YouTube IFrame API if not already loaded
        if (window.YT && window.YT.Player) {
            this.createVideoGrid();
            return;
        }

        // Create script tag for YouTube API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Wait for API to load
        window.onYouTubeIframeAPIReady = () => {
            this.createVideoGrid();
            console.log('YouTube IFrame API loaded');
        };
    },

    /**
     * Create video grid UI
     */
    createVideoGrid() {
        const videoContainer = document.getElementById('youtube-videos');
        if (!videoContainer) {
            console.warn('YouTube video container not found');
            return;
        }

        let html = `
            <div class="videos-grid">
        `;

        this.videoPlaylist.forEach((video, index) => {
            html += `
                <div class="video-card" data-video-id="${video.id}">
                    <div class="video-thumbnail" data-video-id="${video.id}">
                        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                        <div class="play-overlay">
                            <svg width="68" height="48" viewBox="0 0 68 48">
                                <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.63-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path>
                                <path d="M 45,24 27,14 27,34" fill="#fff"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="video-info">
                        <h4 class="video-title">${video.title}</h4>
                        <p class="video-channel">📺 ${video.channel}</p>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        // Add player container
        html += `
            <div id="youtube-player-container" class="player-container" style="display: none;">
                <div class="player-header">
                    <h3 id="player-title">Video Player</h3>
                    <button class="close-player-btn" id="close-player-btn" aria-label="Close player">×</button>
                </div>
                <div id="youtube-player"></div>
            </div>
        `;

        videoContainer.innerHTML = html;

        // Add click handlers
        this.setupVideoHandlers();
    },

    /**
     * Setup video click handlers
     */
    setupVideoHandlers() {
        // Click on video card or thumbnail
        document.querySelectorAll('.video-card, .video-thumbnail').forEach(element => {
            element.addEventListener('click', (e) => {
                const videoCard = e.target.closest('.video-card');
                if (videoCard) {
                    const videoId = videoCard.getAttribute('data-video-id');
                    this.playVideo(videoId);
                }
            });
        });

        // Close player button
        const closeBtn = document.getElementById('close-player-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePlayer();
            });
        }
    },

    /**
     * Play a video
     * @param {string} videoId - YouTube video ID
     */
    playVideo(videoId) {
        const playerContainer = document.getElementById('youtube-player-container');
        const playerDiv = document.getElementById('youtube-player');
        
        if (!playerContainer || !playerDiv) {
            console.error('Player container not found');
            return;
        }

        // Find video info
        const video = this.videoPlaylist.find(v => v.id === videoId);
        const playerTitle = document.getElementById('player-title');
        if (playerTitle && video) {
            playerTitle.textContent = video.title;
        }

        // Show player container
        playerContainer.style.display = 'block';
        playerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Destroy existing player if any
        if (this.currentPlayer) {
            this.currentPlayer.destroy();
        }

        // Create new player
        this.currentPlayer = new YT.Player('youtube-player', {
            height: '390',
            width: '100%',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 1,
                rel: 0,
                modestbranding: 1
            },
            events: {
                onReady: (event) => {
                    console.log('YouTube player ready');
                },
                onStateChange: (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        console.log('Video ended');
                    }
                }
            }
        });

        this.currentVideoId = videoId;
    },

    /**
     * Close video player
     */
    closePlayer() {
        const playerContainer = document.getElementById('youtube-player-container');
        if (playerContainer) {
            playerContainer.style.display = 'none';
        }

        if (this.currentPlayer) {
            this.currentPlayer.stopVideo();
        }
    },

    /**
     * Pause current video
     */
    pauseVideo() {
        if (this.currentPlayer && this.currentPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
            this.currentPlayer.pauseVideo();
        }
    }
};

// ===================================
// FACEBOOK API - Share Functionality
// ===================================

const FacebookService = {
    /**
     * Initialize Facebook SDK
     */
    init() {
        // Load Facebook SDK if not already loaded
        if (window.FB) {
            console.log('Facebook SDK already loaded');
            return;
        }

        window.fbAsyncInit = function() {
            FB.init({
                appId: '', // Optional: Add your Facebook App ID if you have one
                xfbml: true,
                version: 'v18.0'
            });
            console.log('Facebook SDK initialized');
        };

        // Load Facebook SDK script
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = 'https://connect.facebook.net/en_US/sdk.js';
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    },

    /**
     * Share journal entry to Facebook
     * @param {Object} entry - Journal entry object
     */
    shareEntry(entry) {
        const url = window.location.href;
        const title = entry.title || 'My Learning Journal Entry';
        const description = entry.content ? entry.content.substring(0, 200) + '...' : 'Check out my learning journal entry!';
        
        // Facebook Share Dialog
        if (window.FB) {
            FB.ui({
                method: 'share',
                href: url,
                quote: `${title}\n\n${description}`,
            }, function(response) {
                if (response && !response.error_message) {
                    console.log('Post shared successfully');
                    FormValidator.showModal('success', 'Entry shared to Facebook successfully!');
                } else {
                    console.log('Error sharing:', response);
                }
            });
        } else {
            // Fallback: Open Facebook share dialog in new window
            const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title + '\n\n' + description)}`;
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    },

    /**
     * Share entry using Web Share API (modern browsers)
     * @param {Object} entry - Journal entry object
     */
    async shareNative(entry) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: entry.title || 'My Learning Journal Entry',
                    text: entry.content ? entry.content.substring(0, 200) : 'Check out my learning journal entry!',
                    url: window.location.href
                });
                console.log('Shared successfully');
                FormValidator.showModal('success', 'Entry shared successfully!');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    // Fallback to Facebook share
                    this.shareEntry(entry);
                }
            }
        } else {
            // Fallback to Facebook share
            this.shareEntry(entry);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MusicPlayer, MapService, YouTubeService, FacebookService };
}

