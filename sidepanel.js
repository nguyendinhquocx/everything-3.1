// Everything Explorer Extension - Side Panel Script

class EverythingExtension {
    constructor() {
        this.port = 8080;
        this.currentQuery = '';
        this.currentFilters = {
            type: '',
            date: 'all',
            drive: 'D:'
        };
        this.searchTimeout = null;
        this.isSearching = false;
        this.isFullscreen = false;
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateStatus('Sẵn sàng tìm kiếm');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'everything_port',
                'default_drive'
            ]);
            
            this.port = result.everything_port || 8080;
            this.currentFilters.drive = result.default_drive || 'D:';
            
            // Update UI
            this.updateDriveButtons();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                everything_port: this.port,
                default_drive: this.currentFilters.drive
            };
            
            await chrome.storage.local.set(settings);
            this.updateStatus('Cài đặt đã được lưu');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.updateStatus('Lỗi khi lưu cài đặt', 'error');
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            }
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => this.clearSearch());

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterName = e.target.dataset.filter;
                const filterValue = e.target.dataset.value;
                this.toggleFilter(filterName, filterValue);
            });
        });

        // Date filter buttons
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateType = e.target.dataset.date;
                this.selectDateFilter(dateType);
            });
        });

        // Drive selector buttons
        document.querySelectorAll('.drive-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const drive = e.target.dataset.drive;
                this.selectDrive(drive);
            });
        });

        // Fullscreen button
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }

    handleSearchInput(value) {
        this.currentQuery = value;
        
        // Show/hide clear button
        const clearBtn = document.getElementById('clearBtn');
        clearBtn.style.display = value ? 'flex' : 'none';
        
        // Debounced search
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        if (value.trim()) {
            this.searchTimeout = setTimeout(() => {
                this.performSearch(value);
            }, 300);
        } else {
            this.clearResults();
        }
    }

    async performSearch(query) {
        if (!query.trim() || this.isSearching) return;
        
        this.isSearching = true;
        this.updateStatus('Đang tìm kiếm...');
        
        try {
            const searchUrl = this.buildSearchUrl(query);
            const iframe = document.getElementById('resultsFrame');
            
            // Load results in iframe
            iframe.src = searchUrl;
            
            // Handle iframe load
            iframe.onload = () => {
                this.isSearching = false;
                this.updateStatus(`Tìm thấy kết quả cho: "${query}"`);
            };
            
            iframe.onerror = () => {
                this.isSearching = false;
                this.updateStatus('Không thể kết nối đến Everything', 'error');
            };
            
        } catch (error) {
            console.error('Search error:', error);
            this.isSearching = false;
            this.updateStatus('Lỗi khi tìm kiếm', 'error');
        }
    }

    buildSearchUrl(query) {
        let searchQuery = query.trim();
        
        // Apply type filters
        if (this.currentFilters.type) {
            switch(this.currentFilters.type) {
                case 'images':
                    searchQuery += ' ext:jpg;jpeg;png;gif;bmp;tiff;webp;svg';
                    break;
                case 'documents':
                    searchQuery += ' ext:pdf;doc;docx;txt;rtf;odt;xls;xlsx;ppt;pptx';
                    break;
                case 'media':
                    searchQuery += ' ext:mp4;avi;mkv;mov;wmv;flv;mp3;wav;flac;aac;ogg';
                    break;
                case 'folders':
                    searchQuery += ' folder:';
                    break;
            }
        }
        
        // Apply date filters
        if (this.currentFilters.date !== 'all') {
            const dateFilter = this.getDateFilter(this.currentFilters.date);
            if (dateFilter) {
                searchQuery += ` ${dateFilter}`;
            }
        }
        
        // Apply drive filter
        if (this.currentFilters.drive && this.currentFilters.drive !== 'ALL') {
            searchQuery += ` ${this.currentFilters.drive}`;
        }
        
        const encodedQuery = encodeURIComponent(searchQuery);
        return `http://localhost:${this.port}/?s=${encodedQuery}`;
    }

    getDateFilter(dateType) {
        const today = new Date();
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        };
        
        switch(dateType) {
            case 'today':
                return `dm:${formatDate(today)}`;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                return `dm:>=${formatDate(weekAgo)}`;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                return `dm:>=${formatDate(monthAgo)}`;
            default:
                return '';
        }
    }

    // Filter methods
    applyImageFilter() {
        this.toggleFilter('images', 'ext:jpg;jpeg;png;gif;bmp;svg;webp;ico');
    }

    applyDocumentFilter() {
        this.toggleFilter('documents', 'ext:pdf;doc;docx;txt;rtf;odt;xls;xlsx;ppt;pptx');
    }

    applyMediaFilter() {
        this.toggleFilter('media', 'ext:mp4;avi;mkv;mov;wmv;flv;mp3;wav;flac;aac');
    }

    applyFolderFilter() {
        this.toggleFilter('folders', 'folder:');
    }

    toggleFilter(filterName, filterValue) {
        const btn = document.getElementById(`filter-${filterName}`);
        const isActive = btn.classList.contains('active');
        
        // Clear all filter buttons
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        
        if (!isActive) {
            btn.classList.add('active');
            this.currentFilters.type = filterValue;
        } else {
            this.currentFilters.type = '';
        }
        
        // Re-search if there's a query
        if (this.currentQuery.trim()) {
            this.performSearch(this.currentQuery);
        }
    }

    selectDrive(drive) {
        this.currentFilters.drive = drive;
        this.updateDriveButtons();
        this.saveSettings();
        
        // Re-search if there's a query
        if (this.currentQuery.trim()) {
            this.performSearch(this.currentQuery);
        }
    }

    updateDriveButtons() {
        document.querySelectorAll('.drive-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`drive-${this.currentFilters.drive.toLowerCase().replace(':', '')}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    toggleFullscreen() {
        const iframe = document.getElementById('resultsFrame');
        const container = document.getElementById('resultsContainer');
        
        if (!this.isFullscreen) {
            // Enter fullscreen
            if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
            } else if (iframe.webkitRequestFullscreen) {
                iframe.webkitRequestFullscreen();
            } else if (iframe.msRequestFullscreen) {
                iframe.msRequestFullscreen();
            }
            this.isFullscreen = true;
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.isFullscreen = false;
        }
    }

    selectDateFilter(dateType) {
        // Update UI
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-date="${dateType}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.currentFilters.date = dateType;
        
        // Re-search if there's a query
        if (this.currentQuery.trim()) {
            this.performSearch(this.currentQuery);
        }
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('clearBtn').style.display = 'none';
        this.currentQuery = '';
        this.clearResults();
        this.updateStatus('Sẵn sàng tìm kiếm');
    }

    clearResults() {
        const iframe = document.getElementById('resultsFrame');
        iframe.src = '';
    }

    updateStatus(message, type = 'info') {
        const statusBar = document.getElementById('statusBar');
        const statusText = statusBar.querySelector('.status-text');
        
        statusText.textContent = message;
        
        // Remove existing type classes
        statusBar.classList.remove('error', 'success', 'warning');
        
        if (type !== 'info') {
            statusBar.classList.add(type);
        }
        
        // Auto-clear status after 3 seconds for non-info messages
        if (type !== 'info') {
            setTimeout(() => {
                statusBar.classList.remove(type);
                statusText.textContent = 'Sẵn sàng tìm kiếm';
            }, 3000);
        }
    }
}

