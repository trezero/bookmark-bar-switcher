# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bookmark Bar Switcher is a Chrome Manifest V3 browser extension built with Vue 3, TypeScript, and Bootstrap Vue Next. It lets users switch between multiple bookmark bars via a popup UI or keyboard shortcuts. Supports Chrome and Opera (with workspace-aware storage for Opera).

## Commands

```bash
npm run build          # Type-check (vue-tsc) then Vite build
npm run dev            # Vite dev server with hot reload
npm run watch          # Watch mode build (no minification)
npm run lint           # ESLint on src/ and __tests__/
npm test               # Vitest single run
npm run test:watch     # Vitest watch mode
npm run test:build     # Build then run tests
```

To load the extension during development: build or run dev, then load the `dist/` folder as an unpacked extension at `chrome://extensions/`.

## Architecture

### Extension layers

```
Popup UI (Vue 3)  -->  Background Service Worker  -->  Chrome APIs
src/popup/             src/background/                 (bookmarks, storage, commands)
src/components/
```

### Background service worker (`src/background/`)

- **main.ts** - Entry point; registers all Chrome event listeners (onInstalled, bookmark events, commands, Opera workspace events)
- **handlers.ts** - Event handler implementations; includes debounced shortcut handling and Opera workspace switching
- **service.ts** - Core business logic: `exchangeBars()`, `createBar()`, `renameBar()`, `reorderBars()`, `removeBar()`
- **storage.ts** - `chrome.storage.local` wrapper with Opera workspace-aware active bar tracking
- **util.ts** - Helpers for bookmark folder lookups, bookmark moves, Opera detection, custom directory management

### Popup UI (`src/popup/` and `src/components/`)

Component tree: `App.vue` > `BookmarksBars.vue` > `Bar.vue` / `Edit.vue`, plus `Create.vue`. BookmarksBars is the main container handling drag-and-drop reordering, bar switching, and deletion confirmation.

### Key data flow

Bar switching: user action -> `exchangeBars(activatedId, deactivatedId)` -> moves bookmarks between system bookmarks bar and custom folders -> `updateActiveBar()` writes to `chrome.storage.local` -> `storage.onChanged` listener updates popup UI.

### Types (`src/types/bookmarks.d.ts`)

`BookmarksBar` (base) -> `BookmarksBarOpera` (adds workspaceId) -> `BookmarksBarPopup` (adds isActive, isEdited for UI state). Also `RemoveCandidate` and `OperaTab`.

### Manifest generation (`src/manifest.ts`)

Dynamically generates Manifest V3 from package.json metadata. Declares permissions `bookmarks` and `storage`. Registers keyboard commands: `next-bar` (Ctrl+Down), `previous-bar` (Ctrl+Up), `switch-to-1` through `switch-to-10` (Ctrl+Shift+N).

## Code Conventions

### Formatting (Prettier)

- Single quotes, trailing commas, semicolons required
- Tab width: 2 for Vue/YAML, 4 for TypeScript/JavaScript files

### Linting (ESLint)

Extremely strict configuration. Key constraints:
- Max 60 lines per function, max 25 statements
- Max line length 120 (ignoring comments, strings, URLs)
- Strict TypeScript checking (`@typescript-eslint/strict-type-checked` + `stylistic-type-checked`)
- `unicorn/all`, `sonarjs/recommended`, `promise/recommended` enforced
- `eqeqeq`, `curly: all`, `no-param-reassign`, `prefer-destructuring`, `prefer-template` required
- Catch variables must be named `err`
- `import/consistent-type-specifier-style: prefer-inline`

### TypeScript

- Path alias: `~/` maps to `src/`
- Target: ESNext, Module: NodeNext
- All dependencies are devDependencies (extension is bundled by Vite)

## Testing

E2E tests in `__tests__/popup.test.ts` using Puppeteer to load the extension in a real browser. Test helpers in `__tests__/helpers.ts` generate fake bookmarks with `@faker-js/faker`. CI runs tests against both Chrome and Opera on Ubuntu.

## Build

Vite with `vite-plugin-web-extension` for manifest handling and `unplugin-vue-components` for auto-importing Bootstrap Vue components. Output goes to `dist/`.
