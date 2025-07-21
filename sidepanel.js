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
    
    // Build search URL with default D: drive or parse Everything URL
    function buildSearchUrl(query) {
        // Check if query is an Everything HTTP server URL
        if (query.startsWith('http://localhost:8080/') || query.includes('localhost:8080/')) {
            return parseEverythingUrl(query);
        }
        
        // Regular search with D: drive
        let searchQuery = `${query} D:`;
        return `http://localhost:8080/?s=${encodeURIComponent(searchQuery)}`;
    }
    
    // Parse Everything URL and extract real file/folder path
    function parseEverythingUrl(url) {
        try {
            // Extract the path part after localhost:8080/
            const urlObj = new URL(url);
            let pathPart = urlObj.pathname;
            
            // Remove leading slash
            if (pathPart.startsWith('/')) {
                pathPart = pathPart.substring(1);
            }
            
            // Decode URL components
            const decodedPath = decodeURIComponent(pathPart);
            
            // Convert URL format back to Windows path
            // Example: D%3A/folder/file -> D:/folder/file -> D:\folder\file
            let realPath = decodedPath.replace(/\//g, '\\');
            
            // Display the path directly in the iframe by modifying its content
            displayPathResult(realPath);
            
            // Return about:blank since we're handling display separately
            return 'about:blank';
            
        } catch (error) {
            console.error('Error parsing Everything URL:', error);
            // Fallback to regular search if parsing fails
            let searchQuery = `${url} D:`;
            return `http://localhost:8080/?s=${encodeURIComponent(searchQuery)}`;
        }
    }
    
    // Display path result and auto-copy to clipboard
    function displayPathResult(realPath) {
        const resultsFrame = document.getElementById('resultsFrame');
        
        // Auto-copy to clipboard immediately
        copyPathToClipboard(realPath);
        
        // Simply show blank page after copying
        resultsFrame.onload = function() {
            // Do nothing - keep it blank and simple
        };
    }
    
    // Auto-copy path to clipboard
    function copyPathToClipboard(realPath) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(realPath).then(() => {
                console.log('Path copied to clipboard:', realPath);
            }).catch(() => {
                fallbackCopy(realPath);
            });
        } else {
            fallbackCopy(realPath);
        }
    }
    
    // Fallback copy method
    function fallbackCopy(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            console.log('Path copied to clipboard (fallback):', text);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
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