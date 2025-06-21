// Global variables
let currentUserQuery = '';
let currentFilter = '';
let selectedDateFilter = 'all';
let hasResults = false;
let isFullscreen = false;
let searchOnCDrive = false;

// Initialize when page loads
window.addEventListener('load', () => {
    document.getElementById('searchInput').focus();
    updateSearchTitle();
});

// Search functionality
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const query = this.value.trim();
        
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            searchGoogleWithCurrentInput();
        } else {
            e.preventDefault();
            handleSearchOrConvert(query);
        }
    }
});

document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value.trim();
    currentUserQuery = cleanUserQuery(query);
    
    updateSearchVisualFeedback(query);
    
    if (query === '' && hasResults) {
        setTimeout(() => {
            if (this.value.trim() === '') {
                closeIframe();
                currentUserQuery = '';
                currentFilter = '';
                resetSearchVisual();
                resetFilterUI();
            }
        }, 100);
    }
});

// Handle search or convert based on input
function handleSearchOrConvert(query) {
    if (!query) {
        closeIframe();
        return;
    }
    
    if (isLocalhostUrl(query)) {
        convertUrlDirectly(query);
    } else {
        performUnifiedSearch();
    }
}

// Check if input is localhost URL
function isLocalhostUrl(input) {
    return input.includes('localhost') || input.startsWith('local-file-open://');
}

// Convert URL directly and copy to clipboard
function convertUrlDirectly(url) {
    const localPath = convertUrlToLocalPath(url);
    
    if (localPath) {
        navigator.clipboard.writeText(localPath)
            .then(() => {
                showConvertSuccess(localPath);
                document.getElementById('searchInput').value = '';
                resetSearchVisual();
            })
            .catch(err => {
                console.error('Cannot copy to clipboard: ', err);
                showConvertError();
            });
    }
}

// Visual feedback for URL detection
function updateSearchVisualFeedback(query) {
    const searchIcon = document.querySelector('.search-icon svg');
    const searchInput = document.getElementById('searchInput');
    
    if (isLocalhostUrl(query)) {
        searchIcon.innerHTML = `
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M16.5,11H13V7.5H11V11H7.5V13H11V16.5H13V13H16.5V11Z"/>
        `;
        searchInput.placeholder = 'Nhấn Enter để convert URL';
    } else {
        resetSearchVisual();
    }
}

// Reset search visual to default
function resetSearchVisual() {
    const searchIcon = document.querySelector('.search-icon svg');
    const searchInput = document.getElementById('searchInput');
    
    searchIcon.innerHTML = `
        <path d="M15.5 14h-.79l-.28-.27c.98-1.14 1.57-2.62 1.57-4.23 0-3.59-2.91-6.5-6.5-6.5s-6.5 2.91-6.5 6.5 2.91 6.5 6.5 6.5c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5 4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/>
    `;
    searchInput.placeholder = 'Tìm kiếm';
}

// Drive selector functions
function toggleDrive(drive) {
    if (drive === 'C:') {
        const checkbox = document.getElementById('driveC');
        const driveOption = checkbox.closest('.drive-option');
        
        searchOnCDrive = !searchOnCDrive;
        
        if (searchOnCDrive) {
            checkbox.classList.add('active');
            driveOption.classList.add('active');
        } else {
            checkbox.classList.remove('active');
            driveOption.classList.remove('active');
        }
        
        if (hasResults) {
            performUnifiedSearch();
        }
    }
}

// Date filter functions
function selectDateFilter(period) {
    selectedDateFilter = period;
    
    // Update UI
    document.querySelectorAll('.date-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter-${period}`).classList.add('active');
    
    // Clear custom date inputs when using preset filters
    if (period !== 'custom') {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
    }
    
    if (hasResults) {
        performUnifiedSearch();
    }
}

// Date range functions
function applyDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        selectedDateFilter = 'custom';
        
        // Update UI - remove active from preset filters
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (hasResults) {
            performUnifiedSearch();
        }
    }
}

// File type filter functions
function applyImageFilter() {
    toggleFilterIcon('filter-images');
    applyQuickFilter('*.jpg|*.png|*.gif|*.jpeg|*.bmp|*.webp|*.svg');
}

function applyMediaFilter() {
    toggleFilterIcon('filter-media');
    applyQuickFilter('*.mp3|*.mp4|*.avi|*.mkv|*.mov|*.wmv|*.flv');
}

function applyDocumentFilter() {
    toggleFilterIcon('filter-documents');
    applyQuickFilter('*.doc|*.pdf|*.txt|*.xls|*.xlsx|*.csv|*.docx');
}

function applyFolderFilter() {
    toggleFilterIcon('filter-folders');
    applyQuickFilter('folder:');
}

function toggleFilterIcon(iconId) {
    const icon = document.getElementById(iconId);
    const isActive = icon.classList.contains('active');
    
    // Remove active from all filter icons
    document.querySelectorAll('.filter-icon').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Toggle current icon
    if (!isActive) {
        icon.classList.add('active');
    } else {
        currentFilter = '';
    }
}

