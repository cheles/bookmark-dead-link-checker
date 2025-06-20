# 🔗 Bookmark Dead Link Checker

A powerful Chrome extension that automatically detects and removes dead bookmarks while running persistently in the background. Features comprehensive backup and restore capabilities to keep your bookmarks safe.

## ✨ Key Features

- 🔄 **Background Processing**: Runs continuously even when popup is closed
- 🛡️ **Automatic Backup**: Creates backup before any modifications
- 📁 **Flexible Restore**: Restore from any backup file (local or downloaded)
- 🔍 **Smart Detection**: Optimized URL checking with minimal resource usage
- ⚡ **Performance Optimized**: Processes bookmarks in small batches to prevent crashes
- 📊 **Real-time Progress**: Live progress tracking and detailed logging
- ⏹️ **User Control**: Start, stop, and monitor the process anytime
- 📈 **Comprehensive Stats**: Tracks checked, dead, and removed bookmarks
- 💾 **Dual Backup**: Stored locally + downloadable JSON file
- ✅ **Confirmation Required**: User approval needed before deleting any bookmarks

## 🚀 Installation

### Load as Unpacked Extension

1. **Prepare the Files**: Ensure you have all required files in one folder:

   ```text
   📁 Bookmark Extension/
   ├── manifest.json
   ├── popup.html
   ├── popup-js.js
   ├── background.js
   └── readme.md
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right corner)
   - Click **"Load unpacked"**
   - Select your extension folder
   - The extension appears in your extensions list

3. **Pin to Toolbar**:
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Bookmark Dead Link Checker" and click the pin icon
   - The extension icon now appears in your toolbar

## 📖 How to Use

### Quick Start

1. **Click the extension icon** in your Chrome toolbar
2. **Review your stats** - see total bookmarks and backup status
3. **Click "Start Checking"** - the process begins automatically
4. **Wait for completion** - checking runs in background, you can close the popup
5. **Review dead links** - when found, you'll see a confirmation dialog
6. **Confirm deletion** - choose to delete dead bookmarks or keep them

### Detailed Workflow

#### 🔍 Checking Process

1. **Automatic Backup**: Extension creates a backup before starting
2. **Background Processing**: Checks bookmarks in small batches (3 at a time)
3. **Smart Detection**: Uses HEAD requests first, falls back to GET if needed
4. **Progress Tracking**: Real-time updates on checked/dead/removed counts
5. **User Confirmation**: Shows list of dead bookmarks before deletion
6. **Safe Deletion**: Only removes bookmarks after user approval

#### 💾 Backup & Restore

**Create Backup Only**:
- Click "Create Backup Only" to save current bookmarks
- Backup stored in extension storage + downloaded as JSON file
- Use this before making manual bookmark changes

**Restore from Backup**:
- Click "Restore Backup" to open file picker
- Select any backup JSON file (from this or other devices)
- Confirms before replacing all current bookmarks
- Validates backup file format for safety

## 🎯 User Interface

### Main Controls

- **📦 Create Backup Only**: Creates backup without checking
- **▶️ Start Checking**: Begins the bookmark checking process
- **⏹️ Stop**: Cancels ongoing checking process
- **🔄 Restore Backup**: Restores bookmarks from backup file

### Statistics Display

- **Total Bookmarks**: Number of bookmarks found
- **Checked**: Number of bookmarks already processed
- **Dead Links**: Number of non-working bookmarks found
- **Removed**: Number of bookmarks actually deleted
- **Backup Status**: Shows if backup exists and when created

### Confirmation Dialog

When dead bookmarks are found:
- **List View**: Shows title and URL of each dead bookmark
- **Delete Dead Bookmarks**: Confirms deletion of all listed bookmarks
- **Keep Bookmarks**: Cancels deletion and keeps all bookmarks

## 🔧 Technical Details

### Background Processing

- **Service Worker**: Runs independently of popup interface
- **Persistent State**: Maintains progress even when popup closed
- **Batch Processing**: Handles 3 bookmarks at once to prevent overload
- **Smart Timeouts**: 5-second timeout for HEAD, 3-second for GET requests
- **Memory Efficient**: Clears processed data to prevent memory leaks

### URL Checking Logic

```javascript
1. Send HEAD request to URL (faster, less bandwidth)
2. If HEAD fails, try GET request as fallback
3. Use 'no-cors' mode to handle CORS restrictions
4. Set appropriate headers to mimic browser requests
5. Timeout after 5 seconds to prevent hanging
```

### Data Storage

- **Chrome Storage API**: Backup data stored locally in browser
- **JSON Export**: Downloadable backup files for external storage
- **Data Validation**: Verifies backup file structure before restore
- **Safe Restoration**: Validates all bookmark data before applying

## 🛡️ Safety Features

### Backup Protection

- ✅ **Automatic backup** before any bookmark modifications
- ✅ **Double backup**: Browser storage + downloadable file
- ✅ **Backup validation** when restoring from files
- ✅ **Confirmation dialogs** for all destructive operations

### User Control

- ✅ **No automatic deletion** - user must confirm
- ✅ **Process can be stopped** at any time
- ✅ **Progress visibility** - see exactly what's happening
- ✅ **Detailed logging** of all operations

### Error Handling

- ✅ **Network error recovery** - continues processing on failures
- ✅ **Invalid URL handling** - safely processes malformed bookmarks
- ✅ **Storage error recovery** - graceful handling of storage issues
- ✅ **Extension crash recovery** - can resume interrupted processes

## 📊 Performance Characteristics

- **Memory Usage**: Low (processes small batches)
- **Network Usage**: Minimal (HEAD requests when possible)
- **CPU Usage**: Light (3-second delays between batches)
- **Battery Impact**: Negligible (efficient async processing)

## 🔧 Troubleshooting

### Common Issues

**"Create Backup Only" not working:**
- Check if downloads are blocked in Chrome
- Ensure extension has storage permissions
- Try reloading the extension

**Background checking stops:**
- Chrome may have restarted the service worker
- Reopen the popup to check current status
- Click "Start Checking" again if needed

**Confirmation dialog not appearing:**
- If extension ran in background, reopen popup to see results
- Confirmation state is preserved when popup is reopened
- Check the log for any error messages

**Restore function not working:**
- Ensure backup file is valid JSON format
- Check file wasn't corrupted during download
- Try using a different backup file

**Some working bookmarks marked as dead:**
- Some sites block automated requests
- CORS policies may prevent proper checking
- Extension errs on the side of caution

### Performance Tips

- **Large Collections**: Extension handles thousands of bookmarks safely
- **Slow Networks**: Timeouts accommodate slower connections
- **System Resources**: Background processing is memory-efficient

### Debug Commands

Open the extension popup and press F12 to access the console, then use:

```javascript
// Clear backup data if showing incorrectly
clearBackupData()

