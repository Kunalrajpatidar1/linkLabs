Here's a ready-to-use README you can drop into your repo — just swap the placeholders (name, description, links) for your own:

```markdown
# 🔖 Bookmark Theme — New Tab Bookmarks Extension

A lightweight browser extension that turns your new tab page into a beautiful,
themeable showcase of your saved bookmarks. Pick a theme, see your links, go.

## ✨ Features

- 🎨 **Themes** — light, dark, and custom accent palettes
- 📚 **Bookmark showcase** — auto-grids your saved bookmarks on every new tab
- 🔍 **Instant search** — filter bookmarks by title or folder as you type
- 🗂️ **Folder grouping** — organize by bookmark folders
- ⭐ **Favorites row** — pin your most-used links to the top
- ⚡ **Zero tracking** — everything stays local in your browser

## 🧩 How It Works

1. The extension reads your bookmarks via the `bookmarks` permission.
2. On new-tab override, it renders a themed grid of your bookmarks.
3. Your theme choice is stored with `chrome.storage.local`.

## 🛠️ Tech Stack

- JavaScript / TypeScript
- Chrome Extension Manifest V3
- HTML + CSS (or React/Svelte/etc.)

## 🚀 Installation (Load Unpacked)

### Chrome / Edge / Brave

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/bookmark-theme.git
   cd bookmark-theme
   ```
2. Open `chrome://extensions` (or `brave://extensions`).
3. Toggle **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Open a new tab — your bookmarks appear with your chosen theme. 🎉

## 📦 Build

```bash
npm install
npm run build      # outputs to dist/
```

## ⚙️ Permissions

| Permission | Why |
|------------|-----|
| `bookmarks` | Read bookmarks to display them |
| `storage` | Save theme preferences locally |
| `favicon` | Show site icons next to bookmarks |

