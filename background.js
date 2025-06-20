// Background service worker for Bookmark Dead Link Checker Extension

// Global state for background processing
let isRunning = false;
let shouldStop = false;
let currentStats = {
    total: 0,
    checked: 0,
    dead: 0,
    removed: 0
};
let backupData = null;
let processingState = null;

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Bookmark Dead Link Checker extension installed/updated');

    if (details.reason === 'install') {
        console.log('Extension installed for the first time');
    } else if (details.reason === 'update') {
        console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Bookmark Dead Link Checker extension started');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in background:', message);

    switch (message.type) {
        case 'GET_STATUS':
            sendResponse({
                isRunning: isRunning,
                stats: currentStats,
                backupExists: !!backupData
            });
            break;

        case 'CREATE_BACKUP':
            createBackup().then(result => {
                sendResponse(result);
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response

        case 'START_CHECKING':
            if (!isRunning) {
                startBackgroundChecking().then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            } else {
                sendResponse({ success: false, error: 'Already running' });
            }
            return true;

        case 'STOP_CHECKING':
            shouldStop = true;
            sendResponse({ success: true });
            break; case 'RESTORE_BACKUP':
            if (backupData) {
                restoreBackup().then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            } else {
                sendResponse({ success: false, error: 'No backup available' });
            }
            return true;

        case 'RESTORE_BACKUP_FROM_DATA':
            if (message.backupData) {
                restoreBackupFromData(message.backupData).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            } else {
                sendResponse({ success: false, error: 'No backup data provided' });
            }
            return true;

        default:
            console.log('Unknown message type:', message.type);
    }
});

// Create backup function
async function createBackup() {
    try {
        console.log('Creating bookmark backup in background...');

        const tree = await chrome.bookmarks.getTree();
        const timestamp = Date.now();
        const backup = {
            tree: tree,
            timestamp: timestamp,
            version: '1.0'
        };

        // Store backup in Chrome storage
        await chrome.storage.local.set({
            bookmarkBackup: backup,
            backupTimestamp: timestamp
        });

        backupData = backup;
        console.log('Backup created successfully');

        // Notify popup if it's open
        broadcastMessage({ type: 'BACKUP_CREATED', timestamp: timestamp });

        return { success: true, timestamp: timestamp };

    } catch (error) {
        console.error('Error creating backup:', error);
        return { success: false, error: error.message };
    }
}

// Start background checking
async function startBackgroundChecking() {
    if (isRunning) {
        return { success: false, error: 'Already running' };
    }

    try {
        // Create backup first if not exists
        if (!backupData) {
            const backupResult = await createBackup();
            if (!backupResult.success) {
                return { success: false, error: 'Failed to create backup: ' + backupResult.error };
            }
        }

        isRunning = true;
        shouldStop = false;

        // Reset stats
        currentStats = { total: 0, checked: 0, dead: 0, removed: 0 };

        // Get all bookmarks
        const bookmarks = await getAllBookmarks();
        currentStats.total = bookmarks.length;

        console.log(`Starting background check of ${bookmarks.length} bookmarks...`);
        broadcastMessage({ type: 'CHECKING_STARTED', stats: currentStats });

        // Process bookmarks in batches
        const batchSize = 3; // Smaller batches for background processing
        const delayBetweenBatches = 3000; // 3 second delay

        for (let i = 0; i < bookmarks.length && !shouldStop; i += batchSize) {
            const batch = bookmarks.slice(i, i + batchSize);
            await processBatch(batch);

            // Update progress
            const progress = Math.min(100, ((i + batchSize) / bookmarks.length) * 100);
            broadcastMessage({
                type: 'PROGRESS_UPDATE',
                progress: progress,
                stats: currentStats,
                processed: Math.min(i + batchSize, bookmarks.length)
            });

            // Delay between batches
            if (i + batchSize < bookmarks.length && !shouldStop) {
                await delay(delayBetweenBatches);
            }
        }

        isRunning = false;

        if (!shouldStop) {
            console.log(`Background checking complete! Removed ${currentStats.removed} dead bookmarks.`);
            broadcastMessage({ type: 'CHECKING_COMPLETE', stats: currentStats });
        } else {
            console.log('Background checking stopped by user.');
            broadcastMessage({ type: 'CHECKING_STOPPED', stats: currentStats });
        }

        return { success: true };

    } catch (error) {
        isRunning = false;
        console.error('Error during background checking:', error);
        broadcastMessage({ type: 'CHECKING_ERROR', error: error.message });
        return { success: false, error: error.message };
    }
}

// Process a batch of bookmarks
async function processBatch(bookmarks) {
    const promises = bookmarks.map(bookmark => checkBookmark(bookmark));
    await Promise.allSettled(promises);
}