// Access the extension instance for debugging
bookmarkChecker
```

## 📝 Customization

### Batch Processing Settings

Located in `background.js`:

```javascript
const batchSize = 3; // Bookmarks per batch
const delayBetweenBatches = 3000; // 3 seconds between batches
const timeout = 5000; // 5 seconds per bookmark
```

### UI Customization

Modify colors and styling in `popup.html` CSS section.

**⚠️ Warning**: Increasing batch size or reducing delays may cause browser instability.

## 🔒 Privacy & Security

- **No Data Collection**: Extension doesn't send data anywhere
- **Local Processing**: All checks happen on your computer
- **Open Source**: All code is visible and auditable
- **Minimal Permissions**: Only requests necessary permissions
- **No Tracking**: No analytics or user tracking

## 📋 File Structure

```text
📁 Extension Files/
├── manifest.json      # Extension configuration
├── background.js      # Background service worker
├── popup.html         # User interface layout
├── popup-js.js        # UI logic and messaging
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── readme.md         # Documentation
```

## 🔄 Version History

### v1.0 (Current)
- Initial release with core functionality
- Background service worker implementation
- Backup and restore system
- User confirmation workflow for deletions
- File-based backup import/export
- Persistent confirmation state for background processing

## 🤝 Contributing

This is an open-source project. Contributions welcome!

### Development Setup

1. Clone/download the repository
2. Load as unpacked extension in Chrome
3. Make changes to the source files
4. Reload the extension to test changes

### Potential Improvements

- Add whitelist/blacklist functionality
- Implement custom timeout settings
- Add bookmark categorization
- Create scheduling options
- Implement bookmark health scoring

## 📞 Support

### Getting Help

1. Check the popup log for error messages
2. Open Chrome DevTools (F12) and check console
3. Try restarting Chrome
4. Reload the extension
5. Test with a smaller bookmark collection

### Reporting Issues

When reporting problems, include:
- Chrome version
- Number of bookmarks
- Error messages from console
- Steps to reproduce the issue

## 📄 License

Open source - feel free to modify and distribute.

## 👨‍💻 Author

Developed by CC

---

**⚡ Pro Tip**: The extension is designed to run safely in the background. Start the checking process and continue using Chrome normally - you'll be prompted for confirmation when dead bookmarks are found!

**🔄 Backup Strategy**: Always keep multiple backup files in different locations. The extension downloads backups automatically, but manual backups are recommended for important bookmark collections.

---

**Note**: This extension requires the "bookmarks" permission to function. It only accesses your bookmarks to check their validity and does not send any data to external servers.
