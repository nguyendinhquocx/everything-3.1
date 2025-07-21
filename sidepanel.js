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
        
        // Wait for iframe to load about:blank, then inject content
        resultsFrame.onload = function() {
            try {
                const iframeDoc = resultsFrame.contentDocument || resultsFrame.contentWindow.document;
                
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { 
                                font-family: system-ui, -apple-system, sans-serif; 
                                padding: 20px; 
                                background: #fff; 
                                color: #000;
                                line-height: 1.5;
                                margin: 0;
                                text-align: center;
                            }
                            .path-container {
                                background: #f5f5f5;
                                padding: 15px;
                                border-radius: 8px;
                                margin: 20px 0;
                                word-break: break-all;
                                font-family: 'Consolas', 'Monaco', monospace;
                                font-size: 14px;
                                text-align: left;
                            }
                            .success-message {
                                color: #000;
                                font-size: 16px;
                                margin-bottom: 10px;
                                font-weight: 500;
                            }
                            .instruction {
                                color: #666;
                                font-size: 14px;
                                margin-top: 15px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="success-message">✓ Đã copy đường dẫn vào clipboard!</div>
                        <div class="path-container">${realPath}</div>
                        <div class="instruction">Đường dẫn đã được copy tự động. Bạn có thể paste (Ctrl+V) ở bất kỳ đâu.</div>
                    </body>
                    </html>
                `;
                
                iframeDoc.open();
                iframeDoc.write(htmlContent);
                iframeDoc.close();
                
            } catch (error) {
                console.error('Error injecting content into iframe:', error);
            }
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