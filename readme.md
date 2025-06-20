# 🔗 Bookmark Dead Link Checker

A powerful Chrome extension that automatically detects and removes dead bookmarks while running persistently in the background. Features comprehensive backup and restore capabilities to keep your bookmarks safe.

## ✨ Key Features

- 🔄 **Background Processing**: Runs continuously even when popup is closed
- 🛡️ **Automatic Backup**: Creates backup before any modifications
- 📁 **Flexible Restore**: Restore from any backup file (local or downloaded)
- 🔍 **Smart Detection**: Optimized URL checking with minimal resource usage
- � **Performance Optimized**: Processes bookmarks in small batches to prevent crashes
- 📊 **Real-time Progress**: Live progress tracking and detailed logging
- ⏹️ **User Control**: Start, stop, and monitor the process anytime
- 📈 **Comprehensive Stats**: Tracks checked, dead, and removed bookmarks
- � **Dual Backup**: Stored locally + downloadable JSON file

## 🚀 Installation

### Load as Unpacked Extension

1. **Prepare the Files**: Ensure you have all required files in one folder:

   ```
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
4. **Close the popup** - checking continues in the background
5. **Reopen anytime** - see real-time progress and results

### Detailed Workflow

#### 🔍 Starting a Check

- Click **"Start Checking"**
- If no backup exists, one is created automatically
- Process runs in the background (safe to close popup)
- Progress updates appear when popup is open

#### 📦 Manual Backup

- Click **"Create Backup Only"** to backup without checking
- Backup is stored in Chrome + downloaded as JSON file
- Use this before making manual bookmark changes

#### 🔄 Restoring Bookmarks

- Click **"Restore Backup"** to select a backup file
- Choose from downloaded backup files or shared backups
- Confirms file selection before restoration
- Completely replaces current bookmarks

#### ⏹️ Stopping the Process

- Click **"Stop"** to halt checking at any time
- Safe to stop - no data loss or corruption
- Partial results are preserved

## 🛡️ Safety & Reliability

### Background Processing

- **Persistent Operation**: Continues even when popup is closed
- **Service Worker**: Runs in Chrome's background service
- **Memory Efficient**: Optimized for long-running processes
- **Resume-Aware**: Shows current status when popup reopens

### Backup System

- **Pre-Check Backup**: Automatic backup before any modifications
- **File-Based Restore**: Restore from any backup file you choose
- **Format Validation**: Validates backup file integrity
- **Complete Restoration**: Preserves folder structure and organization

### Rate Limiting

- **Small Batches**: Processes 3 bookmarks at a time (background mode)
- **Intelligent Delays**: 3-second delays between batches
- **Timeout Protection**: 5-second timeout per bookmark
- **Request Optimization**: Minimized resource loading

## 🔧 Technical Details

### URL Checking Process

1. **HEAD Request**: Fast initial check with minimal data transfer
2. **GET Fallback**: Fallback method for sites that block HEAD requests
3. **Request Cancellation**: Proper cleanup to prevent resource leaks
4. **Error Handling**: Graceful handling of network issues

### Architecture

- **Background Script**: Handles all bookmark processing
- **Popup Script**: Manages UI and user interactions
- **Message Passing**: Real-time communication between components
- **Chrome Storage**: Persistent backup and state management

### Permissions

- `bookmarks` - Read and modify bookmark data
- `storage` - Store backups and extension state
- `downloads` - Download backup files
- `activeTab` - Minimal tab access
- `http://*/*`, `https://*/*` - Check bookmark URLs

## 📊 User Interface

### Statistics Display

- **Total Bookmarks**: Your complete bookmark count
- **Checked**: Bookmarks processed so far
- **Dead Links**: Bookmarks that failed checks
- **Removed**: Dead bookmarks automatically removed
- **Backup Status**: Current backup availability

### Progress Tracking

- **Progress Bar**: Visual progress indicator
- **Real-time Updates**: Live status updates during processing
- **Detailed Logging**: Complete activity log with timestamps
- **Color-coded Messages**: Easy-to-read status indicators

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

```
📁 Extension Files/
├── 📄 manifest.json      # Extension configuration
├── 📄 popup.html         # User interface
├── 📄 popup-js.js        # UI logic and communication
├── 📄 background.js      # Background processing
└── 📄 readme.md          # This documentation
```

## 🤝 Contributing

### Potential Improvements

- Add whitelist/blacklist functionality
- Implement custom timeout settings
- Add bookmark categorization
- Create scheduling options
- Implement bookmark health scoring

### Development

1. Fork the project
2. Make your changes
3. Test thoroughly with various bookmark collections
4. Submit pull request with detailed description

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

This project is open source. Feel free to use, modify, and distribute.

---

**⚡ Pro Tip**: The extension is designed to run safely in the background. Start the checking process and continue using Chrome normally - you'll get a notification when it's complete!

**🔄 Backup Strategy**: Always keep multiple backup files in different locations. The extension downloads backups automatically, but manual backups are recommended for important bookmark collections.

---

*Developed by CC - Keeping your bookmarks clean and organized* 🚀