function applyQuickFilter(filter) {
    const isActive = document.querySelector('.filter-icon.active');
    
    if (isActive) {
        currentFilter = filter;
    } else {
        currentFilter = '';
    }
    
    performUnifiedSearch();
}

// Get date filter for search query
function getDateFilter() {
    if (!selectedDateFilter || selectedDateFilter === 'all') {
        return '';
    }
    
    let dateValue = '';
    
    if (selectedDateFilter === 'custom') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate && endDate) {
            dateValue = `${startDate}..${endDate}`;
        }
    } else {
        const dateFilters = {
            'today': 'today',
            'week': 'thisweek',
            'month': 'thismonth',
            'year': 'thisyear'
        };
        dateValue = dateFilters[selectedDateFilter] || '';
    }
    
    if (!dateValue) return '';
    
    return `(dm:${dateValue}|dc:${dateValue}|da:${dateValue})`;
}

// Get drive filter
function getDriveFilter() {
    return searchOnCDrive ? 'C:' : 'D:';
}

// Main unified search function
function performUnifiedSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query && !currentFilter) {
        closeIframe();
        return;
    }
    
    currentUserQuery = cleanUserQuery(query);
    
    let searchParts = [];
    
    // Add drive filter
    const driveFilter = getDriveFilter();
    if (driveFilter) {
        searchParts.push(driveFilter);
    }
    
    // Add date filter
    const dateFilter = getDateFilter();
    if (dateFilter) {
        searchParts.push(dateFilter);
    }
    
    // Add file type filter
    if (currentFilter) {
        searchParts.push(currentFilter);
    }
    
    // Add user query
    if (currentUserQuery.trim()) {
        searchParts.push(currentUserQuery.trim());
    }
    
    const finalQuery = searchParts.join(' ');
    
    if (!finalQuery.trim()) {
        closeIframe();
        return;
    }
    
    console.log('Final Search Query:', finalQuery);
    
    const searchUrl = `http://localhost:8080/?s=${encodeURIComponent(finalQuery)}`;
    showInIframe(searchUrl, finalQuery);
}

// Clean user query by removing filter patterns
function cleanUserQuery(query) {
    let cleaned = query;
    
    cleaned = cleaned.replace(/\*\.[a-zA-Z0-9]+(\|\*\.[a-zA-Z0-9]+)*/g, '');
    cleaned = cleaned.replace(/size:[^\s]+/g, '');
    cleaned = cleaned.replace(/dm:[^\s]+/g, '');
    cleaned = cleaned.replace(/dc:[^\s]+/g, '');
    cleaned = cleaned.replace(/da:[^\s]+/g, '');
    cleaned = cleaned.replace(/folder:/g, '');
    cleaned = cleaned.replace(/[A-Z]:/g, '');
    cleaned = cleaned.replace(/\([^)]*\)/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// Reset filter UI
function resetFilterUI() {
    document.querySelectorAll('.filter-icon').forEach(btn => {
        btn.classList.remove('active');
    });
    currentFilter = '';
}

// Show convert success notification
function showConvertSuccess(localPath) {
    showToast('✓ Đã copy đường dẫn', 'success');
    
    const searchInput = document.getElementById('searchInput');
    const originalPlaceholder = searchInput.placeholder;
    
    searchInput.placeholder = '✓ Đã copy đường dẫn';
    
    setTimeout(() => {
        searchInput.placeholder = originalPlaceholder;
    }, 2000);
}

// Show convert error
function showConvertError() {
    showToast('❌ Lỗi khi copy vào clipboard', 'error');
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#2563eb'
    };
    
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%) translateY(-100%)',
        padding: '8px 16px',
        color: 'white',
        backgroundColor: colors[type] || colors.info,
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '9999',
        borderRadius: '6px',
        transition: 'transform 0.3s ease',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(-100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 2500);
}

// Update search title
function updateSearchTitle() {
    const searchInput = document.getElementById('searchInput');
    searchInput.title = 'Enter: Tìm kiếm hoặc Convert URL | Ctrl+Enter: Tìm Google';
}

// Search Google with current input
function searchGoogleWithCurrentInput() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query) {
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(googleUrl, '_blank');
    } else {
        window.open('https://www.google.com', '_blank');
    }
}

// Show results in iframe
function showInIframe(url, query) {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    
    container.style.display = 'block';
    iframe.src = url;
    
    iframe.onload = function() {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            const style = iframeDoc.createElement('style');
            style.textContent = `
                h1 { display: none !important; }
                input[type="text"] { display: none !important; }
                form { display: none !important; }
                body > * { display: none !important; }
                table, .results { display: table !important; }
                body > table:last-of-type { display: table !important; }
                body > div:last-child { display: block !important; }
                body { padding: 10px !important; margin: 0 !important; }
            `;
            
            iframeDoc.head.appendChild(style);
        } catch (e) {
            console.log('Cannot inject CSS due to CORS restrictions');
        }
    };
    
    hasResults = true;
}