// Global functions for HTML onclick handlers
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('active');
}

function clearSearch() {
    if (window.everythingApp) {
        window.everythingApp.clearSearch();
    }
}

function applyImageFilter() {
    if (window.everythingApp) {
        window.everythingApp.applyImageFilter();
    }
}

function applyDocumentFilter() {
    if (window.everythingApp) {
        window.everythingApp.applyDocumentFilter();
    }
}

function applyMediaFilter() {
    if (window.everythingApp) {
        window.everythingApp.applyMediaFilter();
    }
}

function applyFolderFilter() {
    if (window.everythingApp) {
        window.everythingApp.applyFolderFilter();
    }
}

function selectDateFilter(dateType) {
    if (window.everythingApp) {
        window.everythingApp.selectDateFilter(dateType);
    }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.everythingApp = new EverythingExtension();
    
    // Simple half-screen functionality
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const resultsContainer = document.querySelector('.results-container');
    let isHalfScreen = false;
    
    fullscreenBtn.addEventListener('click', function() {
        if (isHalfScreen) {
            // Exit half-screen mode
            resultsContainer.classList.remove('half-screen');
            fullscreenBtn.textContent = '⛶';
            isHalfScreen = false;
        } else {
            // Enter half-screen mode
            resultsContainer.classList.add('half-screen');
            fullscreenBtn.textContent = '✕';
            isHalfScreen = true;
        }
    });
});

// Handle extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SEARCH_QUERY') {
        document.getElementById('searchInput').value = message.query;
        if (window.everythingApp) {
            window.everythingApp.handleSearchInput(message.query);
        }
    }
    
    sendResponse({ success: true });
});