// Check individual bookmark
async function checkBookmark(bookmark) {
    if (shouldStop) return;

    try {
        const isAlive = await isUrlAlive(bookmark.url);
        currentStats.checked++;

        if (!isAlive) {
            currentStats.dead++;
            console.log(`Dead link: ${bookmark.title} - ${bookmark.url}`);

            // Remove the dead bookmark
            await chrome.bookmarks.remove(bookmark.id);
            currentStats.removed++;
            console.log(`Removed: ${bookmark.title}`);

            // Broadcast removal
            broadcastMessage({
                type: 'BOOKMARK_REMOVED',
                bookmark: { title: bookmark.title, url: bookmark.url }
            });
        } else {
            console.log(`Alive: ${bookmark.title}`);
        }

    } catch (error) {
        console.error(`Error checking bookmark ${bookmark.url}:`, error);
    }
}

// Check if URL is alive
async function isUrlAlive(url) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve(false);
        }, 5000);

        const controller = new AbortController();

        fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'DNT': '1',
                'Connection': 'keep-alive'
            }
        }).then(() => {
            clearTimeout(timeout);
            controller.abort();
            resolve(true);
        }).catch(() => {
            if (controller.signal.aborted) {
                resolve(false);
                return;
            }

            clearTimeout(timeout);
            const fallbackTimeout = setTimeout(() => {
                controller.abort();
                resolve(false);
            }, 3000);

            fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'DNT': '1'
                }
            }).then(() => {
                clearTimeout(fallbackTimeout);
                controller.abort();
                resolve(true);
            }).catch(() => {
                clearTimeout(fallbackTimeout);
                controller.abort();
                resolve(false);
            });
        });
    });
}

// Get all bookmarks
async function getAllBookmarks() {
    const bookmarks = [];

    const traverse = (nodes) => {
        for (const node of nodes) {
            if (node.url) {
                bookmarks.push(node);
            }
            if (node.children) {
                traverse(node.children);
            }
        }
    };

    const tree = await chrome.bookmarks.getTree();
    traverse(tree);
    return bookmarks;
}

// Restore backup
async function restoreBackup() {
    try {
        console.log('Restoring bookmarks from backup...');

        // Clear existing bookmarks
        const tree = await chrome.bookmarks.getTree();
        await clearBookmarks(tree[0].children);

        // Restore from backup
        await restoreBookmarksFromTree(backupData.tree[0].children);

        console.log('Bookmarks restored successfully');
        broadcastMessage({ type: 'BACKUP_RESTORED' });

        return { success: true };

    } catch (error) {
        console.error('Error restoring backup:', error);
        return { success: false, error: error.message };
    }
}

// Restore backup from provided data
async function restoreBackupFromData(providedBackupData) {
    try {
        console.log('Restoring bookmarks from provided backup data...');

        // Validate backup data structure
        if (!providedBackupData.tree || !Array.isArray(providedBackupData.tree)) {
            throw new Error('Invalid backup data: missing or invalid tree structure');
        }

        if (!providedBackupData.version) {
            throw new Error('Invalid backup data: missing version information');
        }

        // Clear existing bookmarks
        const tree = await chrome.bookmarks.getTree();
        await clearBookmarks(tree[0].children);

        // Restore from provided backup data
        await restoreBookmarksFromTree(providedBackupData.tree[0].children);

        console.log('Bookmarks restored successfully from file');
        broadcastMessage({ type: 'BACKUP_RESTORED' });

        return { success: true };

    } catch (error) {
        console.error('Error restoring backup from data:', error);
        return { success: false, error: error.message };
    }
}

// Clear bookmarks helper
async function clearBookmarks(nodes) {
    for (const node of nodes) {
        if (node.children) {
            await clearBookmarks(node.children);
        }
        if (node.url || (node.children && node.children.length === 0)) {
            try {
                await chrome.bookmarks.remove(node.id);
            } catch (error) {
                // Some system folders can't be removed, ignore these errors
            }
        }
    }
}

// Restore bookmarks from tree helper
async function restoreBookmarksFromTree(nodes, parentId = null) {
    for (const node of nodes) {
        try {
            if (node.url) {
                await chrome.bookmarks.create({
                    parentId: parentId,
                    title: node.title,
                    url: node.url
                });
            } else if (node.children) {
                const folder = await chrome.bookmarks.create({
                    parentId: parentId,
                    title: node.title
                });
                await restoreBookmarksFromTree(node.children, folder.id);
            }
        } catch (error) {
            console.error('Error restoring node:', node, error);
        }
    }
}

// Broadcast message to popup (if open)
function broadcastMessage(message) {
    chrome.runtime.sendMessage(message).catch(() => {
        // Popup might not be open, ignore the error
    });
}

// Utility delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Load existing backup on startup
chrome.storage.local.get(['bookmarkBackup']).then(result => {
    if (result.bookmarkBackup) {
        backupData = result.bookmarkBackup;
        console.log('Existing backup loaded');
    }
});

// Keep service worker alive during processing
let keepAliveInterval;

function startKeepAlive() {
    if (keepAliveInterval) return;
    keepAliveInterval = setInterval(() => {
        chrome.runtime.getPlatformInfo(() => {
            // This keeps the service worker active
        });
    }, 20000);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

// Start keep-alive when checking begins
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'START_CHECKING') {
        startKeepAlive();
    } else if (message.type === 'STOP_CHECKING' || message.type === 'CHECKING_COMPLETE') {
        stopKeepAlive();
    }
});