// Fullscreen functionality
function toggleFullscreen() {
    const container = document.getElementById('iframeContainer');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const expandIcon = fullscreenBtn.querySelector('.expand-icon');
    const collapseIcon = fullscreenBtn.querySelector('.collapse-icon');
    
    if (!isFullscreen) {
        container.classList.add('fullscreen');
        document.body.classList.add('fullscreen-active');
        expandIcon.style.display = 'none';
        collapseIcon.style.display = 'block';
        fullscreenBtn.title = 'Thoát toàn màn hình';
        isFullscreen = true;
    } else {
        container.classList.remove('fullscreen');
        document.body.classList.remove('fullscreen-active');
        expandIcon.style.display = 'block';
        collapseIcon.style.display = 'none';
        fullscreenBtn.title = 'Toàn màn hình';
        isFullscreen = false;
    }
}

// Close iframe
function closeIframe() {
    const container = document.getElementById('iframeContainer');
    const iframe = document.getElementById('everythingFrame');
    
    if (isFullscreen) {
        toggleFullscreen();
    }
    
    container.style.display = 'none';
    iframe.src = '';
    iframe.onload = null;
    
    hasResults = false;
    currentFilter = '';
    resetFilterUI();
}

// URL Converter functions (unchanged)
function openUrlConverter() {
    document.getElementById('urlConverterModal').classList.add('open');
    document.getElementById('urlInput').focus();
    resetCopyStatus();
}

function closeUrlConverter() {
    document.getElementById('urlConverterModal').classList.remove('open');
    document.getElementById('urlInput').value = '';
    document.getElementById('pathOutput').value = '';
    resetCopyStatus();
}

function pasteFromClipboard() {
    navigator.clipboard.readText()
        .then(text => {
            document.getElementById('urlInput').value = text;
            convertAndCopyUrl();
        })
        .catch(err => {
            console.error('Cannot read clipboard: ', err);
            updateCopyStatus('Error', false);
        });
}

function convertAndCopyUrl() {
    const urlInput = document.getElementById('urlInput');
    const pathOutput = document.getElementById('pathOutput');
    const url = urlInput.value.trim();
    
    if (!url) {
        pathOutput.value = '';
        resetCopyStatus();
        return;
    }
    
    const localPath = convertUrlToLocalPath(url);
    pathOutput.value = localPath;
    
    if (localPath) {
        navigator.clipboard.writeText(localPath)
            .then(() => {
                updateCopyStatus('Copied!', true);
                setTimeout(() => {
                    closeUrlConverter();
                }, 1500);
            })
            .catch(err => {
                console.error('Cannot copy to clipboard: ', err);
                updateCopyStatus('Copy Failed', false);
            });
    }
}

function convertUrlToLocalPath(url) {
    let result = url;
    
    if (url.startsWith('local-file-open://')) {
        result = decodeURIComponent(url.replace('local-file-open://', ''));
    } else if (url.includes('localhost') && url.includes('%3A')) {
        const urlParts = url.split('localhost:');
        if (urlParts.length > 1) {
            const portAndPath = urlParts[1];
            const pathStart = portAndPath.indexOf('/', 0);
            if (pathStart !== -1) {
                const pathPart = portAndPath.substring(pathStart + 1);
                result = decodeURIComponent(pathPart.replace('%3A', ':'));
            }
        }
    }
    
    return result.replace(/\//g, '\\');
}

function updateCopyStatus(text, isSuccess) {
    const copyStatus = document.getElementById('copyStatus');
    const statusText = copyStatus.querySelector('.status-text');
    const copyIcon = copyStatus.querySelector('.copy-icon');
    const checkIcon = copyStatus.querySelector('.check-icon');
    
    statusText.textContent = text;
    
    if (isSuccess) {
        copyStatus.classList.add('copied');
        copyIcon.style.display = 'none';
        checkIcon.style.display = 'block';
    } else {
        copyStatus.classList.remove('copied');
        copyIcon.style.display = 'block';
        checkIcon.style.display = 'none';
    }
}

function resetCopyStatus() {
    updateCopyStatus('Ready', false);
}

// URL Input event listeners
document.getElementById('urlInput').addEventListener('input', function() {
    const pathOutput = document.getElementById('pathOutput');
    const url = this.value.trim();
    
    if (url) {
        const localPath = convertUrlToLocalPath(url);
        pathOutput.value = localPath;
        updateCopyStatus('Press Enter', false);
    } else {
        pathOutput.value = '';
        resetCopyStatus();
    }
});

document.getElementById('urlInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        convertAndCopyUrl();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    if (e.key === 'F11' || (hasResults && e.key === 'f')) {
        e.preventDefault();
        if (hasResults) {
            toggleFullscreen();
        }
    }
    
    if (e.key === 'Escape') {
        if (document.getElementById('urlConverterModal').classList.contains('open')) {
            closeUrlConverter();
        } else if (isFullscreen) {
            toggleFullscreen();
        } else if (hasResults) {
            closeIframe();
        }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        openUrlConverter();
    }
});

// Close modal when clicking overlay
document.getElementById('urlConverterModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeUrlConverter();
    }
});