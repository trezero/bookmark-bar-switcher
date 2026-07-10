# Extension Screenshots

This folder should contain screenshots of your extension for the Chrome Web Store listing.

## Required Screenshots

You need **at least 1** and up to **5** screenshots:
- **Dimensions**: 1280x800 or 640x400 pixels
- **Format**: PNG or JPEG
- **File size**: Each screenshot should be under 2MB

## Recommended Screenshots to Take

### 1. Main View - Light Mode
**Filename**: `01-main-light.png`
- Show the bookmark bars list
- Display search bar at the top
- Show multiple bar sets with different names
- Include the "Create New Bar Set" section

### 2. Main View - Dark Mode
**Filename**: `02-main-dark.png`
- Same view as above but in dark mode
- Toggle dark mode by clicking the moon/sun icon
- Shows the extension works in both themes

### 3. Active Bar Highlighted
**Filename**: `03-active-bar.png`
- Show multiple bookmark bars
- One should be clearly marked as "Active"
- Display bookmark counts and last used times

### 4. Backup Panel Open
**Filename**: `04-backup-panel.png`
- Click "Manage" button to open backup panel
- Show both Google Drive and Local Storage options
- Displays backup/restore functionality

### 5. Creating New Bar
**Filename**: `05-create-bar.png`
- Focus on "Create New Bar Set" section
- Can show the input field in action
- Or show the result after creating a new bar

## How to Capture Screenshots

### Method 1: Windows Snipping Tool
1. Load your extension in Chrome
2. Open the extension popup
3. Press `Windows Key + Shift + S`
4. Select the area to capture
5. Paste into Paint or image editor
6. Resize to 1280x800 or 640x400
7. Save as PNG

### Method 2: Chrome DevTools (Precise Dimensions)
1. Load your extension in Chrome
2. Right-click the extension popup → "Inspect"
3. In DevTools, click the device toolbar icon (or Ctrl+Shift+M)
4. Set dimensions to exactly 640x400 or 1280x800
5. Take screenshot of the popup area
6. Save as PNG

### Method 3: Screenshot Extensions
Use a Chrome screenshot extension like:
- Awesome Screenshot
- Nimbus Screenshot
- GoFullPage

## Tips for Great Screenshots

✅ **DO**:
- Use clean, realistic bookmark data (not "test1", "test2")
- Show actual features being used
- Include both light and dark mode screenshots
- Make sure text is readable
- Show the extension in action

❌ **DON'T**:
- Include personal/sensitive bookmarks or data
- Use Lorem Ipsum or obvious placeholder text
- Include browser UI (address bar, tabs) - just the popup
- Use low resolution or blurry images
- Include error states or bugs

## Example Screenshot Workflow

```bash
# 1. Build and load extension
npm run build
# Load dist/ folder at chrome://extensions/

# 2. Prepare test data
# Create 3-4 bookmark bars with descriptive names:
# - "Work Projects"
# - "Personal"
# - "Learning Resources"
# Add 5-20 bookmarks to each

# 3. Take screenshots
# Follow the 5 recommended screenshots above

# 4. Verify screenshots
# Check that they're:
# - Correct dimensions (1280x800 or 640x400)
# - Clear and readable
# - Show real features
# - Under 2MB each
```

## Checklist

Before submitting to Chrome Web Store:

- [ ] At least 1 screenshot (5 recommended)
- [ ] Dimensions are 1280x800 or 640x400
- [ ] Format is PNG or JPEG
- [ ] File size under 2MB each
- [ ] No personal/sensitive information visible
- [ ] Screenshots show actual features
- [ ] Both light and dark mode included
- [ ] Images are clear and professional-looking

## Current Screenshots

*Add your screenshots to this folder and list them here:*

1. [ ] `01-main-light.png` - Main view in light mode
2. [ ] `02-main-dark.png` - Main view in dark mode
3. [ ] `03-active-bar.png` - Active bar highlighted
4. [ ] `04-backup-panel.png` - Backup panel open
5. [ ] `05-create-bar.png` - Creating new bar

---

**Need help?** See the main publishing guide in `QUICK-START-PUBLISHING.md`
