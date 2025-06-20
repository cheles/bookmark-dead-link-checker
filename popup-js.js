class BookmarkChecker {
  constructor() {
    this.stats = {
      total: 0,
      checked: 0,
      dead: 0,
      removed: 0
    };

    this.initializeElements();
    this.bindEvents();
    this.loadStatus();
    this.setupMessageListener();
  }

  initializeElements() {
    this.elements = {
      backupBtn: document.getElementById('backupBtn'),
      startBtn: document.getElementById('startBtn'),
      stopBtn: document.getElementById('stopBtn'),
      restoreBtn: document.getElementById('restoreBtn'),
      totalBookmarks: document.getElementById('totalBookmarks'),
      checkedCount: document.getElementById('checkedCount'),
      deadCount: document.getElementById('deadCount'),
      removedCount: document.getElementById('removedCount'),
      backupStatus: document.getElementById('backupStatus'),
      progressContainer: document.getElementById('progressContainer'),
      progressFill: document.getElementById('progressFill'),
      progressText: document.getElementById('progressText'),
      log: document.getElementById('log'),
      confirmationDialog: document.getElementById('confirmationDialog'),
      deadBookmarkCount: document.getElementById('deadBookmarkCount'),
      deadBookmarksList: document.getElementById('deadBookmarksList'),
      confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
      cancelDeleteBtn: document.getElementById('cancelDeleteBtn')
    };
  }

  bindEvents() {
    this.elements.backupBtn.addEventListener('click', () => this.createBackup());
    this.elements.startBtn.addEventListener('click', () => this.startChecking());
    this.elements.stopBtn.addEventListener('click', () => this.stopChecking());
    this.elements.restoreBtn.addEventListener('click', () => this.restoreBackup());
    this.elements.confirmDeleteBtn.addEventListener('click', () => this.confirmDeletion(true));
    this.elements.cancelDeleteBtn.addEventListener('click', () => this.confirmDeletion(false));
  }

  setupMessageListener() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'BACKUP_CREATED':
          this.updateBackupStatus('✅ Created');
          this.elements.restoreBtn.style.display = 'inline-block';
          this.log('✅ Backup created successfully!', 'backup');
          break;

        case 'CHECKING_STARTED':
          this.stats = message.stats;
          this.updateStats();
          this.showRunningState();
          this.log(`Starting check of ${this.stats.total} bookmarks...`);
          break;

        case 'PROGRESS_UPDATE':
          this.stats = message.stats;
          this.updateStats();
          this.updateProgress(message.progress, `Processed ${message.processed} of ${this.stats.total} bookmarks`);
          break;

        case 'DEAD_BOOKMARK_FOUND':
          this.log(`💀 Dead link found: ${message.bookmark.title}`, 'dead');
          break;

        case 'BOOKMARK_REMOVED':
          this.log(`🗑️ Removed: ${message.bookmark.title}`, 'removed');
          break;

        case 'CHECKING_COMPLETE':
          this.stats = message.stats;
          this.updateStats();
          this.updateProgress(100, 'Checking complete!');
          this.log(`✅ Checking complete! Found ${this.stats.dead} dead bookmarks, removed ${this.stats.removed}.`);
          this.showIdleState();
          break;

        case 'CHECKING_COMPLETE_CONFIRM':
          this.stats = message.stats;
          this.updateStats();
          this.updateProgress(100, 'Checking complete - awaiting confirmation');
          this.log(`⚠️ Found ${this.stats.dead} dead bookmarks. Please confirm deletion.`);
          this.showConfirmationDialog(message.deadBookmarks);
          this.showIdleState();
          break;

        case 'DELETION_COMPLETE':
          this.stats = message.stats;
          this.updateStats();
          this.hideConfirmationDialog();
          this.log(`✅ Successfully deleted ${message.deletedCount} dead bookmarks.`);
          break;

        case 'DELETION_CANCELLED':
          this.stats = message.stats;
          this.updateStats();
          this.hideConfirmationDialog();
          this.log('ℹ️ Bookmark deletion cancelled by user.');
          break;

        case 'CHECKING_STOPPED':
          this.stats = message.stats;
          this.updateStats();
          this.log('⏹️ Checking stopped by user.');
          this.hideConfirmationDialog();
          this.showIdleState();
          break;

        case 'CHECKING_ERROR':
          this.log(`❌ Error: ${message.error}`, 'error');
          this.hideConfirmationDialog();
          this.showIdleState();
          break;

        case 'BACKUP_RESTORED':
          this.log('✅ Bookmarks restored successfully!', 'restore');
          this.loadStatus(); // Reload the bookmark count
          break;
      }
    });
  }

  async loadStatus() {
    try {
      // Get status from background script
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });

      if (response.isRunning) {
        this.showRunningState();
        this.stats = response.stats;
        this.updateStats();
        this.elements.progressContainer.style.display = 'block';
        this.elements.log.style.display = 'block';
        this.log('Checking is running in background...');
      } else {
        this.showIdleState();
      }

      if (response.backupExists) {
        this.updateBackupStatus('✅ Available');
        this.elements.restoreBtn.style.display = 'inline-block';
      }

      // Load bookmark count
      const bookmarks = await this.getAllBookmarks();
      this.stats.total = bookmarks.length;
      this.updateStats();

    } catch (error) {
      console.error('Error loading status:', error);
      this.log('Error loading extension status', 'error');
    }
  }

  async createBackup() {
    try {
      this.elements.backupBtn.disabled = true;
      this.elements.backupBtn.textContent = 'Creating Backup...';
      this.log('📦 Creating bookmark backup...', 'backup');

      const response = await chrome.runtime.sendMessage({ type: 'CREATE_BACKUP' });

      if (response.success) {
        this.updateBackupStatus('✅ Created');
        this.elements.restoreBtn.style.display = 'inline-block';

        // Also download as file
        await this.downloadBackup();
      } else {
        this.log(`❌ Failed to create backup: ${response.error}`, 'error');
        this.updateBackupStatus('❌ Failed');
      }

    } catch (error) {
      console.error('Error creating backup:', error);
      this.log('❌ Failed to create backup', 'error');
      this.updateBackupStatus('❌ Failed');
    } finally {
      this.elements.backupBtn.disabled = false;
      this.elements.backupBtn.textContent = 'Create Backup Only';
    }
  }

  async downloadBackup() {
    try {
      const result = await chrome.storage.local.get(['bookmarkBackup']);
      if (result.bookmarkBackup) {
        const dataStr = JSON.stringify(result.bookmarkBackup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `bookmark-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
    }
  }

  async restoreBackup() {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    // Add to DOM temporarily
    document.body.appendChild(fileInput);

    try {
      // Show file picker
      const file = await new Promise((resolve, reject) => {
        fileInput.addEventListener('change', (event) => {
          const selectedFile = event.target.files[0];
          if (selectedFile) {
            resolve(selectedFile);
          } else {
            reject(new Error('No file selected'));
          }
        });

        // Trigger file picker
        fileInput.click();

        // Handle cancel (timeout after 30 seconds)
        setTimeout(() => {
          reject(new Error('File selection cancelled'));
        }, 30000);
      });

      // Read the file
      const fileContent = await this.readFileAsText(file);
      let backupData;

      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        this.log('❌ Invalid backup file format', 'error');
        return;
      }

      // Validate backup structure
      if (!backupData.tree || !backupData.version) {
        this.log('❌ Invalid backup file structure', 'error');
        return;
      }

      const confirmed = confirm(`This will replace all current bookmarks with the backup from "${file.name}". Are you sure?`);
      if (!confirmed) return;

      this.elements.restoreBtn.disabled = true;
      this.elements.restoreBtn.textContent = 'Restoring...';
      this.log(`🔄 Restoring bookmarks from ${file.name}...`, 'restore');

      // Send backup data to background script for restoration
      const response = await chrome.runtime.sendMessage({
        type: 'RESTORE_BACKUP_FROM_DATA',
        backupData: backupData
      });

      if (response.success) {
        this.log('✅ Bookmarks restored successfully!', 'restore');
        await this.loadStatus(); // Reload the bookmark count
      } else {
        this.log(`❌ Failed to restore backup: ${response.error}`, 'error');
      }

    } catch (error) {
      if (error.message !== 'File selection cancelled' && error.message !== 'No file selected') {
        console.error('Error restoring backup:', error);
        this.log('❌ Failed to restore backup', 'error');
      }
    } finally {
      // Clean up
      document.body.removeChild(fileInput);
      this.elements.restoreBtn.disabled = false;
      this.elements.restoreBtn.textContent = 'Restore Backup';
    }
  }

  // Helper method to read file as text
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  async startChecking() {
    try {
      this.log('📦 Starting bookmark checking (runs in background)...', 'backup');

      const response = await chrome.runtime.sendMessage({ type: 'START_CHECKING' });

      if (response.success) {
        this.showRunningState();
        this.elements.progressContainer.style.display = 'block';
        this.elements.log.style.display = 'block';
        this.log('✅ Checking started in background. You can close this popup.');
      } else {
        this.log(`❌ Failed to start checking: ${response.error}`, 'error');
      }

    } catch (error) {
      console.error('Error starting checking:', error);
      this.log('❌ Failed to start checking', 'error');
    }
  }

  async stopChecking() {
    try {
      await chrome.runtime.sendMessage({ type: 'STOP_CHECKING' });
      this.log('� Stopping check...');
    } catch (error) {
      console.error('Error stopping checking:', error);
    }
  }

  showRunningState() {
    this.elements.backupBtn.style.display = 'none';
    this.elements.startBtn.style.display = 'none';
    this.elements.stopBtn.style.display = 'inline-block';
    this.elements.restoreBtn.style.display = 'none';
    this.hideConfirmationDialog();
  }

  showIdleState() {
    this.elements.backupBtn.style.display = 'inline-block';
    this.elements.startBtn.style.display = 'inline-block';
    this.elements.stopBtn.style.display = 'none';
    this.elements.restoreBtn.style.display = 'inline-block';
    this.elements.startBtn.textContent = 'Start Checking';
  }

  async getAllBookmarks() {
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

  updateBackupStatus(status) {
    this.elements.backupStatus.textContent = status;
  }

  updateStats() {
    this.elements.totalBookmarks.textContent = this.stats.total;
    this.elements.checkedCount.textContent = this.stats.checked;
    this.elements.deadCount.textContent = this.stats.dead;
    this.elements.removedCount.textContent = this.stats.removed;
  }

  updateProgress(percentage, text) {
    this.elements.progressFill.style.width = `${percentage}%`;
    this.elements.progressText.textContent = text;
  }

  log(message, type = 'info') {
    const logItem = document.createElement('div');
    logItem.className = `log-item log-${type}`;
    logItem.textContent = `${new Date().toLocaleTimeString()}: ${message}`;

    this.elements.log.appendChild(logItem);
    this.elements.log.scrollTop = this.elements.log.scrollHeight;

    // Show log if it's hidden
    if (this.elements.log.style.display === 'none') {
      this.elements.log.style.display = 'block';
    }
  }

  async confirmDeletion(confirmed) {
    try {
      this.elements.confirmDeleteBtn.disabled = true;
      this.elements.cancelDeleteBtn.disabled = true;

      if (confirmed) {
        this.elements.confirmDeleteBtn.textContent = 'Deleting...';
        this.log('🗑️ Deleting confirmed dead bookmarks...');
      } else {
        this.elements.cancelDeleteBtn.textContent = 'Cancelling...';
        this.log('ℹ️ Cancelling bookmark deletion...');
      }

      const response = await chrome.runtime.sendMessage({
        type: 'CONFIRM_DELETION',
        confirmed: confirmed
      });

      if (response.success) {
        if (confirmed) {
          this.log(`✅ Successfully deleted ${response.deletedCount} dead bookmarks.`);
        } else {
          this.log('ℹ️ Bookmark deletion cancelled.');
        }
      } else {
        this.log(`❌ Error: ${response.error}`, 'error');
      }

    } catch (error) {
      console.error('Error handling confirmation:', error);
      this.log('❌ Failed to process confirmation', 'error');
    } finally {
      this.elements.confirmDeleteBtn.disabled = false;
      this.elements.cancelDeleteBtn.disabled = false;
      this.elements.confirmDeleteBtn.textContent = 'Delete Dead Bookmarks';
      this.elements.cancelDeleteBtn.textContent = 'Keep Bookmarks';
    }
  }

  showConfirmationDialog(deadBookmarks) {
    this.elements.deadBookmarkCount.textContent = deadBookmarks.length;

    // Clear previous list
    this.elements.deadBookmarksList.innerHTML = '';

    // Add dead bookmarks to the list
    deadBookmarks.forEach(bookmark => {
      const bookmarkItem = document.createElement('div');
      bookmarkItem.style.cssText = 'margin: 4px 0; padding: 4px; border-left: 3px solid #ea4335; background: white; border-radius: 2px;';
      bookmarkItem.innerHTML = `
        <div style="font-weight: bold; color: #333; margin-bottom: 2px;">${bookmark.title}</div>
        <div style="color: #666; font-size: 11px; word-break: break-all;">${bookmark.url}</div>
      `;
      this.elements.deadBookmarksList.appendChild(bookmarkItem);
    });

    this.elements.confirmationDialog.style.display = 'block';
  }

  hideConfirmationDialog() {
    this.elements.confirmationDialog.style.display = 'none';
  }
}

// Initialize the bookmark checker when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  new BookmarkChecker();
});