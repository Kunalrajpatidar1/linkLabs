# 🔖 Bookmark Theme — New Tab Bookmarks Extension

A lightweight, privacy-first browser extension that transforms your new tab page into a beautiful, themeable showcase of your saved bookmarks. Pick a theme, see your links, and go — no clutter, no tracking, no distractions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Brave-lightgrey.svg)

---

## 📖 Overview

Every time you open a new tab, you're greeted with a blank page or a cluttered default. **Bookmark Theme** replaces that moment with something useful: a curated, organized grid of the bookmarks you actually care about — rendered in the theme you choose.

It's built for people who live in their browser and want their saved links front-and-center, without handing their data to a third-party service. Everything runs locally, reads only what it needs, and stores preferences on your own machine.

---

## ✨ Features

- 🎨 **Themes** — Choose from light, dark, and custom accent palettes. Your choice persists across sessions.
- 📚 **Bookmark showcase** — Automatically grids your saved bookmarks on every new tab, so your most useful links are always one click away.
- 🔍 **Instant search** — Filter bookmarks by title or folder as you type. No waiting, no page reloads.
- 🗂️ **Folder grouping** — Organize your links by bookmark folders, mirroring the structure you already use.
- ⭐ **Favorites row** — Pin your most-used links to the top for one-click access.
- ⚡ **Zero tracking** — No analytics, no telemetry, no network calls. Everything stays local in your browser.
- 🖼️ **Favicons** — Site icons appear next to each bookmark for quick visual recognition.
- 🧩 **Manifest V3** — Built on the modern Chrome extension platform.

---

## 🧩 How It Works

1. The extension requests the `bookmarks` permission to read your saved bookmarks.
2. On new-tab override, it renders a themed, searchable grid of your bookmarks.
3. Your theme choice and favorite pins are stored locally with `chrome.storage.local`.
4. Favicons are fetched via the `favicon` permission to give each link a visual identity.

No bookmark data ever leaves your browser.

---

## 🛠️ Tech Stack

- **Language:** JavaScript / TypeScript
- **Platform:** Chrome Extension Manifest V3
- **UI:** HTML + CSS (or React / Svelte / your framework of choice)
- **Storage:** `chrome.storage.local`
- **APIs:** `chrome.bookmarks`, `chrome.storage`, `chrome.tabs`

---

## 🚀 Installation (Load Unpacked)

### Chrome / Edge / Brave

1. **Clone the repo:**
   ```bash
   git clone https://github.com/your-username/bookmark-theme.git
   cd bookmark-theme
   ```

2. **Open the extensions page:**
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`

3. **Enable Developer mode** (toggle in the top-right corner).

4. **Click "Load unpacked"** and select the project folder.

5. **Open a new tab** — your bookmarks appear with your chosen theme. 🎉

> **Note:** If you change any source files, return to the extensions page and click the refresh icon on the Bookmark Theme card to reload the extension.

---

## 📦 Build

If you're working from source and want a production bundle:

```bash
npm install
npm run build      # outputs to dist/
```

Then load the `dist/` folder as an unpacked extension (see above).

### Development

```bash
npm run dev        # watch mode with hot reload (if configured)
npm run lint       # run the linter
npm test           # run the test suite
```

---

## ⚙️ Permissions

This extension requests only the permissions it needs to function:

| Permission  | Why it's needed |
|-------------|-----------------|
| `bookmarks` | Read bookmarks so they can be displayed on the new tab page |
| `storage`   | Save theme preferences and favorite pins locally |
| `favicon`   | Show site icons next to bookmarks for quick recognition |

There are **no** host permissions, no `tabs` access to page content, and no network requests. Your data stays on your device.

---

## 🎨 Customization

### Themes

Themes are defined as CSS custom properties. To add your own:

1. Open `src/themes/` (or wherever your theme definitions live).
2. Add a new theme object with `background`, `foreground`, `accent`, and `muted` colors.
3. Register it in the theme picker component.
4. Rebuild and reload the extension.

### Layout

The grid uses CSS Grid with `auto-fill` and a minimum column width. Adjust the `--grid-min-width` variable in your stylesheet to change how many bookmarks appear per row.

---

## 🗺️ Roadmap

- [ ] Drag-and-drop bookmark reordering
- [ ] Custom background images / wallpapers
- [ ] Import/export theme configurations
- [ ] Multi-browser packaging (Firefox via WebExtensions)
- [ ] Keyboard-first navigation

Have an idea? Open an issue — contributions and suggestions are welcome.

---

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how to get involved:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-new-feature`.
3. Commit your changes: `git commit -m "Add my new feature"`.
4. Push to the branch: `git push origin feature/my-new-feature`.
5. Open a pull request.

Please keep changes focused, include tests where applicable, and follow the existing code style. For larger changes, open an issue first so we can discuss the approach.

---

## 🐛 Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/your-username/bookmark-theme/issues) with:

- A clear description of the problem
- Steps to reproduce
- Your browser and OS version
- Screenshots if applicable

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Icons and emoji inspiration from the open-source community
- Built with the [Chrome Extensions documentation](https://developer.chrome.com/docs/extensions/) as a reference
- Thanks to everyone who files issues and submits pull requests

---

## 🔗 Links

- [Repository](https://github.com/your-username/bookmark-theme)
- [Issue Tracker](https://github.com/your-username/bookmark-theme/issues)
- [Chrome Web Store](#) *(coming soon)*

---

<p align="center">Made with ❤️ for people who love their bookmarks.</p>
