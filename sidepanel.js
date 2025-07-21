// Everything Explorer Extension - Side Panel Script

// Initialize the extension
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    const resultsFrame = document.getElementById('resultsFrame');
    
    // Auto focus on search input when panel opens
    searchInput.focus();
    
    // Search functionality
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            const searchUrl = buildSearchUrl(query);
            resultsFrame.src = searchUrl;
        } else {
            resultsFrame.src = 'about:blank';
        }
    }
    
    // Build search URL with default D: drive
    function buildSearchUrl(query) {
        let searchQuery = `${query} D:`;
        return `http://localhost:8080/?s=${encodeURIComponent(searchQuery)}`;
    }
    
    // Search input event listeners
    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Clear button event listener
    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        resultsFrame.src = 'about:blank';
    });
});

// Handle extension messages
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SEARCH_QUERY') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = message.query;
                // Trigger search
                const event = new Event('input');
                searchInput.dispatchEvent(event);
            }
        }
        
        sendResponse({ success: true });
    });
}