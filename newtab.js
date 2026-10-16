const lumiListModules = window.LumiListModules || {};
if (!lumiListModules.coreUtils || !lumiListModules.feedback)
  throw new Error(
    "LumiList shared runtime modules failed to load before newtab.js",
  );
const featureFactories = lumiListModules.features || {},
  {
    generateId,
    normalizeSupabaseUserId,
    safeParseInt,
    validateColumnIndex,
    escapeHTML,
    isUnsafeUrl,
    sanitizeUrl,
    normalizeUrlForDedup,
    normalizeBooleanValue,
    getCurrentTimestamp,
    escapeHtml,
  } = lumiListModules.coreUtils,
  { updateLoadingMessage, showGlassToast, showGlassConfirm } =
    lumiListModules.feedback;
let currentLumiListLocale = "en";
const DELETE_ACCOUNT_CONFIRMATION_TOKEN = "DELETE";
function isDeleteAccountConfirmationValid(e) {
  return "DELETE" === String(e || "").trim();
}
function getLumiListLocalization() {
  return window.LumiListLocalization || null;
}
function llT(e, t = {}) {
  const r = getLumiListLocalization();
  return r && "function" == typeof r.t ? r.t(e, t) : e;
}
function llLiteral(e) {
  const t = getLumiListLocalization();
  return t && "function" == typeof t.translateLiteral
    ? t.translateLiteral(e)
    : e;
}
function llNumber(e) {
  const t = Number(e);
  if (!Number.isFinite(t)) return String(e ?? "");
  try {
    return t.toLocaleString(currentLumiListLocale || void 0);
  } catch (e) {
    return t.toLocaleString();
  }
}
async function initLumiListLocalization() {
  const e = getLumiListLocalization();
  if (!e || "function" != typeof e.initExtensionLocalization) return;
  const t = await e.initExtensionLocalization(document);
  ((currentLumiListLocale = t?.locale || e.getActiveLocale?.() || "en"),
    (document.title = llLiteral(`${llT("app.name")} - Smart Bookmark Manager`)),
    populateSettingsLanguageOptions());
}
function applyLumiListLocalization() {
  const e = getLumiListLocalization();
  e &&
    "function" == typeof e.applyLocalization &&
    (e.applyLocalization(document),
    (currentLumiListLocale = e.getActiveLocale?.() || currentLumiListLocale),
    (document.title = llLiteral(`${llT("app.name")} - Smart Bookmark Manager`)),
    populateSettingsLanguageOptions());
}
function refreshLocalizedDynamicSurfaces() {
  try {
    (window.LumiListIndiaPricing?.renderExpired(window.subscriptionData),
      window.LumiListIndiaPricing?.renderBanner(window.subscriptionData),
      "function" == typeof updateSelectionCount && updateSelectionCount(),
      "function" == typeof refreshSearchIfOpen &&
        refreshSearchIfOpen().catch((e) => {
          console.error("Failed to refresh localized search overlay:", e);
        }));
    const e = document.getElementById("trashModal");
    e &&
      e.classList.contains("active") &&
      "function" == typeof refreshTrashModal &&
      refreshTrashModal().catch((e) => {
        console.error("Failed to refresh localized trash modal:", e);
      });
    const t = document.getElementById("wallpaperPopup");
    (t &&
      t.classList.contains("active") &&
      "function" == typeof renderWallpaperPopup &&
      renderWallpaperPopup({ preserveScroll: !0 }),
      refreshChromeImportLocalizedLabels(),
      refreshImportLinksLocalizedLabels());
  } catch (e) {
    console.error("Failed to refresh localized dynamic UI:", e);
  }
}
function populateSettingsLanguageOptions() {
  const e = getLumiListLocalization(),
    t = document.getElementById("settingsLanguageOptions");
  if (!e || !t || "function" != typeof e.getLanguageOptions) return;
  const r = document.getElementById("settingsLanguageSearch"),
    a = document.getElementById("settingsLanguageEmpty"),
    o = String(r?.value || "")
      .trim()
      .toLowerCase(),
    n =
      "function" == typeof e.getActivePreference
        ? e.getActivePreference()
        : "auto",
    i = e.getLanguageOptions().filter(
      (e) =>
        !o ||
        [e.label, e.englishLabel, e.romanLabel, e.description, e.value].some(
          (e) =>
            String(e || "")
              .toLowerCase()
              .includes(o),
        ),
    );
  ((t.innerHTML = ""),
    i.forEach((e) => {
      const r = document.createElement("button"),
        a = e.value === (n || "auto");
      ((r.type = "button"),
        (r.className = "settings-language-option" + (a ? " is-active" : "")),
        (r.dataset.languageValue = e.value),
        r.setAttribute("role", "radio"),
        r.setAttribute("aria-checked", a ? "true" : "false"));
      const o = document.createElement("span");
      o.className = "settings-language-option-text";
      const i = document.createElement("span");
      i.className = "settings-language-option-label-row";
      const s = document.createElement("span");
      ((s.className = "settings-language-option-label"),
        (s.textContent = e.label),
        i.appendChild(s));
      const l = [];
      if (
        (e.englishLabel && e.englishLabel !== e.label && l.push(e.englishLabel),
        e.romanLabel &&
          e.romanLabel !== e.label &&
          e.romanLabel !== e.englishLabel &&
          l.push(e.romanLabel),
        e.description && l.push(e.description),
        l.length > 0)
      ) {
        const e = document.createElement("span");
        ((e.className = "settings-language-option-meta"),
          (e.textContent = l.join(" \xb7 ")),
          i.appendChild(e));
      }
      (o.appendChild(i), r.appendChild(o));
      const c = document.createElement("span");
      ((c.className = "settings-language-option-check"),
        c.setAttribute("aria-hidden", "true"),
        r.appendChild(c),
        t.appendChild(r));
    }),
    a && a.classList.toggle("hidden", i.length > 0));
}
async function setSettingsLanguagePreference(e) {
  const t = getLumiListLocalization();
  if (!t || "function" != typeof t.setStoredLanguagePreference) return;
  const r = await t.setStoredLanguagePreference(e || "auto"),
    a = t.resolveLocalePreference(r);
  (t.setActiveLocale(a, r),
    applyLumiListLocalization(),
    refreshLocalizedDynamicSurfaces(),
    refreshSettingsQuickSaveControls().catch((e) => {
      console.error(
        "Failed to refresh localized quick save settings controls:",
        e,
      );
    }),
    "function" == typeof updateSettingsSubscriptionDisplay &&
      updateSettingsSubscriptionDisplay().catch((e) => {
        console.error("Failed to refresh localized subscription settings:", e);
      }),
    showGlassToast(llT("language.saved"), "success"));
}
async function handleSettingsLanguageOptionClick(e) {
  const t = e.target.closest(".settings-language-option");
  t && (await setSettingsLanguagePreference(t.dataset.languageValue || "auto"));
}
function addLanguageParamToWebsiteUrl(e) {
  const t = getLumiListLocalization(),
    r = t?.getActiveLocale?.() || currentLumiListLocale,
    a = t?.normalizeLocale?.(r) || r;
  if (!a) return e;
  try {
    const t = e instanceof URL ? e : new URL(e);
    return (t.searchParams.set("lang", a), t);
  } catch (t) {
    return e;
  }
}
const db = new Dexie("BookmarkManager"),
  UNDO_REDO_HISTORY_STATE_ID = "main",
  UNDO_REDO_HISTORY_MAX_DEPTH_DEFAULT = 200,
  SYNC_QUEUE_CAPACITY_LIMIT = 12e4,
  UNDO_REDO_SYNC_QUEUE_LIMIT = 1e3,
  UNDO_REDO_SYNC_CHUNK_SIZE = 250,
  SESSION_INVALIDATION_STORAGE_KEY = "lumilist_session_invalidated",
  FLOATING_CONTROL_POPUP_GAP_PX = 14,
  FLOATING_CONTROL_POPUP_MARGIN_PX = 16;
(db
  .version(20)
  .stores({
    pages:
      "id, name, order, createdAt, isDefault, deletedAt, updatedAt, shareId",
    boards:
      "id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt, shareId",
    bookmarks:
      "id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
    favicons: "id, data, url, timestamp",
    syncQueue:
      "++id, operation, tableName, recordId, timestamp, status, retryCount",
    historyEntries: "id, seq, createdAt, kind, label, origin, groupId",
    historyState: "id, cursorSeq, headSeq, maxDepth",
    installedWallpapers:
      "&id, theme, remoteId, updatedAt, installedAt, archivedAt",
    affiliatePickCache: "&cacheKey, userId, country, cacheVersion, fetchedAt",
  })
  .upgrade(async (e) => {
    const t = e.table("historyState");
    (await t.get("main")) ||
      (await t.put({ id: "main", cursorSeq: 0, headSeq: 0, maxDepth: 200 }));
  }),
  db
    .version(19)
    .stores({
      pages:
        "id, name, order, createdAt, isDefault, deletedAt, updatedAt, shareId",
      boards:
        "id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt, shareId",
      bookmarks:
        "id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, data, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
      historyEntries: "id, seq, createdAt, kind, label, origin, groupId",
      historyState: "id, cursorSeq, headSeq, maxDepth",
      installedWallpapers:
        "&id, theme, remoteId, updatedAt, installedAt, archivedAt",
    })
    .upgrade(async (e) => {
      const t = e.table("historyState");
      (await t.get("main")) ||
        (await t.put({ id: "main", cursorSeq: 0, headSeq: 0, maxDepth: 200 }));
    }),
  db
    .version(18)
    .stores({
      pages:
        "id, name, order, createdAt, isDefault, deletedAt, updatedAt, shareId",
      boards:
        "id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt, shareId",
      bookmarks:
        "id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, data, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
      historyEntries: "id, seq, createdAt, kind, label, origin, groupId",
      historyState: "id, cursorSeq, headSeq, maxDepth",
      installedWallpapers: "&id, theme, remoteId, updatedAt, installedAt",
    })
    .upgrade(async (e) => {
      const t = e.table("historyState");
      (await t.get("main")) ||
        (await t.put({ id: "main", cursorSeq: 0, headSeq: 0, maxDepth: 200 }));
    }),
  db
    .version(17)
    .stores({
      pages:
        "id, name, order, createdAt, isDefault, deletedAt, updatedAt, shareId",
      boards:
        "id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt, shareId",
      bookmarks:
        "id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, data, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
      historyEntries: "id, seq, createdAt, kind, label, origin, groupId",
      historyState: "id, cursorSeq, headSeq, maxDepth",
    })
    .upgrade(async (e) => {
      const t = e.table("historyState");
      (await t.get("main")) ||
        (await t.put({ id: "main", cursorSeq: 0, headSeq: 0, maxDepth: 200 }));
    }),
  db
    .version(16)
    .stores({
      pages:
        "id, name, order, createdAt, isDefault, deletedAt, updatedAt, shareId",
      boards:
        "id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt, shareId",
      bookmarks:
        "id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, data, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
    }),
  db
    .version(15)
    .stores({
      pages:
        "id, name, order, createdAt, isDefault, deletedAt, updatedAt, shareId",
      boards:
        "id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt, shareId",
      bookmarks:
        "id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, hostname, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
    })
    .upgrade(async (e) => {
      const t = new Map(),
        r = new Map(),
        a = await e.table("pages").toArray();
      for (const r of a) {
        const a = r.id,
          o = generateId();
        (t.set(a, o),
          await e.table("pages").delete(a),
          await e.table("pages").add({ ...r, id: o }));
      }
      const o = await e.table("boards").toArray();
      for (const a of o) {
        const o = a.id,
          n = generateId(),
          i = t.get(a.pageId) || a.pageId;
        (r.set(o, n),
          await e.table("boards").delete(o),
          await e.table("boards").add({ ...a, id: n, pageId: i }));
      }
      const n = await e.table("bookmarks").toArray();
      for (const t of n) {
        const a = t.id,
          o = generateId(),
          n = r.get(t.boardId) || t.boardId;
        (await e.table("bookmarks").delete(a),
          await e.table("bookmarks").add({ ...t, id: o, boardId: n }));
      }
      try {
        await e.table("idMappings").clear();
      } catch (e) {}
      await e.table("syncQueue").clear();
    }),
  db
    .version(14)
    .stores({
      pages:
        "++id, name, order, createdAt, isDefault, deletedAt, updatedAt, shareId",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt, shareId",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, hostname, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
      idMappings:
        "[tableName+localId], tableName, localId, serverId, createdAt",
    }),
  db
    .version(13)
    .stores({
      pages:
        "++id, name, order, createdAt, isDefault, deletedAt, updatedAt, shareId",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt, shareId",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, hostname, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
    }),
  db
    .version(12)
    .stores({
      pages: "++id, name, order, createdAt, isDefault, deletedAt, updatedAt",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, hostname, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
    }),
  db
    .version(11)
    .stores({
      pages:
        "++id, name, order, createdAt, isDefault, isPrivate, passcodeHash, encryptionSalt, encryptedKeyBackup, recoveryKeyId, deletedAt, updatedAt",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt, updatedAt",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt, updatedAt",
      favicons: "id, hostname, url, timestamp",
      syncQueue:
        "++id, operation, tableName, recordId, timestamp, status, retryCount",
    }),
  db
    .version(10)
    .stores({
      pages:
        "++id, name, order, createdAt, isDefault, isPrivate, passcodeHash, encryptionSalt, encryptedKeyBackup, recoveryKeyId, deletedAt",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt",
      favicons: "id, hostname, url, timestamp",
    }),
  db
    .version(9)
    .stores({
      pages: "++id, name, order, createdAt, isDefault, deletedAt",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt",
      favicons: "id, hostname, url, timestamp",
    }),
  db
    .version(8)
    .stores({
      pages:
        "++id, name, order, createdAt, isDefault, isPrivate, passcodeHash, encryptionSalt, encryptedKeyBackup, deletedAt",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt",
      favicons: "id, hostname, url, timestamp",
    }),
  db
    .version(7)
    .stores({
      pages:
        "++id, name, order, createdAt, isDefault, isPrivate, passcodeHash, encryptionSalt, deletedAt",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt",
      favicons: "id, hostname, url, timestamp",
    }),
  db
    .version(6)
    .stores({
      pages:
        "++id, name, order, createdAt, isDefault, isPrivate, passcodeHash, deletedAt",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order], deletedAt",
      bookmarks:
        "++id, boardId, title, url, description, order, createdAt, deletedAt",
      favicons: "id, hostname, url, timestamp",
    }),
  db
    .version(5)
    .stores({
      pages: "++id, name, order, createdAt, isDefault, isPrivate, passcodeHash",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order]",
      bookmarks: "++id, boardId, title, url, description, order, createdAt",
      favicons: "id, hostname, url, timestamp",
    }),
  db
    .version(4)
    .stores({
      pages: "++id, name, order, createdAt, isDefault",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order]",
      bookmarks: "++id, boardId, title, url, description, order, createdAt",
      favicons: "id, hostname, url, timestamp",
    }),
  db
    .version(3)
    .stores({
      pages: "++id, name, order, createdAt, isDefault",
      boards:
        "++id, pageId, name, columnIndex, order, createdAt, [pageId+columnIndex+order]",
      bookmarks: "++id, boardId, title, url, description, order, createdAt",
    }),
  db
    .version(2)
    .stores({
      boards: "++id, name, columnIndex, order, createdAt, [columnIndex+order]",
      bookmarks: "++id, boardId, title, url, description, order, createdAt",
    }),
  db.on("blocked", () => {
    (console.warn(
      "Database upgrade blocked - please close other LumiList tabs",
    ),
      alert(
        llLiteral(
          "LumiList needs to update its database. Please close other LumiList tabs and refresh this page.",
        ),
      ));
  }),
  db.on("versionchange", (e) => {
    (db.close(),
      alert(
        llLiteral(
          "LumiList has been updated in another tab. This page will now refresh.",
        ),
      ),
      window.location.reload());
  }));
let currentPageId = null,
  currentPageToRename = null,
  pageTabsSortableInstance = null,
  privacyModeEnabled = !1,
  incognitoModeEnabled = !1,
  compactModeEnabled = !1,
  floatingControlsCollapsedEnabled = !1,
  showBookmarkNotes = !0,
  closeTabsAfterSaveAllTabsEnabled = !1,
  largeBoardCollapseEnabled = !1;
const LARGE_BOARD_VISIBLE_LIMIT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50],
  LARGE_BOARD_VISIBLE_LIMIT_DEFAULT = 10,
  LARGE_BOARD_VISIBLE_LIMIT_STORAGE_KEY = "largeBoardVisibleBookmarkLimit";
let largeBoardVisibleBookmarkLimit = 10;
const LARGE_BOARD_EXPANDED_IDS_STORAGE_KEY = "largeBoardExpandedBoardIds",
  expandedLargeBoardIds = new Set();
let themeMode = "dark";
const WALLPAPER_STORAGE_KEY = "wallpaperSelectionByTheme",
  WALLPAPER_LOCAL_CACHE_KEY = "lumilist_wallpaper_selection",
  WALLPAPER_STYLE_LOCAL_CACHE_KEY = "lumilist_wallpaper_style_by_theme",
  WALLPAPER_BINARY_CACHE_LOCAL_KEY = "lumilist_wallpaper_binary_cache_v1",
  WALLPAPER_BOOT_STYLE_CACHE_PREFIX = "lumilist_wallpaper_boot_style_",
  WALLPAPER_BOOT_BINARY_CACHE_PREFIX = "lumilist_wallpaper_boot_binary_",
  WALLPAPER_BOOT_SOURCE_CACHE_PREFIX = "lumilist_wallpaper_boot_source_",
  WALLPAPER_BOOT_AUTH_HINT_LOCAL_KEY = "lumilist_wallpaper_boot_auth_hint_v1",
  WALLPAPER_LOGGED_OUT_DEFAULT_SNAPSHOT_LOCAL_KEY =
    "lumilist_logged_out_default_visual_v1",
  WALLPAPER_ACCOUNT_LOCAL_STATE_STORAGE_KEY = "wallpaperLocalStateByUser",
  WALLPAPER_CLOUD_SYNC_STATE_STORAGE_KEY = "wallpaperCloudSyncState",
  WALLPAPER_PENDING_HANDOFF_STORAGE_KEY =
    "lumilist_pending_wallpaper_handoff_v1",
  WALLPAPER_NEW_USER_DEFAULT_SEED_STORAGE_KEY =
    "lumilist_pending_new_user_wallpaper_default_seed_v1",
  WALLPAPER_DIAGNOSTICS_LOCAL_KEY = "lumilist_wallpaper_diagnostics_v1",
  WALLPAPER_DIAGNOSTICS_MAX_EVENTS = 60,
  WALLPAPER_RUNTIME_ROLLOUT_FLAGS = Object.freeze({
    explicitRemoteGallery: !0,
    localInstallOnDemand: !0,
    hostedStartupMergeDisabled: !0,
    cloudPreferenceSync: !0,
    diagnosticsEnabled: !0,
  }),
  WALLPAPER_DIAGNOSTIC_COUNTER_KEYS = Object.freeze([
    "hostedCatalogRequests",
    "hostedCatalogFailures",
    "galleryManifestRequests",
    "galleryManifestFailures",
    "installDownloads",
    "installFailures",
    "migrationAttempts",
    "migrationFailures",
    "bootFallbackUses",
  ]),
  WALLPAPER_SYNC_METADATA_RECORD_ID = "wallpaper_preferences",
  INSTALLED_WALLPAPER_CATALOG_VERSION_STORAGE_KEY =
    "installedWallpaperCatalogVersion",
  INSTALLED_WALLPAPER_SOURCE_PREFIX = "lumilist-installed://",
  LOCAL_USER_WALLPAPER_SOURCE_TYPE = "user-upload",
  WALLPAPER_CATALOG_PATH = "wallpaper/catalog.json",
  WALLPAPER_REMOTE_CATALOG_URL =
    "https://xbccmcszhnybxzlirjgk.supabase.co/storage/v1/object/public/wallpaper/catalog.json",
  WALLPAPER_REMOTE_GALLERY_URL =
    "https://xbccmcszhnybxzlirjgk.supabase.co/storage/v1/object/public/wallpaper/gallery.json",
  WALLPAPER_REMOTE_STORAGE_PREFIX =
    "https://xbccmcszhnybxzlirjgk.supabase.co/storage/v1/object/public/wallpaper/",
  WALLPAPER_FILE_PATTERN = /\.(?:jpg|jpeg|png|webp|avif)$/i,
  WALLPAPER_URL_PARAM = "wallpaper",
  WALLPAPER_GALLERY_ID_URL_PARAM = "wallpaperGalleryId",
  WALLPAPER_THEME_URL_PARAM = "wallpaperTheme",
  DEFAULT_WALLPAPER_TILE_ID = "__default__",
  DEFAULT_WALLPAPER_THEME_STYLES = {
    dark: {
      primary: "#05E57B",
      activeTextColor: "#1A1F2E",
      tabHoverTextColor: "#D5DEE8",
      inactiveTabTextColor: "#B8C5D1",
      boardTextColor: "#B8C5D1",
      linkDescriptionTextColor: "#8A9AAA",
      iconColor: "#B8C5D1",
      tabArrowColor: "#B8C5D1",
      addBoardColor: "#2DFFB1",
      boardBackgroundColor: "#292E3D",
      boardBackgroundOpacity: 0.5,
      boardBackdropBlur: 16,
      boardBackdropSaturate: 120,
      inactiveControlColor: "#3A4652",
      inactiveControlOpacity: 0.6,
      inactiveControlBackdropBlur: 12,
      inactiveControlBackdropSaturate: 120,
      popupBackgroundColor: "#282C34",
      popupBackgroundOpacity: 0.92,
      popupCardBackgroundColor: "#FFFFFF",
      popupCardBackgroundOpacity: 0.05,
      dropdownBackgroundColor: "#3E455B",
      dropdownBackgroundOpacity: 0.9,
      overlay: {
        angle: 180,
        topColor: "#212531",
        topOpacity: 0.58,
        bottomColor: "#212531",
        bottomOpacity: 0.76,
      },
    },
    light: {
      primary: "#00B868",
      activeTextColor: "#F4FBF8",
      tabHoverTextColor: "#F4FBF8",
      inactiveTabTextColor: "#273D57",
      boardTextColor: "#273D57",
      linkDescriptionTextColor: "#607892",
      iconColor: "#273D57",
      tabArrowColor: "#273D57",
      addBoardColor: "#00D97A",
      boardBackgroundColor: "#FFFFFF",
      boardBackgroundOpacity: 0.38,
      boardBackdropBlur: 16,
      boardBackdropSaturate: 120,
      inactiveControlColor: "#F3F0FF",
      inactiveControlOpacity: 0.45,
      inactiveControlBackdropBlur: 12,
      inactiveControlBackdropSaturate: 120,
      popupBackgroundColor: "#FFFFFF",
      popupBackgroundOpacity: 0.94,
      popupCardBackgroundColor: "#FFFFFF",
      popupCardBackgroundOpacity: 0.95,
      dropdownBackgroundColor: "#FFFFFF",
      dropdownBackgroundOpacity: 0.92,
      overlay: {
        angle: 180,
        topColor: "#F5F4F0",
        topOpacity: 0.18,
        bottomColor: "#F5F4F0",
        bottomOpacity: 0.34,
      },
    },
  };
let bundledWallpaperCatalogByTheme = { dark: [], light: [] },
  installedWallpaperCatalogByTheme = { dark: [], light: [] },
  wallpaperCatalogByTheme = { dark: [], light: [] },
  wallpaperSelectionByTheme = { dark: null, light: null },
  wallpaperThemeDefaults = createEmptyWallpaperThemeDefaults(),
  wallpaperStyleOverridesByTheme = createEmptyWallpaperStyleOverrideState(),
  wallpaperNewUserDefaultConfig = createEmptyNewUserWallpaperDefaultConfig(),
  hostedWallpaperCatalogPromise = null,
  hostedWallpaperGalleryPromise = null,
  installedWallpaperRecordsByRef = new Map(),
  installedWallpaperObjectUrlsByRef = new Map(),
  installedWallpaperCatalogVersion = null,
  wallpaperCloudSyncState = null,
  wallpaperAccountScopeUserId = null,
  wallpaperPreferenceSyncReadyUserId = null,
  wallpaperPreferenceSyncPending = !1,
  wallpaperPreferencesInitialized = !1,
  wallpaperCloudSyncApplyChain = Promise.resolve(),
  wallpaperLastAppliedCloudSyncFingerprint = null;
const pendingWallpaperCloudSyncFingerprints = new Set();
let pendingLoggedOutThemeResetPromise = null;
const QUICK_SAVE_COMMAND_NAME = "quick-save",
  SHORTCUTS_SETTINGS_URL = "chrome://extensions/shortcuts",
  EXTENSIONS_SETTINGS_URL = "chrome://extensions",
  SYNC_USER_STORAGE_KEY = "lumilist_user",
  SYNC_SESSION_INVALIDATED_STORAGE_KEY = "lumilist_session_invalidated",
  LOGIN_SYNC_STATE_STORAGE_KEY = "lumilist_login_sync_state",
  WORKSPACE_OWNER_CHECKPOINT_STORAGE_KEY = "lumilist_last_delta_sync",
  LOGIN_SYNC_PENDING_MAX_AGE_MS = 45e3,
  LOGIN_SYNC_FUTURE_SKEW_MS = 3e4,
  LOGIN_SYNC_STATE_APPEAR_GRACE_MS = 2e3,
  LOGIN_SYNC_MONITOR_INTERVAL_MS = 5e3,
  SHOW_BOOKMARK_NOTES_STORAGE_KEY = "showBookmarkNotes",
  CLOSE_TABS_AFTER_SAVE_ALL_STORAGE_KEY = "closeTabsAfterSaveAllTabs",
  FLOATING_CONTROLS_COLLAPSED_STORAGE_KEY = "floatingControlsCollapsedEnabled",
  STARTUP_STORAGE_KEYS = Object.freeze([
    "lumilist_user",
    "lumilist_session_invalidated",
    "lumilist_login_sync_state",
    "lumilist_last_delta_sync",
    "wallpaperLocalStateByUser",
    "wallpaperCloudSyncState",
    WALLPAPER_STORAGE_KEY,
    "themeMode",
    "initialized",
    "currentPageId",
    "privacyModeEnabled",
    "incognitoModeEnabled",
    "compactModeEnabled",
    "truncateTitles",
    "openInNewTab",
    "showBookmarkNotes",
    "closeTabsAfterSaveAllTabs",
    "floatingControlsCollapsedEnabled",
    "largeBoardCollapseEnabled",
    "largeBoardVisibleBookmarkLimit",
    "largeBoardExpandedBoardIds",
  ]),
  BOOKMARK_DESCRIPTION_MAX_LENGTH = 2e3,
  searchState = {
    isOpen: !1,
    query: "",
    scope: "all",
    matchMode: "smart",
    dataset: [],
    keyboardItems: [],
    activeItemIndex: -1,
    behavior: { boards: {}, bookmarks: {} },
  };
let initialAuthCompleted = !1;
const USE_IDIOMORPH = !0;
let isCurrentTabAuthenticating = !1;
window.isCurrentTabAuthenticating = !1;
let isLogoutInProgress = !1;
window.isLumiListLogoutInProgress = !1;
let isInitialLoadComplete = !1;
const WORKSPACE_STARTUP_INDICATOR_DELAY_MS = 180;
let workspaceStartupIndicatorTimeoutId = null,
  isColdWorkspaceHydrationPending = !1,
  _lastProcessedAuthChange = { userId: null, oldUserId: null, timestamp: 0 },
  _lastAuthSyncTimestamp = 0;
const AUTH_SYNC_DEBOUNCE_MS = 2e3;
let _crossTabLoginInProgress = !1,
  _pendingAuthChange = null,
  _pendingLoginSyncSignal = null,
  _isHandlingSessionInvalidation = !1,
  _suppressLateAuthReconcileUntil = 0,
  _storedSupabaseSessionAdoptionRevision = 0,
  _storedSupabaseSessionAdoptionTask = null,
  _supersededWorkspaceRecoveryRevision = 0;
const WORKSPACE_RECOVERY_EVENT = "lumilist-workspace-recovery-needed";
async function drainStoredSupabaseSessionAdoptionQueue() {
  let e = 0;
  for (; e < _storedSupabaseSessionAdoptionRevision; ) {
    const t = _storedSupabaseSessionAdoptionRevision,
      r = await SyncManager._readStoredSupabaseSessionRecord();
    t === _storedSupabaseSessionAdoptionRevision &&
      (r?.rawValue
        ? ((e = t),
          (await SyncManager.adoptStoredSupabaseSession(r.rawValue, {
            allowNoopRecovery: !0,
            storageOnly: !0,
          })) &&
            initialAuthCompleted &&
            document.body.classList.contains("not-authenticated") &&
            (await updateAuthUI({ skipOnboarding: !0 })))
        : (e = t));
  }
  return e;
}
function queueStoredSupabaseSessionAdoption() {
  return (
    (_storedSupabaseSessionAdoptionRevision += 1),
    _storedSupabaseSessionAdoptionTask ||
      (_storedSupabaseSessionAdoptionTask = (async () => {
        try {
          let e;
          do {
            e = await drainStoredSupabaseSessionAdoptionQueue();
          } while (e < _storedSupabaseSessionAdoptionRevision);
        } finally {
          _storedSupabaseSessionAdoptionTask = null;
        }
      })()),
    _storedSupabaseSessionAdoptionTask
  );
}
async function recoverCurrentAccountAfterSupersededWorkspaceMutation(
  e = "superseded_workspace_mutation",
) {
  const t = ++_supersededWorkspaceRecoveryRevision,
    r = await SyncManager._readStoredSupabaseSessionRecord();
  if (!r?.rawValue || !r?.session) return !1;
  if (
    (await SyncManager.adoptStoredSupabaseSession(r.rawValue, {
      allowNoopRecovery: !0,
    }),
    t !== _supersededWorkspaceRecoveryRevision)
  )
    return !1;
  const [a, o] = await Promise.all([
      SyncManager.getStoredUser(),
      SyncManager._readStoredSupabaseSessionRecord(),
    ]),
    n = normalizeSupabaseUserId(o?.session?.user?.id),
    i = normalizeSupabaseUserId(a?.id),
    s = n || i;
  return !(
    !s ||
    (n && i && n !== i) ||
    !(await SyncManager._isUserContextCurrent(s)) ||
    (console.warn(
      "Recovering the current account after stale workspace work was superseded:",
      e,
    ),
    setActiveStoredUserId(s),
    setWorkspaceOwnerUserId(null),
    (isColdWorkspaceHydrationPending = !0),
    (_pendingAuthChange = {
      oldValue: null,
      newValue: a || { id: s, email: o?.session?.user?.email || null },
      timestamp: Date.now(),
    }),
    initialAuthCompleted
      ? (beginCrossTabLoginWait(s),
        window.setTimeout(() => {
          recoverInterruptedCrossTabLogin(s).catch((e) => {
            console.error(
              "Failed to recover the current account after superseded workspace work:",
              e,
            );
          });
        }, 0),
        0)
      : (beginWorkspaceStartupShell(), 0))
  );
}
function normalizeRuntimeUserId(e) {
  return "function" == typeof normalizeSupabaseUserId
    ? normalizeSupabaseUserId(e)
    : "string" == typeof e && e.trim()
      ? e.trim()
      : null;
}
function setWorkspaceOwnerUserId(e) {
  const t = normalizeRuntimeUserId(e);
  ((window.__lumilistWorkspaceOwnerUserId = t),
    setWallpaperAccountScopeUserId(t));
}
function setActiveStoredUserId(e) {
  const t = normalizeRuntimeUserId(e);
  (normalizeRuntimeUserId(window.__lumilistActiveStoredUserId) !== t &&
    invalidateSubscriptionRequestContext(),
    (window.__lumilistActiveStoredUserId = t));
}
function writeThemeBootstrapAuthHint(e) {
  try {
    localStorage.setItem(
      WALLPAPER_BOOT_AUTH_HINT_LOCAL_KEY,
      !0 === e ? "authenticated" : "logged_out",
    );
  } catch (e) {}
}
function getActiveStoredUserId() {
  return normalizeRuntimeUserId(window.__lumilistActiveStoredUserId);
}
async function getCurrentStoredUserId() {
  const e = getActiveStoredUserId();
  if (e) return e;
  try {
    if (
      "undefined" != typeof SyncManager &&
      "function" == typeof SyncManager.getStoredUser
    ) {
      const e = await SyncManager.getStoredUser(),
        t = normalizeSupabaseUserId(e?.id);
      if (t) return t;
    }
  } catch (e) {
    console.warn("Failed to read stored user from SyncManager:", e);
  }
  try {
    if ("undefined" != typeof chrome && chrome.storage?.local) {
      const e = await chrome.storage.local.get("lumilist_user");
      return normalizeSupabaseUserId(e?.lumilist_user?.id);
    }
  } catch (e) {
    console.warn("Failed to read stored user from storage:", e);
  }
  return null;
}
function getWorkspaceMutationBlockedReason() {
  const e = normalizeRuntimeUserId(window.__lumilistWorkspaceOwnerUserId),
    t = getActiveStoredUserId();
  return isColdWorkspaceHydrationPending
    ? llT("startup.loadingWorkspace")
    : _crossTabLoginInProgress
      ? "LumiList is still syncing this account. Please wait a moment and try again."
      : t && !e
        ? llT("startup.loadingWorkspace")
        : e && t && e !== t
          ? "This tab is out of date after an account change. Reload LumiList before editing."
          : e && !t
            ? "You are signed out in this tab. Reload LumiList before editing."
            : null;
}
function showWorkspaceMutationBlockedToast(e, t = 3e3) {
  if (!e) return;
  window._lastStaleWorkspaceToastAt || (window._lastStaleWorkspaceToastAt = 0);
  const r = Date.now();
  r - window._lastStaleWorkspaceToastAt > t &&
    ((window._lastStaleWorkspaceToastAt = r), showGlassToast(e, "warning"));
}
function canMutateAccountScopedPreferences() {
  const e = getWorkspaceMutationBlockedReason();
  return !e || (showWorkspaceMutationBlockedToast(e), !1);
}
function isAuthBoundaryStorageChange(e) {
  return (
    !(!e || "object" != typeof e) &&
    normalizeRuntimeUserId(e.oldValue?.id) !==
      normalizeRuntimeUserId(e.newValue?.id)
  );
}
function shouldApplyAccountScopedStorageUpdate(e = null) {
  if (_crossTabLoginInProgress) return !1;
  if (isAuthBoundaryStorageChange(e)) return !1;
  const t = normalizeRuntimeUserId(window.__lumilistWorkspaceOwnerUserId),
    r = getActiveStoredUserId();
  return !(!t || !r) && t === r;
}
function suppressLateAuthReconcile(e = 3e4) {
  const t = Number.isFinite(e) ? Math.max(e, 0) : 3e4;
  _suppressLateAuthReconcileUntil = Date.now() + t;
}
function clearLateAuthReconcileSuppression() {
  _suppressLateAuthReconcileUntil = 0;
}
function isLateAuthReconcileSuppressed() {
  return _suppressLateAuthReconcileUntil > Date.now();
}
function resetCrossTabLoginWaitState({
  clearPendingAuthChange: e = !1,
  clearPendingSignal: t = !1,
} = {}) {
  ((_crossTabLoginInProgress = !1),
    (_pendingCrossTabLoginUserId = null),
    (_pendingCrossTabLoginGeneration = null),
    (_crossTabLoginWaitStartedAt = 0),
    _crossTabLoginTimeoutId &&
      (clearTimeout(_crossTabLoginTimeoutId), (_crossTabLoginTimeoutId = null)),
    e && (_pendingAuthChange = null),
    t && (_pendingLoginSyncSignal = null));
}
function normalizeLoginSyncState(e) {
  if (!e || "object" != typeof e) return null;
  const t = normalizeSupabaseUserId(e.userId),
    r = "string" == typeof e.phase && e.phase.trim() ? e.phase.trim() : null,
    a = "string" == typeof e.action && e.action.trim() ? e.action.trim() : null,
    o =
      "string" == typeof e.generation && e.generation.trim()
        ? e.generation.trim()
        : null,
    n = Number(e.timestamp);
  return t && r
    ? {
        userId: t,
        phase: r,
        action: a,
        generation: o,
        timestamp: Number.isFinite(n) ? n : 0,
      }
    : null;
}
function isFreshPendingLoginSyncState(e, t, r = Date.now()) {
  const a = normalizeSupabaseUserId(t);
  if (
    !a ||
    e?.userId !== a ||
    "pending" !== e.phase ||
    !e.generation ||
    !Number.isFinite(e.timestamp) ||
    e.timestamp <= 0
  )
    return !1;
  const o = Number(r) - e.timestamp;
  return o >= -3e4 && o <= 45e3;
}
function getWorkspaceOwnerCheckpointUserId(e) {
  return e && "object" == typeof e ? normalizeSupabaseUserId(e.userId) : null;
}
function isWorkspaceCacheOwnerVerified(e, t) {
  return !0;
}
function isMatchingCompletedLoginSync(e, t) {
  const r = normalizeSupabaseUserId(t?.userId),
    a =
      "string" == typeof t?.generation && t.generation.trim()
        ? t.generation.trim()
        : null;
  return Boolean(
    r && a && e?.userId === r && "completed" === e.phase && e.generation === a,
  );
}
async function getCurrentWorkspaceOwnerCheckpoint() {
  if (
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager.getLastDeltaSyncState
  )
    return SyncManager.getLastDeltaSyncState();
  if ("undefined" != typeof chrome && chrome.storage?.local?.get) {
    const e = await chrome.storage.local.get("lumilist_last_delta_sync");
    return e?.lumilist_last_delta_sync || null;
  }
  return null;
}
async function getStoredLoginSyncState() {
  if ("undefined" == typeof chrome || !chrome.storage?.local?.get) return null;
  try {
    const e = await chrome.storage.local.get("lumilist_login_sync_state");
    return normalizeLoginSyncState(e?.lumilist_login_sync_state);
  } catch (e) {
    return (console.warn("Failed to read stored login sync state:", e), null);
  }
}
function snapshotSupabaseAuthSession(e) {
  const t = normalizeSupabaseUserId(e?.user?.id);
  return e?.user && t
    ? {
        user: {
          id: t,
          email: e.user.email || null,
          createdAt: e.user.created_at || e.user.createdAt || null,
        },
      }
    : null;
}
async function shouldProcessSupabaseAuthStateChange(e, t) {
  if (
    "undefined" == typeof SyncManager ||
    "function" != typeof SyncManager._readStoredSupabaseSessionRecord
  )
    return !1;
  let r;
  try {
    r = await SyncManager._readStoredSupabaseSessionRecord({
      throwOnError: !0,
    });
  } catch (e) {
    return !1;
  }
  const a = r?.session || null;
  if ("SIGNED_OUT" === e) return !(r?.rawValue || a);
  if ("SIGNED_IN" === e || "USER_UPDATED" === e) {
    const e = normalizeSupabaseUserId(t?.user?.id);
    if (!e) return !1;
    const r = normalizeSupabaseUserId(a?.user?.id);
    if (a?.user?.id && !r) return !1;
    if (r && r !== e) return !1;
  }
  return !0;
}
async function shouldProcessSharedStoredUserLogout(e) {
  if (
    "undefined" == typeof SyncManager ||
    "function" != typeof SyncManager.getStoredUser ||
    "function" != typeof SyncManager._readStoredSupabaseSessionRecord
  )
    return !1;
  let t, r;
  try {
    [t, r] = await Promise.all([
      SyncManager.getStoredUser({ throwOnError: !0 }),
      SyncManager._readStoredSupabaseSessionRecord({ throwOnError: !0 }),
    ]);
  } catch (e) {
    return !1;
  }
  return !t?.id && !r?.rawValue && !r?.session && Boolean(e);
}
async function settleSharedSignedOutUi(e) {
  return (
    !!(await shouldProcessSharedStoredUserLogout(e)) &&
    (setWorkspaceOwnerUserId(null),
    setActiveStoredUserId(null),
    resetCrossTabLoginWaitState({
      clearPendingAuthChange: !0,
      clearPendingSignal: !0,
    }),
    (currentPageId = null),
    clearAllColumns(),
    resetAccountBoundaryTransientUi({ quickTourReason: "signed_out" }),
    showWelcomeScreen({ clearPersistedState: !1 }),
    !0)
  );
}
function handleSupabaseAuthNotification(e, t, r) {
  const a = "SIGNED_OUT" === t || ("INITIAL_SESSION" === t && !r);
  initialAuthCompleted
    ? queueSupabaseAuthStateChange(e, a ? "SIGNED_OUT" : t, r)
    : a && (e.pendingInitialSignOut = !0);
}
function flushInitialSupabaseSignOut(e) {
  initialAuthCompleted &&
    e.pendingInitialSignOut &&
    ((e.pendingInitialSignOut = !1),
    queueSupabaseAuthStateChange(e, "SIGNED_OUT", null));
}
function queueSupabaseAuthStateChange(e, t, r) {
  const a = snapshotSupabaseAuthSession(r);
  if (("SIGNED_IN" === t || "USER_UPDATED" === t) && !a)
    return void console.warn(
      `Ignored Supabase ${t} event with an invalid user identifier`,
    );
  const o = a?.user?.id || e.lastAuthUserId || null;
  (a?.user?.id && (e.lastAuthUserId = a.user.id),
    window.setTimeout(() => {
      e.queue = e.queue
        .then(
          () => processSupabaseAuthStateChange(e, t, a, o),
          () => processSupabaseAuthStateChange(e, t, a, o),
        )
        .catch((e) => {
          console.error(`Error processing deferred auth event ${t}:`, e);
        });
    }, 0));
}
async function processSupabaseAuthStateChange(e, t, r, a = null) {
  if (
    "SIGNED_OUT" === t ||
    !(
      isLogoutInProgress ||
      !0 === window.isLumiListLogoutInProgress ||
      ("undefined" != typeof SyncManager &&
        "function" == typeof SyncManager.isLogoutTransitionActive &&
        (await SyncManager.isLogoutTransitionActive()))
    )
  )
    if (await shouldProcessSupabaseAuthStateChange(t, r))
      if ("SIGNED_OUT" === t)
        try {
          if (isCurrentTabAuthenticating) return;
          const e = await SyncManager.getStoredUser();
          if (!e) return void (await settleSharedSignedOutUi(a));
          if (!(await shouldProcessSupabaseAuthStateChange(t, r))) return;
          if (await SyncManager.isSessionInvalidatedForUser(e))
            return void (await handleSessionInvalidation(
              "Session expired. Please login again.",
              { expectedUserId: e.id },
            ));
          if (
            !(await SyncManager.clearAccountWorkspaceSnapshot(e.id, () =>
              shouldProcessSupabaseAuthStateChange(t, r),
            ))
          )
            return void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
              "signed_out_cleanup_changed",
            ));
          if (!(await shouldProcessSupabaseAuthStateChange(t, r)))
            return void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
              "signed_out_cleanup_superseded",
            ));
          if (
            !(await SyncManager.clearStoredUser(e.id)) ||
            !(await shouldProcessSupabaseAuthStateChange(t, r))
          )
            return void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
              "signed_out_identity_cleanup_superseded",
            ));
          (setWorkspaceOwnerUserId(null),
            setActiveStoredUserId(null),
            writeThemeBootstrapAuthHint(!1),
            await resetWallpaperStateForAccountBoundary({
              clearPersistedState: !0,
            }),
            await updateAuthUI());
        } catch (e) {
          console.error("Error handling SIGNED_OUT event:", e);
        }
      else if ("TOKEN_REFRESHED" !== t || r) {
        if ("SIGNED_IN" === t && r?.user)
          try {
            if (_crossTabLoginInProgress) return;
            const a = normalizeSupabaseUserId(r.user.id);
            if (!a) return;
            const o = await SyncManager.getStoredUser(),
              n = o && o.id && o.id !== a;
            if (!(await shouldProcessSupabaseAuthStateChange(t, r))) return;
            if (n) {
              try {
                await chrome.runtime.sendMessage({
                  action: "clearSyncQueue",
                  sourceUserId: o.id,
                });
              } catch (e) {
                console.warn(
                  "Failed to stop background sync during account switch:",
                  e,
                );
              }
              if (
                !(await SyncManager.clearAccountWorkspaceSnapshot(o.id, () =>
                  shouldProcessSupabaseAuthStateChange(t, r),
                ))
              )
                return void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
                  "signed_in_account_switch_changed",
                ));
              if (!(await shouldProcessSupabaseAuthStateChange(t, r)))
                return void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
                  "signed_in_account_switch_superseded",
                ));
              (setWorkspaceOwnerUserId(a),
                await resetWallpaperStateForAccountBoundary({
                  clearPersistedState: !0,
                }));
            }
            if (
              !1 ===
              (await SyncManager.setStoredUser({
                id: a,
                email: r.user.email,
                createdAt: r.user.createdAt || r.user.created_at || null,
              }))
            )
              return;
            if (
              (setActiveStoredUserId(a),
              writeThemeBootstrapAuthHint(!0),
              setWallpaperAccountScopeUserId(a),
              await loadWallpaperCloudSyncStateFromStorage(a),
              (!e.wasAuthRedirect && !e.hasCompletedInitialSync) || n)
            )
              try {
                const e = window.AUTH_TIMEOUTS?.CROSS_TAB_SYNC || 15e3,
                  a = (async () => {
                    (await SyncManager.autoSyncOnLoad(),
                      (await shouldProcessSupabaseAuthStateChange(t, r)) &&
                        (await applyWallpaperCloudSyncState(
                          (
                            await chrome.storage.local.get(
                              "wallpaperCloudSyncState",
                            )
                          ).wallpaperCloudSyncState,
                          { source: "signed-in-auto-sync" },
                        ),
                        await ensureWallpaperPreferencesInitialized(),
                        await applyWebsiteWallpaperHandoffFromUrl(),
                        await loadPagesNavigation(),
                        await ensureFirstTabSelected(),
                        await loadBoardsFromDatabase()));
                  })(),
                  o = new Promise((t, r) =>
                    setTimeout(() => r(new Error("SIGNED_IN sync timeout")), e),
                  );
                await Promise.race([a, o]);
              } catch (e) {
                return (
                  console.error(
                    "SIGNED_IN sync failed or timed out:",
                    e.message,
                  ),
                  void window.location.reload()
                );
              }
            if (!(await shouldProcessSupabaseAuthStateChange(t, r))) return;
            (setWorkspaceOwnerUserId(a),
              clearLateAuthReconcileSuppression(),
              await updateAuthUI());
          } catch (e) {
            console.error("Error handling SIGNED_IN event:", e);
          }
        else if ("USER_UPDATED" === t && r?.user)
          try {
            const e = normalizeSupabaseUserId(r.user.id);
            if (!e) return;
            if (
              !1 ===
              (await SyncManager.setStoredUser({
                id: e,
                email: r.user.email,
                createdAt: r.user.createdAt || r.user.created_at || null,
              }))
            )
              return;
            (setActiveStoredUserId(e), writeThemeBootstrapAuthHint(!0));
          } catch (e) {
            console.error("Error handling USER_UPDATED event:", e);
          }
      } else {
        console.error(
          "\u{1f510} Token refresh failed - refresh token invalid, invalidating session",
        );
        try {
          if (
            a &&
            "function" == typeof SyncManager._isUserContextCurrent &&
            !(await SyncManager._isUserContextCurrent(a))
          )
            return void console.warn(
              "Ignored stale token-refresh failure for a replaced account",
            );
          if (await SyncManager.recoverSupabaseSessionAfterRefreshFailure())
            return void console.warn(
              "Recovered extension session from newer stored Supabase session after refresh failure",
            );
          await handleSessionInvalidation(
            "Session expired. Please login again.",
            { expectedUserId: a },
          );
        } catch (e) {
          (console.error("Error handling TOKEN_REFRESHED failure:", e),
            window.location.reload());
        }
      }
    else
      console.warn(
        `Ignored stale Supabase auth event after a newer shared session won: ${t}`,
      );
}
if (
  (window.addEventListener(WORKSPACE_RECOVERY_EVENT, (e) => {
    recoverCurrentAccountAfterSupersededWorkspaceMutation(
      e?.detail?.reason,
    ).catch((e) => {
      console.error("Failed to schedule superseded workspace recovery:", e);
    });
  }),
  setWorkspaceOwnerUserId(null),
  setActiveStoredUserId(null),
  !(
    featureFactories.uiModes &&
    featureFactories.quickSaveSettings &&
    featureFactories.search &&
    featureFactories.wallpaper &&
    featureFactories.captureMode
  ))
)
  throw new Error("LumiList feature modules failed to load before newtab.js");
const uiModesFeature = featureFactories.uiModes({
    getPrivacyModeEnabled: () => privacyModeEnabled,
    setPrivacyModeEnabled: (e) => {
      privacyModeEnabled = !0 === e;
    },
    getIncognitoModeEnabled: () => incognitoModeEnabled,
    setIncognitoModeEnabled: (e) => {
      incognitoModeEnabled = !0 === e;
    },
    getCompactModeEnabled: () => compactModeEnabled,
    setCompactModeEnabled: (e) => {
      compactModeEnabled = !0 === e;
    },
    getIsSelectionMode: () => !0 === isSelectionMode,
    canMutateAccountScopedPreferences,
  }),
  {
    applyPrivacyBlurToBoards,
    syncPrivacyModeFromStorage,
    savePrivacyModeToStorage,
    updatePrivacyButtonState,
    togglePrivacyMode,
    saveIncognitoModeToStorage,
    loadIncognitoModeFromStorage,
    updateIncognitoButtonState,
    toggleIncognitoMode,
    handleIncognitoLinkClick,
    openMultipleUrls,
    initIncognitoLinkHandler,
    saveCompactModeToStorage,
    loadCompactModeFromStorage,
    applyCompactMode,
    updateCompactModeToggle,
    toggleCompactMode,
  } = uiModesFeature,
  quickSaveSettingsFeature = featureFactories.quickSaveSettings({
    db,
    quickSaveCommandName: "quick-save",
    shortcutsSettingsUrl: SHORTCUTS_SETTINGS_URL,
    extensionsSettingsUrl: "chrome://extensions",
  }),
  {
    isMacPlatformForQuickSaveSettings,
    getQuickSaveFallbackShortcutLabel,
    updateSettingsQuickSaveShortcutUi,
    createSettingsTab,
    getQuickSaveCommandDetails,
    loadSettingsQuickSaveShortcut,
    openQuickSaveShortcutSettings,
    loadSettingsQuickSaveDestinationOptions,
    refreshSettingsQuickSaveControls,
  } = quickSaveSettingsFeature,
  captureModeFeature = featureFactories.captureMode({ showGlassToast }),
  { initCaptureMode } = captureModeFeature;
let _lastLoginSyncSignal = { userId: null, generation: null, timestamp: 0 },
  _pendingCrossTabLoginUserId = null,
  _pendingCrossTabLoginGeneration = null,
  _crossTabLoginWaitStartedAt = 0,
  _crossTabLoginTimeoutId = null,
  _onboardingRetryTimeoutId = null,
  _onboardingOpenTimeoutId = null;
const QUICK_TOUR_STORAGE_KEY_PREFIX = "lumilist_quick_tour_v1_",
  QUICK_TOUR_VERSION = 1,
  QUICK_TOUR_TARGET_RETRY_LIMIT = 12,
  QUICK_TOUR_TARGET_RETRY_DELAY_MS = 150,
  QUICK_TOUR_EDGE_PADDING = 8,
  QUICK_TOUR_ANCHOR_GAP = 12,
  QUICK_TOUR_STEPS = Object.freeze([
    {
      id: "create_board",
      titleKey: "quickTour.stepCreateBoardTitle",
      bodyKey: "quickTour.stepCreateBoardBody",
    },
    {
      id: "add_link",
      titleKey: "quickTour.stepAddLinkTitle",
      bodyKey: "quickTour.stepAddLinkBody",
    },
    {
      id: "open_wallpaper",
      titleKey: "quickTour.stepWallpaperTitle",
      bodyKey: "quickTour.stepWallpaperBody",
    },
  ]),
  quickTourEventListeners = new Set();
let quickTourPopoverEl = null,
  quickTourCurrentTargetEl = null,
  quickTourForcedBoardEl = null,
  quickTourEventUnsubscribe = null,
  quickTourRepositionHandler = null,
  quickTourEscapeHandler = null,
  quickTourPointerMoveHandler = null,
  quickTourMutationObserver = null,
  quickTourAnchorRefreshRafId = null,
  quickTourRetryTimeoutId = null,
  quickTourState = {
    active: !1,
    stepIndex: 0,
    retryCount: 0,
    source: null,
    userId: null,
    context: { boardId: null },
  };
const TAB_INSTANCE_ID = (() => {
  try {
    const e = sessionStorage.getItem("lumilist_tab_instance_id");
    if (e) return e;
    const t =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return (sessionStorage.setItem("lumilist_tab_instance_id", t), t);
  } catch (e) {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
})();
let bookmarkCount = 0;
const BOOKMARK_LIMIT = 1e5,
  BOOKMARK_WARNING_THRESHOLD = 9e4,
  BOOKMARK_CRITICAL_THRESHOLD = 95e3,
  REVIEW_PROMPT_MODAL_ID = "reviewPromptModal",
  REVIEW_PROMPT_CWS_REVIEW_URL =
    "https://chromewebstore.google.com/detail/lumilist/pcekakljniocipfpmjmpmgaleigcbhlh/reviews",
  REVIEW_PROMPT_AMO_REVIEW_URL =
    "https://addons.mozilla.org/en-US/firefox/addon/lumilist-bookmark-manager/reviews/",
  REVIEW_PROMPT_SETTLE_DELAY_MS = 2e3,
  BOOKMARK_PORTABILITY_EXPORT_TYPE = "lumilist-bookmark-portability",
  BOOKMARK_PORTABILITY_EXPORT_VERSION = 1,
  BOOKMARK_PORTABILITY_TRIAL_IMPORT_WARNING =
    "LumiList bookmark export imports are available to signed-in users.";
let reviewPromptCheckInFlight = !1,
  activeReviewPromptUserId = null,
  activeReviewPromptRating = 0,
  reviewPromptSubmissionInFlight = !1,
  activeDeleteAccountModalUserId = null,
  activeChromeImportUserId = null,
  pendingWelcomeNotice = null,
  pendingWelcomeNoticeTimeoutId = null,
  reviewPromptDisplayTimer = null,
  reviewPromptVisitChecksInitialized = !1;
async function initBookmarkCount() {
  try {
    bookmarkCount = await db.bookmarks.count();
  } catch (e) {
    (console.error("[Bookmark Limit] Failed to initialize bookmark count:", e),
      (bookmarkCount = 0));
  }
}
async function recalculateBookmarkCount() {
  await recalculateAllCounts();
}
function checkBookmarkLimit(e = 1) {
  const t = 1e5 - bookmarkCount;
  if (bookmarkCount + e > 1e5)
    return {
      allowed: !1,
      remaining: Math.max(0, t),
      warning: llT("limit.bookmarkReached", {
        count: llNumber(bookmarkCount),
        limit: llNumber(1e5),
      }),
    };
  let r = null;
  return (
    bookmarkCount >= 95e3
      ? (r = llT("limit.bookmarkClose", { remaining: llNumber(t) }))
      : bookmarkCount >= 9e4 &&
        (r = llT("limit.bookmarkSlotsRemaining", { remaining: llNumber(t) })),
    { allowed: !0, remaining: t, warning: r }
  );
}
async function checkBookmarkLimitForBulkImport(e) {
  let t = null;
  "undefined" != typeof SyncManager &&
    (t = await SyncManager.getServerBookmarkCount());
  const r = null !== t ? t : bookmarkCount,
    a = 1e5 - r,
    o = r + e;
  if (o > 1e5)
    return {
      allowed: !1,
      remaining: Math.max(0, a),
      serverCount: t,
      warning: `Cannot import ${e.toLocaleString()} bookmarks. You have ${r.toLocaleString()} bookmarks and the limit is ${(1e5).toLocaleString()}. You can import up to ${Math.max(0, a).toLocaleString()} more.`,
    };
  let n = null;
  return (
    r >= 95e3 &&
      (n = `After this import, you'll have ${o.toLocaleString()}/${(1e5).toLocaleString()} bookmarks`),
    { allowed: !0, remaining: a, serverCount: t, warning: n }
  );
}
function getEffectiveSubscriptionStatusForImportLimit() {
  let e =
    "trial" === window.subscriptionStatus ||
    "active" === window.subscriptionStatus ||
    "grace" === window.subscriptionStatus ||
    "expired" === window.subscriptionStatus
      ? window.subscriptionStatus
      : window.cachedSubscriptionStatus;
  if (
    window.subscriptionData &&
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager.getEffectiveStatus
  ) {
    const t = SyncManager.getEffectiveStatus(window.subscriptionData);
    ("trial" !== t && "active" !== t && "grace" !== t && "expired" !== t) ||
      (e = t);
  }
  return e;
}
let pageCount = 0;
const PAGE_LIMIT = 1e4,
  PAGE_WARNING_THRESHOLD = 8e3,
  PAGE_CRITICAL_THRESHOLD = 9500;
async function initPageCount() {
  try {
    pageCount = await db.pages.count();
  } catch (e) {
    (console.error("[Page Limit] Failed to initialize page count:", e),
      (pageCount = 0));
  }
}
function checkPageLimit(e = 1) {
  const t = 1e4 - pageCount;
  if (pageCount + e > 1e4)
    return {
      allowed: !1,
      remaining: Math.max(0, t),
      warning: llT("limit.pageReached", {
        count: llNumber(pageCount),
        limit: llNumber(1e4),
      }),
    };
  let r = null;
  return (
    pageCount >= 9500
      ? (r = llT("limit.pageClose", { remaining: llNumber(t) }))
      : pageCount >= 8e3 &&
        (r = llT("limit.pageSlotsRemaining", { remaining: llNumber(t) })),
    { allowed: !0, remaining: t, warning: r }
  );
}
let boardCount = 0;
const BOARD_LIMIT = 5e4,
  BOARD_WARNING_THRESHOLD = 4e4,
  BOARD_CRITICAL_THRESHOLD = 45e3;
async function initBoardCount() {
  try {
    boardCount = await db.boards.count();
  } catch (e) {
    (console.error("[Board Limit] Failed to initialize board count:", e),
      (boardCount = 0));
  }
}
function checkBoardLimit(e = 1) {
  const t = 5e4 - boardCount;
  if (boardCount + e > 5e4)
    return {
      allowed: !1,
      remaining: Math.max(0, t),
      warning: llT("limit.boardReached", {
        count: llNumber(boardCount),
        limit: llNumber(5e4),
      }),
    };
  let r = null;
  return (
    boardCount >= 45e3
      ? (r = llT("limit.boardClose", { remaining: llNumber(t) }))
      : boardCount >= 4e4 &&
        (r = llT("limit.boardSlotsRemaining", { remaining: llNumber(t) })),
    { allowed: !0, remaining: t, warning: r }
  );
}
async function recalculateAllCounts() {
  try {
    ((pageCount = await db.pages.count()),
      (boardCount = await db.boards.count()),
      (bookmarkCount = await db.bookmarks.count()));
  } catch (e) {
    console.error("[Limits] Failed to recalculate counts:", e);
  }
}
function normalizeExportString(e) {
  return null == e ? null : String(e);
}
function normalizeExportNumber(e) {
  return Number.isFinite(e) ? e : null;
}
function buildBookmarkPortabilityExportPayload({
  pages: e = [],
  boards: t = [],
  bookmarks: r = [],
  account: a = {},
  generatedAt: o = new Date().toISOString(),
} = {}) {
  const n = new Map((Array.isArray(e) ? e : []).map((e) => [e.id, e])),
    i = new Map((Array.isArray(t) ? t : []).map((e) => [e.id, e])),
    s = (Array.isArray(r) ? r : [])
      .slice()
      .sort((e, t) => {
        const r = i.get(e?.boardId),
          a = i.get(t?.boardId),
          o = r ? n.get(r.pageId) : null,
          s = a ? n.get(a.pageId) : null,
          l = Number.isFinite(o?.order) ? o.order : Number.MAX_SAFE_INTEGER,
          c = Number.isFinite(s?.order) ? s.order : Number.MAX_SAFE_INTEGER;
        if (l !== c) return l - c;
        const d = Number.isFinite(r?.columnIndex)
            ? r.columnIndex
            : Number.MAX_SAFE_INTEGER,
          u = Number.isFinite(a?.columnIndex)
            ? a.columnIndex
            : Number.MAX_SAFE_INTEGER;
        if (d !== u) return d - u;
        const p = Number.isFinite(r?.order) ? r.order : Number.MAX_SAFE_INTEGER,
          m = Number.isFinite(a?.order) ? a.order : Number.MAX_SAFE_INTEGER;
        return p !== m
          ? p - m
          : (Number.isFinite(e?.order) ? e.order : Number.MAX_SAFE_INTEGER) -
              (Number.isFinite(t?.order) ? t.order : Number.MAX_SAFE_INTEGER);
      })
      .map((e) => {
        const t = i.get(e?.boardId) || null,
          r = (t && n.get(t.pageId)) || null;
        return {
          title: normalizeExportString(e?.title) || "",
          url: normalizeExportString(e?.url) || "",
          description: normalizeExportString(e?.description),
          pageName: normalizeExportString(r?.name),
          boardName: normalizeExportString(t?.name),
          pageOrder: normalizeExportNumber(r?.order),
          boardColumnIndex: normalizeExportNumber(t?.columnIndex),
          boardOrder: normalizeExportNumber(t?.order),
          bookmarkOrder: normalizeExportNumber(e?.order),
          status: e?.deletedAt ? "trashed" : "active",
          createdAt: normalizeExportString(e?.createdAt),
          updatedAt: normalizeExportString(e?.updatedAt),
          deletedAt: normalizeExportString(e?.deletedAt),
        };
      }),
    l = new Set(s.map((e) => e.pageName).filter(Boolean)),
    c = new Set(s.map((e) => e.boardName).filter(Boolean));
  return {
    exportType: "lumilist-bookmark-portability",
    exportVersion: 1,
    generatedAt: o,
    product: { name: "LumiList", dataType: "bookmark-portability" },
    account: { email: normalizeExportString(a?.email) },
    counts: {
      bookmarks: s.length,
      activeBookmarks: s.filter((e) => "active" === e.status).length,
      trashedBookmarks: s.filter((e) => "trashed" === e.status).length,
      pagesReferenced: l.size,
      boardsReferenced: c.size,
    },
    bookmarks: s,
  };
}
function isLumiListBookmarkPortabilityExportPayload(e) {
  return !(
    !e ||
    "object" != typeof e ||
    Array.isArray(e) ||
    "lumilist-bookmark-portability" !== e.exportType
  );
}
function isLumiListBookmarkPortabilityExportContent(e) {
  if (!e || "string" != typeof e || !isJsonContent(e)) return !1;
  try {
    return isLumiListBookmarkPortabilityExportPayload(JSON.parse(e));
  } catch (e) {
    return !1;
  }
}
function shouldBlockLumiListBookmarkPortabilityImport({
  content: e,
  status: t,
} = {}) {
  return (
    void 0 !== LUMILIST_FREE_ACCESS_ENABLED &&
    !LUMILIST_FREE_ACCESS_ENABLED &&
    !!isLumiListBookmarkPortabilityExportContent(e) &&
    "trial" === ("string" == typeof t ? t.trim().toLowerCase() : "")
  );
}
function getBookmarkPortabilityImportGroupName(e) {
  const t = normalizeExportString(e?.pageName)?.trim(),
    r = normalizeExportString(e?.boardName)?.trim();
  return t && r ? `${t} - ${r}` : r || t || "Imported LumiList Bookmarks";
}
function getBookmarkPortabilityImportOrderValue(e) {
  return Number.isFinite(e) ? e : Number.MAX_SAFE_INTEGER;
}
function shouldImportBookmarkPortabilityRow(e) {
  const t = normalizeExportString(e?.status)?.trim().toLowerCase();
  if ("trashed" === t) return !1;
  const r = normalizeExportString(e?.deletedAt)?.trim();
  return !r;
}
function buildLumiListBookmarkPortabilityImportGroupsFromPayload(e) {
  if (
    !isLumiListBookmarkPortabilityExportPayload(e) ||
    !Array.isArray(e.bookmarks)
  )
    return null;
  const t = [],
    r = new Map();
  return (
    e.bookmarks
      .filter(
        (e) =>
          e &&
          "object" == typeof e &&
          "string" == typeof e.url &&
          shouldImportBookmarkPortabilityRow(e),
      )
      .slice()
      .sort((e, t) => {
        const r =
          getBookmarkPortabilityImportOrderValue(e.pageOrder) -
          getBookmarkPortabilityImportOrderValue(t.pageOrder);
        if (0 !== r) return r;
        const a =
          getBookmarkPortabilityImportOrderValue(e.boardColumnIndex) -
          getBookmarkPortabilityImportOrderValue(t.boardColumnIndex);
        if (0 !== a) return a;
        const o =
          getBookmarkPortabilityImportOrderValue(e.boardOrder) -
          getBookmarkPortabilityImportOrderValue(t.boardOrder);
        return 0 !== o
          ? o
          : getBookmarkPortabilityImportOrderValue(e.bookmarkOrder) -
              getBookmarkPortabilityImportOrderValue(t.bookmarkOrder);
      })
      .forEach((e) => {
        const a = normalizeExportString(e?.url)?.trim();
        if (!a) return;
        const o = getBookmarkPortabilityImportGroupName(e);
        if (!r.has(o)) {
          const e = { name: o, links: [] };
          (r.set(o, e), t.push(e));
        }
        r.get(o).links.push({
          url: a,
          title: normalizeExportString(e?.title)?.trim() || a,
          description: normalizeExportString(e?.description),
        });
      }),
    t.length > 0 ? t : null
  );
}
function buildLumiListBookmarkPortabilityImportGroupsFromContent(e) {
  if (!e || "string" != typeof e || !isJsonContent(e)) return null;
  try {
    return buildLumiListBookmarkPortabilityImportGroupsFromPayload(
      JSON.parse(e),
    );
  } catch (e) {
    return null;
  }
}
async function getStoredUserForBookmarkExport() {
  try {
    if (
      "undefined" != typeof SyncManager &&
      "function" == typeof SyncManager.getStoredUser
    ) {
      const e = await SyncManager.getStoredUser();
      if (e?.email) return e;
    }
  } catch (e) {
    console.warn("Failed to read stored user for bookmark export:", e);
  }
  try {
    if ("undefined" != typeof chrome && chrome.storage?.local) {
      const e = await chrome.storage.local.get("lumilist_user");
      return e?.lumilist_user || null;
    }
  } catch (e) {
    console.warn("Failed to read storage user for bookmark export:", e);
  }
  return null;
}
function buildBookmarkPortabilityExportFilename(e) {
  return `lumilist-bookmark-data-${
    String(e || new Date().toISOString())
      .replace(/[^0-9a-z]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "export"
  }.json`;
}
function triggerJsonDownload(e, t) {
  const r = JSON.stringify(e, null, 2),
    a = new Blob([r], { type: "application/json;charset=utf-8" }),
    o = URL.createObjectURL(a),
    n = document.createElement("a");
  ((n.href = o),
    (n.download = t),
    (n.style.display = "none"),
    document.body.appendChild(n),
    n.click(),
    n.remove(),
    setTimeout(() => URL.revokeObjectURL(o), 1e3));
}
let isBookmarkDataExportInProgress = !1;
async function handleDownloadBookmarkData(e = null) {
  if (isBookmarkDataExportInProgress) return;
  const t = getWorkspaceMutationBlockedReason();
  if (t) return void showWorkspaceMutationBlockedToast(t);
  const r = await getCurrentStoredUserId();
  if (!r)
    return void showGlassToast(
      llLiteral("Please sign in again before downloading bookmark data."),
      "warning",
    );
  const a = e?.textContent || "";
  ((isBookmarkDataExportInProgress = !0),
    e && ((e.disabled = !0), (e.textContent = llLiteral("Preparing..."))));
  try {
    const [e, t, a, o] = await Promise.all([
        db.pages.toArray(),
        db.boards.toArray(),
        db.bookmarks.toArray(),
        getStoredUserForBookmarkExport(),
      ]),
      n = await getCurrentStoredUserId();
    if (!n || n !== r)
      return void showGlassToast(
        llLiteral(
          "Account changed while preparing the export. Please try again.",
        ),
        "warning",
      );
    if (!a || 0 === a.length)
      return void showGlassToast(
        llLiteral(
          "No local bookmark data is available to export. Email support@lumilist.in for account data requests.",
        ),
        "info",
        6500,
      );
    const i = new Date().toISOString();
    (triggerJsonDownload(
      buildBookmarkPortabilityExportPayload({
        pages: e,
        boards: t,
        bookmarks: a,
        account: o,
        generatedAt: i,
      }),
      buildBookmarkPortabilityExportFilename(i),
    ),
      showGlassToast(llLiteral("Bookmark data downloaded."), "success"));
  } catch (e) {
    (console.error("Failed to download bookmark data:", e),
      showGlassToast(
        llLiteral("Failed to download bookmark data. Please try again."),
        "error",
      ));
  } finally {
    ((isBookmarkDataExportInProgress = !1),
      e && ((e.disabled = !1), (e.textContent = a)));
  }
}
const SUPABASE_ACCESS_TOKEN_CACHE_MS = 5e3,
  SUPABASE_ACCESS_TOKEN_EXPIRY_BUFFER_MS = 3e4,
  BILLING_HANDOFF_TOKEN_MIN_VALIDITY_MS = 3e6;
let cachedSupabaseAccessToken = {
  token: null,
  cachedAt: 0,
  expiresAtMs: 0,
  userId: null,
};
async function getSupabaseAccessToken(e = null, t = {}) {
  try {
    const r = Date.now(),
      a = Number(t?.minValidityMs),
      o = Number.isFinite(a) && a >= 0 ? a : 3e4,
      n = null == e ? null : normalizeSupabaseUserId(e);
    if (null != e && !n) return null;
    const i =
      "function" == typeof getActiveStoredUserId
        ? normalizeSupabaseUserId(getActiveStoredUserId())
        : null;
    if (n && i && n !== i) return null;
    const s = n || i;
    if (!s) return null;
    const l = normalizeSupabaseUserId(cachedSupabaseAccessToken.userId);
    if (
      cachedSupabaseAccessToken.token &&
      l === s &&
      r - cachedSupabaseAccessToken.cachedAt < 5e3 &&
      (!cachedSupabaseAccessToken.expiresAtMs ||
        cachedSupabaseAccessToken.expiresAtMs - r > o)
    )
      return (
        "function" == typeof SyncManager._isUserContextCurrent
          ? await SyncManager._isUserContextCurrent(s)
          : getActiveStoredUserId() === s
      )
        ? cachedSupabaseAccessToken.token
        : null;
    const c = SyncManager.getSupabase();
    if (!c)
      return (
        console.error("getSupabaseAccessToken: Supabase client not available"),
        null
      );
    const { data: d, error: u } = await c.auth.getSession();
    if (u)
      return (
        console.error("getSupabaseAccessToken: Error getting session:", u),
        null
      );
    let p = d?.session || null;
    const m = Number.isFinite(p?.expires_at) ? 1e3 * p.expires_at : 0;
    if (o > 3e4 && (!m || m - Date.now() <= o)) {
      if ("function" != typeof c.auth.refreshSession)
        return (
          console.error(
            "getSupabaseAccessToken: Session refresh is unavailable for billing handoff",
          ),
          null
        );
      const { data: e, error: t } = await c.auth.refreshSession();
      if (t || !e?.session?.access_token)
        return (
          console.error(
            "getSupabaseAccessToken: Could not refresh session for billing handoff",
            t,
          ),
          null
        );
      p = e.session;
    }
    if (!p?.access_token)
      return (
        console.error("getSupabaseAccessToken: No access token in session"),
        null
      );
    const g = normalizeSupabaseUserId(p.user?.id);
    return g && g === s
      ? (
          "function" == typeof SyncManager._isUserContextCurrent
            ? await SyncManager._isUserContextCurrent(s)
            : getActiveStoredUserId() === s
        )
        ? ((cachedSupabaseAccessToken = {
            token: p.access_token,
            cachedAt: Date.now(),
            expiresAtMs: Number.isFinite(p.expires_at) ? 1e3 * p.expires_at : 0,
            userId: g,
          }),
          p.access_token)
        : null
      : ((cachedSupabaseAccessToken = {
          token: null,
          cachedAt: 0,
          expiresAtMs: 0,
          userId: null,
        }),
        null);
  } catch (e) {
    return (console.error("getSupabaseAccessToken: Exception:", e), null);
  }
}
function clearAllColumns() {
  document.querySelectorAll(".column").forEach((e) => {
    e.innerHTML = "";
  });
}
async function hasUsableLocalWorkspaceData() {
  try {
    return (await db.pages.filter((e) => !e.deletedAt).count()) > 0;
  } catch (e) {
    return (
      console.error("Failed to inspect usable local workspace data:", e),
      !1
    );
  }
}
function getWorkspaceStartupCacheDecision({
  hasOwnerVerifiedCachedWorkspace: e,
  initialWorkspaceRenderSucceeded: t,
  hasPendingAuthRedirect: r,
  workspaceAwaitingLoginSync: a,
}) {
  const o = !0 !== e || !0 !== t || !0 === r || !0 === a;
  return { requiresGuard: o, canRevealCachedWorkspace: !o };
}
async function reconcileWorkspaceRenderFromLocalData(e = {}) {
  const t = Number.isFinite(Number(e.attempts))
      ? Math.max(1, Math.floor(Number(e.attempts)))
      : 2,
    r = !0 === e.scrollToActive;
  let a = null;
  for (let e = 0; e < t; e += 1) {
    try {
      const e = await db.pages.filter((e) => !e.deletedAt).sortBy("order");
      if (0 === e.length) return { success: !1, reason: "no_pages" };
      (currentPageId && e.some((e) => e.id === currentPageId)) ||
        ((currentPageId = e[0].id),
        await chrome.storage.local.set({ currentPageId }));
      const t = await loadPagesNavigation({ scrollToActive: r });
      await ensureFirstTabSelected();
      const o = await loadBoardsFromDatabase();
      if (!0 === t && !0 === o) return { success: !0, pageId: currentPageId };
      if (
        !0 === t &&
        (_isInlineInputActive ||
          _isBoardDragInProgress ||
          _isBookmarkDragInProgress ||
          _loadBoardsInProgress ||
          _loadBoardsPending ||
          _loadBoardsPendingAfterDrag ||
          _loadBoardsPendingAfterBookmarkDrag ||
          _loadBoardsPendingAfterInput)
      )
        return { success: !1, reason: "render_deferred", deferred: !0 };
      a = new Error("Workspace renderer did not confirm a complete paint");
    } catch (e) {
      ((a = e), console.error("Workspace render reconciliation failed:", e));
    }
    e + 1 < t && (await new Promise((e) => setTimeout(e, 100)));
  }
  return { success: !1, reason: "render_failed", error: a?.message || null };
}
async function showVerifiedEmptyWorkspaceAccessGate(e) {
  const t = await refreshRuntimeSubscriptionStateFromStorage();
  if (!(await SyncManager._isUserContextCurrent(e)))
    return { success: !1, reason: "account_changed" };
  if (!t) return { success: !1, reason: "no_pages" };
  const r = captureSubscriptionRequestContext();
  if (r?.userId !== e) return { success: !1, reason: "account_changed" };
  const a = getRuntimeOnboardingSubscriptionStatus();
  return ["plan_required", "expired", "grace"].includes(a)
    ? ((window.pendingWorkspaceAccessUserId = e),
      (isColdWorkspaceHydrationPending = !0),
      setWorkspaceOwnerUserId(e),
      (currentPageId = null),
      clearAllColumns(),
      await ensureWallpaperPreferencesInitialized(),
      (await SyncManager._isUserContextCurrent(e))
        ? !1 ===
          (await updateSubscriptionUI(
            a,
            window.subscriptionDaysLeft,
            window.subscriptionData,
            r,
          ))
          ? { success: !1, reason: "account_changed" }
          : ("plan_required" === a
              ? await showRequiredPlanSelectionForCurrentUser(
                  a,
                  window.subscriptionData,
                  r,
                )
              : showExpiredOverlay(),
            isSubscriptionRequestContextCurrent(r)
              ? (await updateAuthUI({
                  skipOnboarding: !0,
                  skipSubscriptionCheck: !0,
                }),
                (await SyncManager._isUserContextCurrent(e))
                  ? (hideLoadingOverlay(),
                    finishWorkspaceStartupShell(),
                    { success: !0, accessRequired: !0 })
                  : { success: !1, reason: "account_changed" })
              : { success: !1, reason: "account_changed" })
        : { success: !1, reason: "account_changed" })
    : { success: !1, reason: "no_pages" };
}
async function resumeWorkspaceAfterAccessGranted(e) {
  const t = window.pendingWorkspaceAccessUserId;
  if (!t) return !0;
  if ("trial" !== e && "active" !== e) return !1;
  if (window.pendingWorkspaceAccessTask?.userId === t)
    return window.pendingWorkspaceAccessTask.promise;
  const isCurrent = async () =>
      window.pendingWorkspaceAccessUserId === t &&
      (await SyncManager._isUserContextCurrent(t)),
    r = { userId: t, promise: null };
  ((r.promise = (async () => {
    try {
      if (!(await isCurrent())) return !1;
      const e = await SyncManager.autoSyncOnLoad();
      if (!(await isCurrent())) return !1;
      if (!e.success) {
        if ("skipped" === e.status) return !1;
        throw new Error("Failed to import cloud data");
      }
      if ("access_required" === e.reason)
        return (await refreshRuntimeSubscriptionStateFromStorage(), !1);
      const r = await getCurrentWorkspaceOwnerCheckpoint();
      if (!isWorkspaceCacheOwnerVerified(t, r)) return !1;
      if (
        !(
          await reconcileWorkspaceRenderFromLocalData({
            attempts: 2,
            scrollToActive: !1,
          })
        ).success
      )
        throw new Error("Failed to import cloud data");
      if (!(await isCurrent())) return !1;
      if ((await recalculateBookmarkCount(), !(await isCurrent()))) return !1;
      if ("created_home" === e.reason)
        try {
          await chrome.storage.local.set({
            [WALLPAPER_NEW_USER_DEFAULT_SEED_STORAGE_KEY]: {
              userId: t,
              createdAt: Date.now(),
            },
          });
        } catch (e) {
          console.warn(
            "Failed to queue pending new-user wallpaper default seed:",
            e,
          );
        }
      return (
        !!(await isCurrent()) &&
        (await ensureWallpaperPreferencesInitialized({ refresh: !0 }),
        !!(await isCurrent()) &&
          ((window.pendingWorkspaceAccessUserId = null),
          setWorkspaceOwnerUserId(t),
          (isColdWorkspaceHydrationPending = !1),
          finishWorkspaceStartupShell(),
          !0))
      );
    } catch (e) {
      return (
        (await isCurrent()) &&
          (console.error(
            "Failed to load workspace after access became active:",
            e,
          ),
          await showWorkspaceLoadFailure(
            "Login succeeded, but we could not load your data. Please refresh and try again.",
          )),
        !1
      );
    }
  })()),
    (window.pendingWorkspaceAccessTask = r));
  try {
    return await r.promise;
  } finally {
    window.pendingWorkspaceAccessTask === r &&
      (window.pendingWorkspaceAccessTask = null);
  }
}
async function revealVerifiedLocalWorkspaceForUser(e, t = {}) {
  const r = normalizeSupabaseUserId(e);
  if (!r || !(await SyncManager._isUserContextCurrent(r)))
    return { success: !1, reason: "account_changed" };
  if (
    !isWorkspaceCacheOwnerVerified(
      r,
      await getCurrentWorkspaceOwnerCheckpoint(),
    )
  )
    return { success: !1, reason: "owner_unverified" };
  beginWorkspaceStartupShell();
  const a = await reconcileWorkspaceRenderFromLocalData({
    attempts: 2,
    scrollToActive: !1,
  });
  return a.success
    ? (await SyncManager._isUserContextCurrent(r))
      ? (await recalculateBookmarkCount(),
        await updateAuthUI({ skipOnboarding: !1 !== t.skipOnboarding }),
        await applyWallpaperCloudSyncState(
          (await chrome.storage.local.get("wallpaperCloudSyncState"))
            .wallpaperCloudSyncState,
          { source: t.source || "verified-local-workspace" },
        ),
        await ensureWallpaperPreferencesInitialized(),
        await applyWebsiteWallpaperHandoffFromUrl(),
        (await SyncManager._isUserContextCurrent(r))
          ? (setWorkspaceOwnerUserId(r),
            window.pendingWorkspaceAccessUserId === r &&
              (window.pendingWorkspaceAccessUserId = null),
            (isColdWorkspaceHydrationPending = !1),
            finishWorkspaceStartupShell(),
            { success: !0, pageId: a.pageId })
          : { success: !1, reason: "account_changed" })
      : { success: !1, reason: "account_changed" }
    : "no_pages" === a.reason
      ? showVerifiedEmptyWorkspaceAccessGate(r)
      : a;
}
function hideLoadingOverlay() {
  const e = document.getElementById("loadingOverlay");
  (e &&
    (e.classList.add("hidden"),
    setTimeout(() => {
      e.classList.contains("hidden") && (e.style.display = "none");
    }, 300)),
    (isInitialLoadComplete = !0));
}
async function showWorkspaceLoadFailure(e, t = {}) {
  const r = Number.isFinite(t.suppressReconcileMs)
    ? Math.max(t.suppressReconcileMs, 0)
    : 3e4;
  (resetCrossTabLoginWaitState(),
    suppressLateAuthReconcile(r),
    (isColdWorkspaceHydrationPending = !1),
    setWorkspaceOwnerUserId(null),
    (currentPageId = null));
  try {
    "undefined" != typeof chrome &&
      chrome.storage?.local?.remove &&
      (await chrome.storage.local.remove(["currentPageId"]));
  } catch (e) {
    console.warn(
      "Failed to clear currentPageId while showing workspace load failure:",
      e,
    );
  }
  (clearAllColumns(),
    hideLoadingOverlay(),
    resetAccountBoundaryTransientUi({
      quickTourReason: "workspace_load_failure",
    }),
    showWelcomeScreen(),
    showAuthError(e));
}
function resetAccountBoundaryTransientUi(e = {}) {
  ((window.pendingWorkspaceAccessUserId = null), closeBookmarkMenu());
  const t =
    "string" == typeof e.quickTourReason && e.quickTourReason.trim()
      ? e.quickTourReason.trim()
      : "account_boundary";
  (_onboardingRetryTimeoutId &&
    (clearTimeout(_onboardingRetryTimeoutId),
    (_onboardingRetryTimeoutId = null)),
    _onboardingOpenTimeoutId &&
      (clearTimeout(_onboardingOpenTimeoutId),
      (_onboardingOpenTimeoutId = null)),
    "function" == typeof dismissInlineInputs &&
      dismissInlineInputs("account_boundary"),
    "function" == typeof resetDragState && resetDragState(),
    "function" == typeof cleanupAllDragIndicators && cleanupAllDragIndicators(),
    "function" == typeof stopTabDragAutoScroll && stopTabDragAutoScroll(),
    "undefined" != typeof _cancelTabDragCompletion &&
      (_cancelTabDragCompletion = !0),
    "undefined" != typeof _isTabDragInProgress && (_isTabDragInProgress = !1),
    "undefined" != typeof _renderTabsPendingAfterDrag &&
      (_renderTabsPendingAfterDrag = !1),
    closeSettingsModal({ immediate: !0 }),
    closeWallpaperPopup(),
    closeChromeImportModal(),
    closeDeleteAccountModal(),
    closeOnboardingModal(),
    stopQuickTour(t),
    closeReviewPromptModal().catch((e) => {
      console.warn(
        "[ReviewPrompt] Failed to close modal during account-boundary cleanup:",
        e,
      );
    }));
}
function beginWorkspaceStartupShell() {
  const e = document.body;
  !e ||
    e.classList.contains("not-authenticated") ||
    e.classList.contains("workspace-startup-pending") ||
    (e.classList.add("workspace-startup-pending"),
    e.classList.remove("workspace-startup-indicator-visible"),
    workspaceStartupIndicatorTimeoutId &&
      clearTimeout(workspaceStartupIndicatorTimeoutId),
    (workspaceStartupIndicatorTimeoutId = window.setTimeout(() => {
      ((workspaceStartupIndicatorTimeoutId = null),
        document.body?.classList?.contains("workspace-startup-pending") &&
          (document.body.classList.contains("not-authenticated") ||
            document.body.classList.add(
              "workspace-startup-indicator-visible",
            )));
    }, 180)));
}
function finishWorkspaceStartupShell() {
  workspaceStartupIndicatorTimeoutId &&
    (clearTimeout(workspaceStartupIndicatorTimeoutId),
    (workspaceStartupIndicatorTimeoutId = null));
  const e = document.body;
  e &&
    (e.classList.remove("workspace-startup-indicator-visible"),
    e.classList.remove("workspace-startup-pending"),
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        "function" == typeof updateTabNavigation && updateTabNavigation();
      });
    }));
}
function queueLoggedOutThemeReset() {
  return (
    pendingLoggedOutThemeResetPromise ||
      (pendingLoggedOutThemeResetPromise = clearPersistedThemeWallpaperState()
        .catch((e) => {
          console.error(
            "Failed to clear theme state while showing welcome screen:",
            e,
          );
        })
        .finally(() => {
          pendingLoggedOutThemeResetPromise = null;
        })),
    pendingLoggedOutThemeResetPromise
  );
}
"undefined" != typeof chrome &&
  chrome.storage &&
  chrome.storage.onChanged &&
  chrome.storage.onChanged.addListener(async (e, t) => {
    try {
      const r =
        "local" === t && shouldApplyAccountScopedStorageUpdate(e.lumilist_user);
      if (
        ("local" === t &&
          e.lumilistLanguagePreference &&
          getLumiListLocalization() &&
          initLumiListLocalization()
            .then(() => {
              (refreshLocalizedDynamicSurfaces(),
                refreshSettingsQuickSaveControls().catch((e) => {
                  console.error(
                    "Failed to refresh quick save controls after language change:",
                    e,
                  );
                }),
                "function" == typeof updateSettingsSubscriptionDisplay &&
                  updateSettingsSubscriptionDisplay().catch((e) => {
                    console.error(
                      "Failed to refresh subscription settings after language change:",
                      e,
                    );
                  }));
            })
            .catch((e) => {
              console.error("Failed to apply language preference change:", e);
            }),
        "local" === t && e.privacyModeEnabled && r)
      ) {
        const t = !0 === e.privacyModeEnabled.newValue;
        t !== privacyModeEnabled &&
          ((privacyModeEnabled = t),
          updatePrivacyButtonState(),
          document.querySelectorAll(".board").forEach((e) => {
            privacyModeEnabled
              ? e.classList.add("privacy-blur")
              : e.classList.remove("privacy-blur");
          }));
      }
      if ("local" === t && e.incognitoModeEnabled && r) {
        const t = !0 === e.incognitoModeEnabled.newValue;
        t !== incognitoModeEnabled &&
          ((incognitoModeEnabled = t), updateIncognitoButtonState());
      }
      if ("local" === t && e.compactModeEnabled && r) {
        const t = !0 === e.compactModeEnabled.newValue;
        t !== compactModeEnabled &&
          ((compactModeEnabled = t),
          applyCompactMode(),
          updateCompactModeToggle());
      }
      if ("local" === t && e.floatingControlsCollapsedEnabled) {
        const t = !0 === e.floatingControlsCollapsedEnabled.newValue;
        t !== floatingControlsCollapsedEnabled &&
          ((floatingControlsCollapsedEnabled = t),
          applyFloatingControlsCollapsedState(),
          updateFloatingControlsCollapsedToggle());
      }
      if ("local" === t && e.largeBoardCollapseEnabled && r) {
        const t = !0 === e.largeBoardCollapseEnabled.newValue;
        t !== largeBoardCollapseEnabled &&
          ((largeBoardCollapseEnabled = t),
          updateLargeBoardCollapseToggle(),
          loadBoardsFromDatabase().catch((e) => {
            console.error(
              "Failed to refresh boards after large board collapse setting changed:",
              e,
            );
          }));
      }
      if ("local" === t && e.largeBoardVisibleBookmarkLimit && r) {
        const t = normalizeLargeBoardVisibleLimit(
          e.largeBoardVisibleBookmarkLimit.newValue,
        );
        t !== largeBoardVisibleBookmarkLimit &&
          ((largeBoardVisibleBookmarkLimit = t),
          updateLargeBoardVisibleLimitControl(),
          largeBoardCollapseEnabled &&
            loadBoardsFromDatabase().catch((e) => {
              console.error(
                "Failed to refresh boards after large board visible limit changed:",
                e,
              );
            }));
      }
      if ("local" === t && e.largeBoardExpandedBoardIds && r) {
        const t = normalizeExpandedBoardIdList(
          e.largeBoardExpandedBoardIds.newValue,
        );
        hasSameExpandedBoardIds(t) ||
          (setExpandedBoardIds(t),
          largeBoardCollapseEnabled &&
            loadBoardsFromDatabase().catch((e) => {
              console.error(
                "Failed to refresh boards after expanded board state changed:",
                e,
              );
            }));
      }
      if ("local" === t && e.themeMode && r) {
        const t = normalizeThemeMode(e.themeMode.newValue);
        if (t !== themeMode) {
          applyThemeMode(t);
          try {
            localStorage.setItem("lumilist_theme_mode", t);
          } catch (e) {}
        }
      }
      if ("local" === t && e.truncateTitles && r) {
        const t = !1 !== e.truncateTitles.newValue;
        applyTruncateTitlesSetting(t);
        const r = document.getElementById("truncateTitlesToggle");
        r && (r.checked = t);
      }
      if ("local" === t && e.openInNewTab && r) {
        const t = !0 === e.openInNewTab.newValue;
        if (t !== openLinksInNewTab) {
          ((openLinksInNewTab = t),
            applyOpenInNewTabSetting(openLinksInNewTab));
          const e = document.getElementById("openInNewTabToggle");
          e && (e.checked = openLinksInNewTab);
        }
      }
      if ("local" === t && e.closeTabsAfterSaveAllTabs && r) {
        const t = !0 === e.closeTabsAfterSaveAllTabs.newValue;
        if (t !== closeTabsAfterSaveAllTabsEnabled) {
          closeTabsAfterSaveAllTabsEnabled = t;
          const e = document.getElementById("closeTabsAfterSaveAllToggle");
          e && (e.checked = closeTabsAfterSaveAllTabsEnabled);
        }
      }
      if (
        ("local" === t &&
          e.wallpaperCloudSyncState &&
          r &&
          applyWallpaperCloudSyncState(e.wallpaperCloudSyncState.newValue, {
            source: "storage-change",
          }).catch((e) => {
            console.error(
              "Failed to apply wallpaper cloud sync state from storage change:",
              e,
            );
          }),
        "local" === t && e.installedWallpaperCatalogVersion && r)
      ) {
        const t =
          "string" == typeof e.installedWallpaperCatalogVersion.newValue
            ? e.installedWallpaperCatalogVersion.newValue
            : null;
        t &&
          t !== installedWallpaperCatalogVersion &&
          ((installedWallpaperCatalogVersion = t),
          loadInstalledWallpaperCatalog().catch((e) => {
            console.error(
              "Failed to refresh installed wallpaper catalog after storage change:",
              e,
            );
          }));
      }
      if ("local" === t && e.wallpaperLocalStateByUser && r) {
        const t = {
          [WALLPAPER_ACCOUNT_LOCAL_STATE_STORAGE_KEY]:
            e.wallpaperLocalStateByUser.newValue,
        };
        (e.themeMode && (t.themeMode = e.themeMode.newValue),
          e[WALLPAPER_STORAGE_KEY] &&
            (t[WALLPAPER_STORAGE_KEY] = e[WALLPAPER_STORAGE_KEY].newValue),
          refreshAccountScopedWallpaperStateFromStorage(t).catch((e) => {
            console.error(
              "Failed to refresh account-scoped wallpaper state after storage change:",
              e,
            );
          }));
      }
      if (
        "local" === t &&
        e[WALLPAPER_STORAGE_KEY] &&
        r &&
        !getWallpaperAccountScopeUserId()
      ) {
        const t = e[WALLPAPER_STORAGE_KEY].newValue,
          { selection: r } = reconcileWallpaperSelection(t, {
            preserveHostedSelections: !0,
          });
        areWallpaperSelectionsEqual(wallpaperSelectionByTheme, r) ||
          ((wallpaperSelectionByTheme = r),
          cacheWallpaperSelectionLocally(wallpaperSelectionByTheme),
          applyActiveThemeWallpaper(),
          renderWallpaperPopup({ preserveScroll: !0 }));
      }
      if ("local" === t && e.quickSavePageId && r) {
        const e = document.getElementById("settingsModal");
        e &&
          e.classList.contains("active") &&
          refreshSettingsQuickSaveControls().catch((e) => {
            console.error(
              "Failed to refresh quick save settings after storage change:",
              e,
            );
          });
      }
      if ("local" === t && e.privateLinksIncognito && r) {
        const t = document.getElementById("privateLinksIncognitoToggle");
        t && (t.checked = !1 !== e.privateLinksIncognito.newValue);
      }
      if ("local" === t && e.showBookmarkNotes && r) {
        const t = !1 !== e.showBookmarkNotes.newValue;
        if (t !== showBookmarkNotes) {
          ((showBookmarkNotes = t),
            applyShowBookmarkNotesSetting(showBookmarkNotes));
          const e = document.getElementById("showBookmarkNotesToggle");
          e && (e.checked = showBookmarkNotes);
        }
      }
      const a =
        "local" === t
          ? Object.entries(e).find(
              ([e]) => e.startsWith("sb-") && e.endsWith("-auth-token"),
            )
          : null;
      if (a && !isCurrentTabAuthenticating) {
        const [, e] = a;
        e?.newValue &&
          e.newValue !== e.oldValue &&
          queueStoredSupabaseSessionAdoption().catch((e) => {
            console.error(
              "Failed to adopt updated Supabase session from shared storage:",
              e,
            );
          });
      }
      if ("local" === t && e.lumilist_user) {
        if (isCurrentTabAuthenticating) return;
        const t = e.lumilist_user.oldValue,
          r = e.lumilist_user.newValue;
        if (t && !r) {
          if (!(await settleSharedSignedOutUi(t.id))) return;
          if (
            !(await SyncManager.clearAccountWorkspaceSnapshot(t.id, () =>
              shouldProcessSharedStoredUserLogout(t.id),
            ))
          )
            return void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
              "shared_logout_cleanup_changed",
            ));
          if (!(await shouldProcessSharedStoredUserLogout(t.id)))
            return void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
              "shared_logout_cleanup_superseded",
            ));
          if (t?.id && "undefined" != typeof chrome && chrome.storage?.local) {
            const e = `lumilist_onboarding_owner_${t.id}`;
            await chrome.storage.local.remove(e);
          }
          if (
            (setWorkspaceOwnerUserId(null),
            await resetWallpaperStateForAccountBoundary({
              clearPersistedState: !0,
            }),
            !(await shouldProcessSharedStoredUserLogout(t.id)))
          )
            return;
          ("undefined" != typeof SyncManager &&
            SyncManager._supabase &&
            (SyncManager._supabase = null),
            (window.subscriptionStatus = null),
            (window.subscriptionDaysLeft = null),
            (window.subscriptionData = null),
            await updateAuthUI());
        } else if (r && (!t || t.id !== r.id)) {
          if (
            "undefined" != typeof SyncManager &&
            "function" == typeof SyncManager._isUserContextCurrent &&
            !(await SyncManager._isUserContextCurrent(r.id))
          )
            return;
          if (
            (setActiveStoredUserId(r.id),
            (_pendingAuthChange = {
              oldValue: t,
              newValue: r,
              timestamp: Date.now(),
            }),
            !initialAuthCompleted)
          )
            return (
              (isColdWorkspaceHydrationPending = !0),
              void beginWorkspaceStartupShell()
            );
          const e = Date.now(),
            a = t?.id || null;
          if (
            _lastProcessedAuthChange.userId === r.id &&
            _lastProcessedAuthChange.oldUserId === a &&
            e - _lastProcessedAuthChange.timestamp < 1e3
          )
            return;
          ((_lastProcessedAuthChange = {
            userId: r.id,
            oldUserId: a,
            timestamp: e,
          }),
            t?.id &&
              t.id !== r.id &&
              (setWorkspaceOwnerUserId(r.id),
              resetWallpaperStateForAccountBoundary({
                clearPersistedState: !0,
              }).catch((e) => {
                console.error(
                  "Failed to reset wallpaper state during cross-tab account switch:",
                  e,
                );
              })),
            beginCrossTabLoginWait(r.id));
        }
      }
      if ("local" === t && e.lumilist_session_invalidated?.newValue) {
        const t = e.lumilist_session_invalidated.newValue;
        handleSessionInvalidation(
          t?.reason || "Session expired. Please login again.",
          { expectedUserId: t?.userId || null },
        ).catch((e) => {
          console.error("Error handling cross-tab session invalidation:", e);
        });
      }
      if ("local" === t && e.lumilist_login_sync_complete) {
        const t = e.lumilist_login_sync_complete.newValue;
        if (!t?.userId) return;
        if (isCurrentTabAuthenticating) return;
        if (!initialAuthCompleted) return void (_pendingLoginSyncSignal = t);
        (async () => {
          await handleLoginSyncCompleteSignal(t);
        })();
      }
    } catch (e) {
      console.error("Error in storage change handler:", e);
    }
  });
const SEARCH_BEHAVIOR_STORAGE_KEY = "lumilist_search_behavior_v1",
  SEARCH_BEHAVIOR_DECAY_WINDOW_DAYS = 21,
  SEARCH_ALIAS_MAP = Object.freeze({
    gsc: ["google", "search", "console"],
    gdrive: ["google", "drive"],
    gdoc: ["google", "docs"],
    gdocs: ["google", "docs"],
    gsheet: ["google", "sheets"],
    gsheets: ["google", "sheets"],
    gcal: ["google", "calendar"],
    ga: ["google", "analytics"],
    gads: ["google", "ads"],
    yt: ["youtube"],
    gm: ["gmail"],
  }),
  SEARCH_SCOPE_OPTIONS = Object.freeze({
    ALL: "all",
    BOARD: "board",
    TITLE: "title",
    URL: "url",
    NOTE: "note",
  }),
  SEARCH_SCOPE_VALUES = Object.freeze(Object.values(SEARCH_SCOPE_OPTIONS)),
  SEARCH_MATCH_MODE_OPTIONS = Object.freeze({
    SMART: "smart",
    STRICT: "strict",
  }),
  SEARCH_MATCH_MODE_VALUES = Object.freeze(
    Object.values(SEARCH_MATCH_MODE_OPTIONS),
  ),
  SEARCH_DEFAULT_OPTIONS = Object.freeze({
    scope: SEARCH_SCOPE_OPTIONS.ALL,
    matchMode: SEARCH_MATCH_MODE_OPTIONS.SMART,
  }),
  searchFeature = featureFactories.search({
    searchState,
    searchBehaviorStorageKey: SEARCH_BEHAVIOR_STORAGE_KEY,
    searchBehaviorDecayWindowDays: 21,
    searchAliasMap: SEARCH_ALIAS_MAP,
    searchScopeOptions: SEARCH_SCOPE_OPTIONS,
    searchScopeValues: SEARCH_SCOPE_VALUES,
    searchMatchModeOptions: SEARCH_MATCH_MODE_OPTIONS,
    searchMatchModeValues: SEARCH_MATCH_MODE_VALUES,
    searchDefaultOptions: SEARCH_DEFAULT_OPTIONS,
    db,
    safeParseInt,
    escapeHTML,
    sanitizeUrl,
    sanitizeBookmarkNote,
    initializeNewFavicons,
    closeImportPopup,
    closeTabContextMenu,
    closeBoardMenus,
    switchToPage,
    loadBoardsFromDatabase,
    getCurrentPageId: () => currentPageId,
    getIncognitoModeEnabled: () => incognitoModeEnabled,
    getOpenLinksInNewTab: () => openLinksInNewTab,
  }),
  {
    closeSearchOverlay,
    refreshSearchIfOpen,
    initSearchFeature,
    isSearchOverlayOpen,
    openSearchOverlay,
    toggleSearchOverlay,
    rebuildSearchDataset,
    performSearch,
    renderSearchResults,
  } = searchFeature,
  wallpaperFeature = featureFactories.wallpaper({
    getThemeMode: () => themeMode,
    setThemeMode: (e) => {
      themeMode = e;
    },
    canMutateAccountScopedPreferences,
    getWallpaperAccountScopeUserId,
    getWallpaperAccountUser: () => SyncManager.getStoredUser(),
    getWallpaperCatalogByTheme: () => wallpaperCatalogByTheme,
    setWallpaperCatalogByTheme: (e) => {
      wallpaperCatalogByTheme = e;
    },
    setBundledWallpaperCatalogState,
    getWallpaperSelectionByTheme: () => wallpaperSelectionByTheme,
    setWallpaperSelectionByTheme: (e) => {
      wallpaperSelectionByTheme = e;
      cacheWallpaperSelectionLocally(e);
      if ("undefined" != typeof chrome && chrome.storage?.local)
        chrome.storage.local
          .set({ [WALLPAPER_STORAGE_KEY]: e })
          .catch((t) => {
            console.warn(
              "Failed to persist wallpaper selection for restart:",
              t,
            );
          });
    },
    getWallpaperThemeDefaults: () => wallpaperThemeDefaults,
    setWallpaperThemeDefaults: (e) => {
      wallpaperThemeDefaults = e;
    },
    normalizeWallpaperStyleConfig,
    getWallpaperStyleOverridesByTheme: () => wallpaperStyleOverridesByTheme,
    setWallpaperStyleOverridesByTheme: (e) => {
      wallpaperStyleOverridesByTheme =
        normalizeWallpaperUserStyleOverrideState(e);
    },
    getHostedWallpaperCatalogPromise: () => hostedWallpaperCatalogPromise,
    setHostedWallpaperCatalogPromise: (e) => {
      hostedWallpaperCatalogPromise = e;
    },
    getHostedWallpaperGalleryPromise: () => hostedWallpaperGalleryPromise,
    setHostedWallpaperGalleryPromise: (e) => {
      hostedWallpaperGalleryPromise = e;
    },
    getWallpaperPreferencesInitialized: () => wallpaperPreferencesInitialized,
    setWallpaperPreferencesInitialized: (e) => {
      wallpaperPreferencesInitialized = !0 === e;
    },
    wallpaperStorageKey: WALLPAPER_STORAGE_KEY,
    wallpaperLocalCacheKey: WALLPAPER_LOCAL_CACHE_KEY,
    wallpaperStyleLocalCacheKey: WALLPAPER_STYLE_LOCAL_CACHE_KEY,
    wallpaperBinaryCacheLocalKey: WALLPAPER_BINARY_CACHE_LOCAL_KEY,
    wallpaperBootStyleCachePrefix: "lumilist_wallpaper_boot_style_",
    wallpaperBootBinaryCachePrefix: "lumilist_wallpaper_boot_binary_",
    wallpaperBootSourceCachePrefix: "lumilist_wallpaper_boot_source_",
    wallpaperAccountLocalStateStorageKey: "wallpaperLocalStateByUser",
    wallpaperCloudSyncStateStorageKey: "wallpaperCloudSyncState",
    wallpaperPendingHandoffStorageKey: WALLPAPER_PENDING_HANDOFF_STORAGE_KEY,
    wallpaperNewUserDefaultSeedStorageKey:
      WALLPAPER_NEW_USER_DEFAULT_SEED_STORAGE_KEY,
    wallpaperCatalogPath: WALLPAPER_CATALOG_PATH,
    wallpaperRemoteCatalogUrl: WALLPAPER_REMOTE_CATALOG_URL,
    wallpaperRemoteGalleryUrl: WALLPAPER_REMOTE_GALLERY_URL,
    wallpaperRemoteStoragePrefix: WALLPAPER_REMOTE_STORAGE_PREFIX,
    wallpaperFilePattern: WALLPAPER_FILE_PATTERN,
    wallpaperUrlParam: "wallpaper",
    wallpaperGalleryIdUrlParam: "wallpaperGalleryId",
    wallpaperThemeUrlParam: "wallpaperTheme",
    defaultWallpaperTileId: "__default__",
    defaultWallpaperThemeStyles: DEFAULT_WALLPAPER_THEME_STYLES,
    normalizeThemeMode,
    createEmptyWallpaperStyleOverrideState,
    createEmptyWallpaperCatalog,
    createEmptyWallpaperThemeDefaults,
    normalizeWallpaperCatalog,
    normalizeWallpaperUserStyleOverride,
    normalizeWallpaperUserStyleOverrideState,
    getWallpaperCatalogEntriesForTheme,
    mergeWallpaperCatalogs,
    getCurrentWallpaperCatalogState,
    getWallpaperNewUserDefaultConfig: () => wallpaperNewUserDefaultConfig,
    isHostedWallpaperUrl,
    isInstalledWallpaperRef,
    hasCachedHostedWallpaperBinary,
    getCachedWallpaperBinaryDataUrl,
    getInstalledWallpaperRecordByRef,
    findInstalledWallpaperRefBySourceUrl,
    findInstalledWallpaperRefByRemoteIdentity,
    resolveWallpaperRenderSource,
    findWallpaperCatalogEntry,
    findEquivalentWallpaperCatalogEntry,
    areWallpaperSelectionsEqual,
    reconcileWallpaperSelection,
    cacheWallpaperSelectionLocally,
    readCachedWallpaperSelection,
    hasConfiguredWallpaperUserStyleOverride,
    getResolvedWallpaperStyleForTheme,
    cacheWallpaperStyleLocally,
    ensureHostedWallpaperBinaryCache,
    ensureInstalledWallpaperBinaryCache,
    loadInstalledWallpaperCatalogFromDatabase,
    installWallpaperBlobLocally,
    installRemoteWallpaperLocally,
    isWallpaperRemoteAssetMissingError,
    removeInstalledWallpaperRecordLocally,
    setInstalledWallpaperStyleLocally,
    setInstalledWallpaperArchiveStateLocally,
    normalizeWallpaperPathForTheme,
    formatWallpaperLabelFromFile,
    toHostedWallpaperUrl,
    recordUndoRedoHistoryEntry,
    buildUndoRedoEntityKey,
    pruneUndoRedoHistoryForEntityKeys,
    clearRedoTailAfterNonUndoableMutation,
    setUndoRedoBlockedReason,
    recordWallpaperDiagnosticEvent,
    updateLoadingMessage,
    applyThemeStyleTokens,
    toCssUrlValue,
    buildSyncSafeWallpaperSelection,
    isLocalOnlyInstalledWallpaperRef,
    localUserWallpaperSourceType: "user-upload",
    showGlassToast,
  }),
  {
    renderWallpaperPopup,
    applyActiveThemeWallpaper,
    applyLoggedOutDefaultThemeUi,
    clearPersistedThemeWallpaperState,
    setWallpaperSelection,
    handleWallpaperThemeButtonClick,
    handleWallpaperTileClick,
    handleWallpaperTileContextMenu,
    handleWallpaperContextMenuClick,
    handleWallpaperUploadButtonClick,
    handleWallpaperUploadInputChange,
    handleWallpaperDropZoneDragEnter,
    handleWallpaperDropZoneDragOver,
    handleWallpaperDropZoneDragLeave,
    handleWallpaperDropZoneDrop,
    resetWallpaperDropZoneState,
    closeWallpaperContextMenu,
    loadWallpaperCatalog,
    loadHostedWallpaperCatalog,
    loadInstalledWallpaperCatalog,
    loadWallpaperSelectionFromStorage,
    loadWallpaperStyleOverridesFromStorage,
    initializeWallpaperPreferences,
    handleWallpaperPopupOpened,
    applyCloudWallpaperPreferences,
    applyThemeMode,
    saveThemeModeToStorage,
    loadThemeModeFromStorage,
    refreshAccountScopedWallpaperStateFromStorage,
    applyWebsiteWallpaperHandoffFromUrl,
    updateThemeModeToggle,
    initializeWallpaperStyleEditorDrag,
    closeWallpaperStyleEditor,
    resetWallpaperStyleEditorDraft,
    saveWallpaperStyleEditorDraft,
  } = wallpaperFeature;
let wallpaperPreferencesInitializationPromise = null,
  wallpaperPreferencesInitializationScopeUserId = null;
async function resetThemeForLoggedOutState() {
  const e = "light" === themeMode ? "light" : "dark";
  applyLoggedOutDefaultThemeUi();
  applyThemeMode(e, {
    applyWallpaper: !0,
    renderPopup: !0,
    hydrateSelection: !1,
  });
  try {
    localStorage.setItem("lumilist_theme_mode", e);
  } catch (t) {
    console.warn("Failed to preserve theme mode locally:", t);
  }
  if ("undefined" != typeof chrome && chrome.storage?.local)
    try {
      await chrome.storage.local.set({ themeMode: e });
    } catch (t) {
      console.warn("Failed to preserve theme mode in Chrome storage:", t);
    }
}
function ensureWallpaperPreferencesInitialized({ refresh: e = !1 } = {}) {
  const t = getWallpaperAccountScopeUserId() || null;
  if (
    wallpaperPreferencesInitializationPromise &&
    t === wallpaperPreferencesInitializationScopeUserId &&
    !e
  )
    return wallpaperPreferencesInitializationPromise;
  const r = wallpaperPreferencesInitializationPromise,
    a = wallpaperPreferencesInitializationScopeUserId,
    o = (async () => {
      (e && r && a === t && (await r.catch(() => {})),
        (getWallpaperAccountScopeUserId() || null) === t &&
          (await initializeWallpaperPreferences()));
    })();
  return (
    (wallpaperPreferencesInitializationScopeUserId = t),
    (wallpaperPreferencesInitializationPromise = o),
    o.catch(() => {
      wallpaperPreferencesInitializationPromise === o &&
        ((wallpaperPreferencesInitializationPromise = null),
        (wallpaperPreferencesInitializationScopeUserId = null));
    }),
    o
  );
}
async function resetWallpaperStateForAccountBoundary({
  clearPersistedState: e = !0,
} = {}) {
  ((wallpaperPreferencesInitializationPromise = null),
    (wallpaperPreferencesInitializationScopeUserId = null),
    (wallpaperPreferencesInitialized = !1),
    e ? await resetThemeForLoggedOutState() : applyLoggedOutDefaultThemeUi(),
    await loadInstalledWallpaperCatalog({ apply: !0 }));
}
async function applyWallpaperCloudSyncState(e, { source: t = "storage" } = {}) {
  return wallpaperCloudSyncState;
}
let morphActionHandlerInitialized = !1;
function initMorphActionHandler() {
  if (morphActionHandlerInitialized) return;
  morphActionHandlerInitialized = !0;
  const e = document.querySelector(".container");
  if (!e) return;
  (e.addEventListener("contextmenu", handleBookmarkContextMenu),
    e.addEventListener("keydown", handleBookmarkMenuKeydown));
  let t = !1;
  (e.addEventListener("click", async (e) => {
    const r = e.target.closest(".add-board-placeholder");
    if (r && !e.target.closest(".board")) {
      const e = parseInt(r.dataset.targetColumn, 10);
      return void (isNaN(e) || showInlineBoardInput(e));
    }
    const a = e.target.closest("[data-action]");
    if (!a) return;
    const o = a.dataset.action,
      n = a.dataset.boardId ? a.dataset.boardId : null,
      i = a.dataset.bookmarkId ? a.dataset.bookmarkId : null;
    if (
      (e.preventDefault(), e.stopPropagation(), "toggle-bookmark-menu" !== o)
    ) {
      if ("toggle-board-menu" === o || !t)
        try {
          switch (((t = !0), o)) {
            case "add-bookmark":
              n && openAddBookmarkModal(n);
              break;
            case "show-remaining-bookmarks":
              n &&
                (revealBoardBookmarks(n) &&
                  (await saveExpandedBoardIdsToStorage()),
                "function" == typeof a.blur && a.blur(),
                await loadBoardsFromDatabase());
              break;
            case "collapse-board-bookmarks":
              n &&
                (collapseBoardBookmarks(n) &&
                  (await saveExpandedBoardIdsToStorage()),
                "function" == typeof a.blur && a.blur(),
                await loadBoardsFromDatabase());
              break;
            case "toggle-board-menu":
              n && toggleBoardMenu(n);
              break;
            case "open-all-links":
              n && (await openAllBoardLinks(n), closeBoardMenus());
              break;
            case "fetch-all-titles":
              n && (closeBoardMenus(), await fetchAllBoardLinkTitles(n));
              break;
            case "copy-all-links":
              n && (closeBoardMenus(), await copyAllBoardLinks(n));
              break;
            case "edit-board":
              n && (await openEditBoardModal(n), closeBoardMenus());
              break;
            case "share-board":
              if (n) {
                if (!canModify()) break;
                (closeBoardMenus(), await openShareModal("board", n));
              }
              break;
            case "delete-board":
              if (n) {
                const e = await db.boards.get(n);
                (e
                  ? await showDeleteConfirmation(e.name, "board", n)
                  : (console.error(
                      `Board ${n} not found in database - syncing with server`,
                    ),
                    showGlassToast(
                      llLiteral("Board not found. Syncing..."),
                      "warning",
                    ),
                    await SyncManager.autoSyncOnLoad(),
                    await loadBoardsFromDatabase()),
                  closeBoardMenus());
              }
              break;
            case "edit-bookmark":
              i && (await openEditBookmarkModal(i));
              break;
            case "delete-bookmark":
              if (i) {
                const e = await db.bookmarks.get(i);
                e && (await showDeleteConfirmation(e.title, "bookmark", i));
              }
          }
        } catch (e) {
          console.error(`Error handling action '${o}':`, e);
        } finally {
          t = !1;
        }
    } else toggleBookmarkMenu(a);
  }),
    document.body.addEventListener("click", async (e) => {
      const t = e.target.closest(".board-menu [data-action]");
      if (!t) return;
      const r = t.dataset.action,
        a = t.dataset.boardId ? t.dataset.boardId : null;
      (e.preventDefault(), e.stopPropagation());
      try {
        switch (r) {
          case "open-all-links":
            a && (await openAllBoardLinks(a), closeBoardMenus());
            break;
          case "fetch-all-titles":
            a && (closeBoardMenus(), await fetchAllBoardLinkTitles(a));
            break;
          case "copy-all-links":
            a && (closeBoardMenus(), await copyAllBoardLinks(a));
            break;
          case "edit-board":
            a && (await openEditBoardModal(a), closeBoardMenus());
            break;
          case "share-board":
            if (a) {
              if (!canModify()) break;
              (closeBoardMenus(), await openShareModal("board", a));
            }
            break;
          case "delete-board":
            if (a) {
              const e = await db.boards.get(a);
              (e
                ? await showDeleteConfirmation(e.name, "board", a)
                : (console.error(
                    `Board ${a} not found in database - syncing with server`,
                  ),
                  showGlassToast(
                    llLiteral("Board not found. Syncing..."),
                    "warning",
                  ),
                  await SyncManager.autoSyncOnLoad(),
                  await loadBoardsFromDatabase()),
                closeBoardMenus());
            }
        }
      } catch (e) {
        console.error(`Error handling board menu action '${r}':`, e);
      }
    }),
    e.addEventListener("click", function (e) {
      if (!isSelectionMode) return;
      const t = getBookmarkSelectionListItemFromEvent(e);
      t &&
        (isBookmarkActionClickTarget(e.target) ||
          (e.preventDefault(),
          e.stopPropagation(),
          toggleBookmarkSelectionForListItem(t)));
    }),
    e.addEventListener("dblclick", async (e) => {
      const t = e.target.closest(".board-title-text");
      if (!t) return;
      (e.stopPropagation(), e.preventDefault());
      const r = t.closest(".board");
      if (!r) return;
      const a = r.dataset.boardId;
      if (a)
        try {
          const e = await db.bookmarks
            .where("boardId")
            .equals(a)
            .filter((e) => !e.deletedAt)
            .toArray();
          if (0 === e.length) return;
          if (
            e.length > 5 &&
            !(await showGlassConfirm(
              llT("board.openMultipleConfirmTitle"),
              llT("board.openMultipleConfirmMessage", { count: e.length }),
              { confirmText: llT("board.openMultipleConfirmButton") },
            ))
          )
            return;
          const t = e.filter((e) => e.url).map((e) => e.url);
          openMultipleUrls(t);
        } catch (e) {
          console.error("Error opening all board links:", e);
        }
    }));
}
function getBoardExpansionKey(e) {
  return String(e ?? "").trim();
}
function normalizeLargeBoardVisibleLimit(e) {
  const t = parseInt(e, 10);
  if (Number.isNaN(t)) return 10;
  if (LARGE_BOARD_VISIBLE_LIMIT_OPTIONS.includes(t)) return t;
  let r = 10,
    a = 1 / 0;
  for (const e of LARGE_BOARD_VISIBLE_LIMIT_OPTIONS) {
    const o = Math.abs(e - t);
    o < a && ((a = o), (r = e));
  }
  return r;
}
function normalizeExpandedBoardIdList(e) {
  if (!Array.isArray(e)) return [];
  const t = new Set();
  for (const r of e) {
    const e = getBoardExpansionKey(r);
    e && t.add(e);
  }
  return Array.from(t);
}
function setExpandedBoardIds(e) {
  expandedLargeBoardIds.clear();
  for (const t of e) expandedLargeBoardIds.add(t);
}
function hasSameExpandedBoardIds(e) {
  if (!Array.isArray(e)) return !1;
  if (e.length !== expandedLargeBoardIds.size) return !1;
  for (const t of e) if (!expandedLargeBoardIds.has(t)) return !1;
  return !0;
}
async function saveExpandedBoardIdsToStorage() {
  if ("undefined" != typeof chrome && chrome.storage && chrome.storage.local)
    try {
      await chrome.storage.local.set({
        [LARGE_BOARD_EXPANDED_IDS_STORAGE_KEY]: Array.from(
          expandedLargeBoardIds,
        ),
      });
    } catch (e) {
      console.error("Failed to save expanded board state:", e);
    }
}
async function pruneExpandedBoardIdsAgainstExistingBoards(e = {}) {
  const t = !0 === e.persist;
  try {
    const e = await db.boards.filter((e) => !e.deletedAt).primaryKeys(),
      r = new Set(e.map((e) => getBoardExpansionKey(e)));
    let a = !1;
    for (const e of Array.from(expandedLargeBoardIds))
      r.has(e) || (expandedLargeBoardIds.delete(e), (a = !0));
    a && t && (await saveExpandedBoardIdsToStorage());
  } catch (e) {
    console.error("Failed to prune expanded board IDs:", e);
  }
}
function isBoardExpanded(e) {
  return expandedLargeBoardIds.has(getBoardExpansionKey(e));
}
function shouldCollapseBoardBookmarks(e, t) {
  return (
    largeBoardCollapseEnabled &&
    t > largeBoardVisibleBookmarkLimit &&
    !isBoardExpanded(e)
  );
}
function getVisibleBookmarksForBoard(e, t) {
  return Array.isArray(t)
    ? shouldCollapseBoardBookmarks(e, t.length)
      ? t.slice(0, largeBoardVisibleBookmarkLimit)
      : t
    : [];
}
function getShowRemainingBookmarksLabel(e) {
  return 1 === e
    ? "Show remaining 1 bookmark"
    : `Show remaining ${e} bookmarks`;
}
function getCollapseBookmarksLabel() {
  return "Collapse";
}
function getBoardBookmarkToggleControl(e, t) {
  return !largeBoardCollapseEnabled || t <= largeBoardVisibleBookmarkLimit
    ? null
    : isBoardExpanded(e)
      ? {
          action: "collapse-board-bookmarks",
          label: getCollapseBookmarksLabel(),
        }
      : {
          action: "show-remaining-bookmarks",
          label: getShowRemainingBookmarksLabel(
            t - largeBoardVisibleBookmarkLimit,
          ),
        };
}
function updateLargeBoardCollapseToggle() {
  const e = document.getElementById("largeBoardCollapseToggle");
  (e && (e.checked = largeBoardCollapseEnabled),
    updateLargeBoardVisibleLimitControl());
}
function updateLargeBoardVisibleLimitControl() {
  const e = document.getElementById("largeBoardVisibleLimitSelect"),
    t = document.getElementById("largeBoardVisibleLimitSetting");
  (t && (t.style.display = largeBoardCollapseEnabled ? "flex" : "none"),
    e &&
      ((e.value = String(largeBoardVisibleBookmarkLimit)),
      (e.disabled = !largeBoardCollapseEnabled)));
}
async function loadLargeBoardCollapseSetting(e = null) {
  try {
    const t =
      e && "object" == typeof e
        ? e
        : await chrome.storage.local.get([
            "largeBoardCollapseEnabled",
            "largeBoardVisibleBookmarkLimit",
            "largeBoardExpandedBoardIds",
          ]);
    ((largeBoardCollapseEnabled = !0 === t.largeBoardCollapseEnabled),
      (largeBoardVisibleBookmarkLimit = normalizeLargeBoardVisibleLimit(
        t.largeBoardVisibleBookmarkLimit,
      )),
      setExpandedBoardIds(
        normalizeExpandedBoardIdList(t.largeBoardExpandedBoardIds),
      ),
      await pruneExpandedBoardIdsAgainstExistingBoards({ persist: !0 }),
      updateLargeBoardCollapseToggle());
  } catch (e) {
    console.error("Failed to load large board collapse setting:", e);
  }
}
async function handleLargeBoardCollapseToggle(e) {
  if (!canMutateAccountScopedPreferences())
    return void updateLargeBoardCollapseToggle();
  const t = !0 === e.target.checked;
  ((largeBoardCollapseEnabled = t), updateLargeBoardCollapseToggle());
  try {
    await chrome.storage.local.set({ largeBoardCollapseEnabled: t });
  } catch (e) {
    console.error("Failed to save large board collapse setting:", e);
  }
  try {
    await loadBoardsFromDatabase();
  } catch (e) {
    console.error(
      "Failed to refresh boards after updating large board collapse setting:",
      e,
    );
  }
}
function revealBoardBookmarks(e) {
  const t = getBoardExpansionKey(e);
  if (!t) return !1;
  const r = expandedLargeBoardIds.size;
  return (expandedLargeBoardIds.add(t), expandedLargeBoardIds.size !== r);
}
function collapseBoardBookmarks(e) {
  const t = getBoardExpansionKey(e);
  return !!t && expandedLargeBoardIds.delete(t);
}
async function handleLargeBoardVisibleLimitChange(e) {
  if (!canMutateAccountScopedPreferences())
    return void updateLargeBoardVisibleLimitControl();
  const t = normalizeLargeBoardVisibleLimit(e?.target?.value),
    r = t !== largeBoardVisibleBookmarkLimit;
  ((largeBoardVisibleBookmarkLimit = t), updateLargeBoardVisibleLimitControl());
  try {
    await chrome.storage.local.set({
      [LARGE_BOARD_VISIBLE_LIMIT_STORAGE_KEY]: t,
    });
  } catch (e) {
    console.error("Failed to save large board visible bookmark limit:", e);
  }
  if (r && largeBoardCollapseEnabled)
    try {
      await loadBoardsFromDatabase();
    } catch (e) {
      console.error(
        "Failed to refresh boards after changing visible bookmark limit:",
        e,
      );
    }
}
function normalizeThemeMode(e) {
  return "light" === e ? "light" : "dark";
}
function createEmptyWallpaperCatalog() {
  return { dark: [], light: [] };
}
function createEmptyWallpaperSelection() {
  return { dark: null, light: null };
}
function createEmptyWallpaperStyleOverrideState() {
  return { dark: null, light: null };
}
function createEmptyNewUserWallpaperDefaultConfig() {
  return {
    themeMode: null,
    selectionByTheme: createEmptyWallpaperSelection(),
    updatedAt: null,
  };
}
function normalizeBundledWallpaperPathForTheme(e, t) {
  if ("string" != typeof t) return null;
  const r = normalizeThemeMode(e),
    a = t.trim().replace(/^\/+/, "");
  return a.startsWith(`wallpaper/${r}/`) && WALLPAPER_FILE_PATTERN.test(a)
    ? a
    : null;
}
function normalizeNewUserWallpaperDefaultConfig(e, t = {}) {
  const r = isPlainObject(e) ? e : {},
    a = isPlainObject(r.selectionByTheme) ? r.selectionByTheme : {},
    o =
      "function" == typeof t.resolveSelectionFile
        ? t.resolveSelectionFile
        : normalizeBundledWallpaperPathForTheme,
    n = createEmptyWallpaperSelection();
  ["dark", "light"].forEach((e) => {
    n[e] = o(e, a[e]);
  });
  let i =
    "dark" === r.themeMode || "light" === r.themeMode ? r.themeMode : null;
  return (
    i || (i = n.dark ? "dark" : n.light ? "light" : null),
    {
      themeMode: i,
      selectionByTheme: n,
      updatedAt:
        "string" == typeof r.updatedAt && r.updatedAt.trim()
          ? r.updatedAt.trim()
          : null,
    }
  );
}
function normalizeWallpaperSyncUserId(e) {
  return "string" == typeof e && e.trim() ? e.trim() : null;
}
function createEmptyWallpaperCloudSyncState(e = null) {
  return {
    userId: normalizeWallpaperSyncUserId(e),
    hasConfiguredPreferences: !1,
    themeMode: null,
    selectionByTheme: createEmptyWallpaperSelection(),
    selectionPresenceByTheme: { dark: !1, light: !1 },
    installedWallpapers: [],
    updatedAt: null,
    fetchedAt: null,
  };
}
function getWallpaperCloudStateUpdatedAtMs(e) {
  const t = Date.parse(e?.updatedAt || "");
  return Number.isFinite(t) ? t : null;
}
function getNextWallpaperPreferenceUpdatedAt(
  e = wallpaperAccountScopeUserId,
  t = wallpaperCloudSyncState,
) {
  const r = normalizeWallpaperSyncUserId(e),
    a = normalizeWallpaperSyncUserId(t?.userId),
    o = r && a === r ? getWallpaperCloudStateUpdatedAtMs(t) : null,
    n = Date.now();
  return new Date(null !== o && o >= n ? o + 1 : n).toISOString();
}
function shouldIgnoreIncomingWallpaperCloudState(
  e,
  t = wallpaperCloudSyncState,
) {
  const r = normalizeWallpaperSyncUserId(e?.userId),
    a = normalizeWallpaperSyncUserId(t?.userId);
  if (!r || !a || r !== a) return !1;
  const o = getWallpaperCloudStateUpdatedAtMs(t);
  if (null === o) return !1;
  const n = getWallpaperCloudStateUpdatedAtMs(e);
  return null === n ? !0 === t?.hasConfiguredPreferences : n < o;
}
function getWallpaperCloudSyncStateFingerprint(e) {
  const t = e && "object" == typeof e ? e : {},
    r = Array.isArray(t.installedWallpapers)
      ? t.installedWallpapers.map((e) => ({
          id: "string" == typeof e?.id && e.id.trim() ? e.id.trim() : null,
          theme: normalizeThemeMode(e?.theme),
          remoteId:
            "string" == typeof e?.remoteId && e.remoteId.trim()
              ? e.remoteId.trim()
              : null,
          sourceUrl:
            "string" == typeof e?.sourceUrl && e.sourceUrl.trim()
              ? e.sourceUrl.trim()
              : null,
          version:
            "string" == typeof e?.version && e.version.trim()
              ? e.version.trim()
              : null,
          updatedAt:
            "string" == typeof e?.updatedAt && e.updatedAt.trim()
              ? e.updatedAt.trim()
              : null,
        }))
      : [];
  return JSON.stringify({
    userId: normalizeWallpaperSyncUserId(t.userId),
    hasConfiguredPreferences: !0 === t.hasConfiguredPreferences,
    themeMode:
      "dark" === t.themeMode || "light" === t.themeMode ? t.themeMode : null,
    selectionByTheme: {
      dark:
        "string" == typeof t?.selectionByTheme?.dark &&
        t.selectionByTheme.dark.trim()
          ? t.selectionByTheme.dark.trim()
          : null,
      light:
        "string" == typeof t?.selectionByTheme?.light &&
        t.selectionByTheme.light.trim()
          ? t.selectionByTheme.light.trim()
          : null,
    },
    selectionPresenceByTheme: {
      dark: !0 === t?.selectionPresenceByTheme?.dark,
      light: !0 === t?.selectionPresenceByTheme?.light,
    },
    updatedAt:
      "string" == typeof t.updatedAt && t.updatedAt.trim()
        ? t.updatedAt.trim()
        : null,
    installedWallpapers: r,
  });
}
function getWallpaperAccountScopeUserId() {
  return wallpaperAccountScopeUserId;
}
function setWallpaperAccountScopeUserId(e) {
  const t = normalizeWallpaperSyncUserId(e),
    r = t !== wallpaperAccountScopeUserId;
  if (
    ((wallpaperAccountScopeUserId = t),
    r &&
      ((wallpaperLastAppliedCloudSyncFingerprint = null),
      pendingWallpaperCloudSyncFingerprints.clear()),
    !t)
  )
    return (
      (wallpaperCloudSyncState = createEmptyWallpaperCloudSyncState(null)),
      (wallpaperPreferenceSyncReadyUserId = null),
      (wallpaperPreferenceSyncPending = !1),
      void (r && (wallpaperCloudSyncApplyChain = Promise.resolve()))
    );
  (wallpaperCloudSyncState?.userId !== t &&
    (wallpaperCloudSyncState = createEmptyWallpaperCloudSyncState(t)),
    wallpaperPreferenceSyncReadyUserId &&
      wallpaperPreferenceSyncReadyUserId !== t &&
      (wallpaperPreferenceSyncReadyUserId = null));
}
function createWallpaperCatalogState(
  e,
  t = wallpaperThemeDefaults,
  r = wallpaperNewUserDefaultConfig,
) {
  return {
    themes: isPlainObject(e) ? e : createEmptyWallpaperCatalog(),
    themeDefaults: isPlainObject(t) ? t : createEmptyWallpaperThemeDefaults(),
    newUserDefault: isPlainObject(r)
      ? r
      : createEmptyNewUserWallpaperDefaultConfig(),
  };
}
function rebuildWallpaperCatalogState() {
  const e = mergeWallpaperCatalogs(
    createWallpaperCatalogState(
      bundledWallpaperCatalogByTheme,
      wallpaperThemeDefaults,
    ),
    createWallpaperCatalogState(
      installedWallpaperCatalogByTheme,
      wallpaperThemeDefaults,
    ),
  );
  wallpaperCatalogByTheme = e.themes;
}
function setBundledWallpaperCatalogState(e) {
  ((bundledWallpaperCatalogByTheme = isPlainObject(e?.themes)
    ? e.themes
    : createEmptyWallpaperCatalog()),
    (wallpaperThemeDefaults = isPlainObject(e?.themeDefaults)
      ? e.themeDefaults
      : createEmptyWallpaperThemeDefaults()),
    (wallpaperNewUserDefaultConfig = normalizeNewUserWallpaperDefaultConfig(
      e?.newUserDefault,
    )),
    rebuildWallpaperCatalogState(),
    persistLoggedOutDefaultVisualSnapshot());
}
function setInstalledWallpaperCatalogState(e) {
  ((installedWallpaperCatalogByTheme = isPlainObject(e)
    ? e
    : createEmptyWallpaperCatalog()),
    rebuildWallpaperCatalogState());
}
function isPlainObject(e) {
  return null !== e && "object" == typeof e && !Array.isArray(e);
}
function createEmptyWallpaperDiagnosticsCounters() {
  return {
    hostedCatalogRequests: 0,
    hostedCatalogFailures: 0,
    galleryManifestRequests: 0,
    galleryManifestFailures: 0,
    installDownloads: 0,
    installFailures: 0,
    migrationAttempts: 0,
    migrationFailures: 0,
    bootFallbackUses: 0,
  };
}
function createEmptyWallpaperDiagnosticsState() {
  return {
    version: 1,
    rolloutFlags: { ...WALLPAPER_RUNTIME_ROLLOUT_FLAGS },
    counters: createEmptyWallpaperDiagnosticsCounters(),
    events: [],
    lastUpdatedAt: null,
  };
}
function sanitizeWallpaperDiagnosticString(e, t = 220) {
  const r =
    "string" == typeof e
      ? e.replace(/\s+/g, " ").trim()
      : String(e ?? "")
          .replace(/\s+/g, " ")
          .trim();
  return r ? (r.length > t ? `${r.slice(0, t)}...` : r) : "";
}
function normalizeWallpaperDiagnosticDetailValue(e, t = 0) {
  if (null === e || "boolean" == typeof e) return e;
  if ("number" == typeof e) return Number.isFinite(e) ? e : null;
  if ("string" == typeof e) return sanitizeWallpaperDiagnosticString(e);
  if (e instanceof Error)
    return sanitizeWallpaperDiagnosticString(e.message || String(e));
  if (Array.isArray(e))
    return t >= 1
      ? e.length
      : e
          .slice(0, 6)
          .map((e) => normalizeWallpaperDiagnosticDetailValue(e, t + 1));
  if (isPlainObject(e)) {
    if (t >= 1) return Object.keys(e).slice(0, 6);
    const r = {};
    return (
      Object.entries(e)
        .slice(0, 10)
        .forEach(([e, a]) => {
          const o = normalizeWallpaperDiagnosticDetailValue(a, t + 1);
          void 0 !== o && (r[e] = o);
        }),
      r
    );
  }
  return void 0 !== e ? sanitizeWallpaperDiagnosticString(e) : void 0;
}
function normalizeWallpaperDiagnosticDetail(e) {
  if (!isPlainObject(e)) {
    const t = normalizeWallpaperDiagnosticDetailValue(e);
    return void 0 === t ? {} : { value: t };
  }
  const t = {};
  return (
    Object.entries(e)
      .slice(0, 10)
      .forEach(([e, r]) => {
        const a = normalizeWallpaperDiagnosticDetailValue(r);
        void 0 !== a && (t[e] = a);
      }),
    t
  );
}
function readWallpaperDiagnosticsState() {
  const e = createEmptyWallpaperDiagnosticsState();
  try {
    const t = localStorage.getItem(WALLPAPER_DIAGNOSTICS_LOCAL_KEY);
    if (!t) return e;
    const r = JSON.parse(t),
      a = isPlainObject(r?.counters) ? r.counters : {},
      o = createEmptyWallpaperDiagnosticsCounters();
    WALLPAPER_DIAGNOSTIC_COUNTER_KEYS.forEach((e) => {
      const t = Number(a[e]);
      o[e] = Number.isFinite(t) && t >= 0 ? Math.floor(t) : 0;
    });
    const n = Array.isArray(r?.events)
      ? r.events
          .filter(
            (e) =>
              isPlainObject(e) && "string" == typeof e.type && e.type.trim(),
          )
          .slice(0, 60)
          .map((e) => ({
            at: "string" == typeof e.at && e.at.trim() ? e.at.trim() : null,
            type: sanitizeWallpaperDiagnosticString(e.type, 120),
            detail: normalizeWallpaperDiagnosticDetail(e.detail),
          }))
      : [];
    return {
      version: 1,
      rolloutFlags: { ...WALLPAPER_RUNTIME_ROLLOUT_FLAGS },
      counters: o,
      events: n,
      lastUpdatedAt:
        "string" == typeof r?.lastUpdatedAt && r.lastUpdatedAt.trim()
          ? r.lastUpdatedAt.trim()
          : null,
    };
  } catch (t) {
    return e;
  }
}
function writeWallpaperDiagnosticsState(e) {
  try {
    return (
      localStorage.setItem(WALLPAPER_DIAGNOSTICS_LOCAL_KEY, JSON.stringify(e)),
      !0
    );
  } catch (e) {
    return !1;
  }
}
function recordWallpaperDiagnosticEvent(e, t = {}, r = {}) {
  if (!0 !== WALLPAPER_RUNTIME_ROLLOUT_FLAGS.diagnosticsEnabled) return null;
  const a = sanitizeWallpaperDiagnosticString(e, 120);
  if (!a) return null;
  const o = readWallpaperDiagnosticsState(),
    n = "string" == typeof r?.counter ? r.counter.trim() : "",
    i = Number(r?.counterDelta),
    s = Number.isFinite(i) ? Math.floor(i) : 1;
  n &&
    Object.prototype.hasOwnProperty.call(o.counters, n) &&
    0 !== s &&
    (o.counters[n] = Math.max(0, o.counters[n] + s));
  const l = {
    at: new Date().toISOString(),
    type: a,
    detail: normalizeWallpaperDiagnosticDetail(t),
  };
  return (
    (o.events = [l, ...o.events].slice(0, 60)),
    (o.lastUpdatedAt = l.at),
    writeWallpaperDiagnosticsState(o),
    l
  );
}
function clearWallpaperDiagnosticsState() {
  const e = createEmptyWallpaperDiagnosticsState();
  return (writeWallpaperDiagnosticsState(e), e);
}
function getWallpaperDiagnosticsSnapshot() {
  return readWallpaperDiagnosticsState();
}
function exposeWallpaperDiagnosticsDebugApi() {
  "undefined" != typeof window &&
    (window.LumiListWallpaperDebug = {
      getSnapshot: () => getWallpaperDiagnosticsSnapshot(),
      clear: () => clearWallpaperDiagnosticsState(),
      getRolloutFlags: () => ({ ...WALLPAPER_RUNTIME_ROLLOUT_FLAGS }),
    });
}
function clampNumber(e, t, r, a) {
  const o = Number(e);
  return Number.isFinite(o) ? Math.min(r, Math.max(t, o)) : a;
}
function normalizeHexColor(e, t) {
  const r = "string" == typeof e ? e.trim() : "",
    a = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(r);
  if (!a) return t;
  const o = a[1];
  return 3 === o.length
    ? `#${o
        .split("")
        .map((e) => e + e)
        .join("")
        .toUpperCase()}`
    : `#${o.toUpperCase()}`;
}
function normalizeOverlayAngle(e, t) {
  const r = Number(e);
  return Number.isFinite(r) ? Number((((r % 360) + 360) % 360).toFixed(3)) : t;
}
function normalizeOpacity(e, t) {
  const r = clampNumber(e, 0, 1, t);
  return Number(r.toFixed(3));
}
function normalizeBoardBackdropBlur(e, t) {
  const r = clampNumber(e, 0, 40, t);
  return Number(r.toFixed(2));
}
function normalizeBoardBackdropSaturate(e, t) {
  const r = clampNumber(e, 0, 300, t);
  return Number(r.toFixed(2));
}
function normalizeInactiveControlBackdropBlur(e, t) {
  const r = clampNumber(e, 0, 40, t);
  return Number(r.toFixed(2));
}
function normalizeInactiveControlBackdropSaturate(e, t) {
  const r = clampNumber(e, 0, 300, t);
  return Number(r.toFixed(2));
}
function normalizeWallpaperUserStyleOverride(e) {
  const t = e && "object" == typeof e && !Array.isArray(e) ? e : {},
    r = {},
    a = normalizeHexColor(t.primary, null),
    o = normalizeHexColor(t.boardBackgroundColor, null),
    n = Number.isFinite(Number(t.boardBackgroundOpacity))
      ? normalizeOpacity(t.boardBackgroundOpacity, 0)
      : null,
    i = Number.isFinite(Number(t.boardBackdropBlur))
      ? normalizeBoardBackdropBlur(t.boardBackdropBlur, 0)
      : null;
  return (
    a && (r.primary = a),
    o && (r.boardBackgroundColor = o),
    null !== n && (r.boardBackgroundOpacity = n),
    null !== i && (r.boardBackdropBlur = i),
    Object.keys(r).length > 0 ? r : null
  );
}
function normalizeWallpaperUserStyleOverrideState(e) {
  const t = e && "object" == typeof e && !Array.isArray(e) ? e : {};
  return {
    dark: normalizeWallpaperUserStyleOverride(t.dark),
    light: normalizeWallpaperUserStyleOverride(t.light),
  };
}
function hasConfiguredWallpaperUserStyleOverride(e) {
  return Boolean(normalizeWallpaperUserStyleOverride(e));
}
function normalizeTabHoverTextColor(e, t) {
  return normalizeHexColor(e, t);
}
function normalizeWallpaperStyleConfig(e, t) {
  const r = isPlainObject(e) ? e : {},
    a = isPlainObject(t) ? t : DEFAULT_WALLPAPER_THEME_STYLES.dark,
    o = isPlainObject(r.overlay) ? r.overlay : {},
    n = isPlainObject(a.overlay)
      ? a.overlay
      : DEFAULT_WALLPAPER_THEME_STYLES.dark.overlay;
  return {
    primary: normalizeHexColor(r.primary, a.primary),
    activeTextColor: normalizeHexColor(r.activeTextColor, a.activeTextColor),
    tabHoverTextColor: normalizeTabHoverTextColor(
      r.tabHoverTextColor,
      a.tabHoverTextColor,
    ),
    inactiveTabTextColor: normalizeHexColor(
      r.inactiveTabTextColor,
      a.inactiveTabTextColor,
    ),
    boardTextColor: normalizeHexColor(r.boardTextColor, a.boardTextColor),
    linkDescriptionTextColor: normalizeHexColor(
      r.linkDescriptionTextColor,
      a.linkDescriptionTextColor,
    ),
    iconColor: normalizeHexColor(r.iconColor, a.iconColor),
    tabArrowColor: normalizeHexColor(
      r.tabArrowColor,
      a.tabArrowColor || a.iconColor,
    ),
    addBoardColor: normalizeHexColor(r.addBoardColor, a.addBoardColor),
    boardBackgroundColor: normalizeHexColor(
      r.boardBackgroundColor,
      a.boardBackgroundColor,
    ),
    boardBackgroundOpacity: normalizeOpacity(
      r.boardBackgroundOpacity,
      a.boardBackgroundOpacity,
    ),
    boardBackdropBlur: normalizeBoardBackdropBlur(
      r.boardBackdropBlur,
      a.boardBackdropBlur,
    ),
    boardBackdropSaturate: normalizeBoardBackdropSaturate(
      r.boardBackdropSaturate,
      a.boardBackdropSaturate,
    ),
    inactiveControlColor: normalizeHexColor(
      r.inactiveControlColor,
      a.inactiveControlColor,
    ),
    inactiveControlOpacity: normalizeOpacity(
      r.inactiveControlOpacity,
      a.inactiveControlOpacity,
    ),
    inactiveControlBackdropBlur: normalizeInactiveControlBackdropBlur(
      r.inactiveControlBackdropBlur,
      a.inactiveControlBackdropBlur,
    ),
    inactiveControlBackdropSaturate: normalizeInactiveControlBackdropSaturate(
      r.inactiveControlBackdropSaturate,
      a.inactiveControlBackdropSaturate,
    ),
    popupBackgroundColor: normalizeHexColor(
      r.popupBackgroundColor,
      a.popupBackgroundColor,
    ),
    popupBackgroundOpacity: normalizeOpacity(
      r.popupBackgroundOpacity,
      a.popupBackgroundOpacity,
    ),
    popupCardBackgroundColor: normalizeHexColor(
      r.popupCardBackgroundColor,
      a.popupCardBackgroundColor,
    ),
    popupCardBackgroundOpacity: normalizeOpacity(
      r.popupCardBackgroundOpacity,
      a.popupCardBackgroundOpacity,
    ),
    dropdownBackgroundColor: normalizeHexColor(
      r.dropdownBackgroundColor,
      a.dropdownBackgroundColor,
    ),
    dropdownBackgroundOpacity: normalizeOpacity(
      r.dropdownBackgroundOpacity,
      a.dropdownBackgroundOpacity,
    ),
    overlay: {
      angle: normalizeOverlayAngle(o.angle, n.angle),
      topColor: normalizeHexColor(o.topColor, n.topColor),
      topOpacity: normalizeOpacity(o.topOpacity, n.topOpacity),
      bottomColor: normalizeHexColor(o.bottomColor, n.bottomColor),
      bottomOpacity: normalizeOpacity(o.bottomOpacity, n.bottomOpacity),
    },
  };
}
function createEmptyWallpaperThemeDefaults() {
  return {
    dark: normalizeWallpaperStyleConfig(
      DEFAULT_WALLPAPER_THEME_STYLES.dark,
      DEFAULT_WALLPAPER_THEME_STYLES.dark,
    ),
    light: normalizeWallpaperStyleConfig(
      DEFAULT_WALLPAPER_THEME_STYLES.light,
      DEFAULT_WALLPAPER_THEME_STYLES.light,
    ),
  };
}
function getWallpaperThemeDefaultForTheme(e) {
  const t = normalizeThemeMode(e),
    r = isPlainObject(wallpaperThemeDefaults)
      ? wallpaperThemeDefaults
      : createEmptyWallpaperThemeDefaults(),
    a = DEFAULT_WALLPAPER_THEME_STYLES[t];
  return normalizeWallpaperStyleConfig(r[t], a);
}
function applyWallpaperUserStyleOverride(e, t) {
  const r = normalizeThemeMode(e),
    a = normalizeWallpaperStyleConfig(t, getWallpaperThemeDefaultForTheme(r)),
    o = normalizeWallpaperUserStyleOverride(
      wallpaperStyleOverridesByTheme?.[r],
    );
  if (!o) return a;
  const n = { ...a, ...o };
  return (
    o.boardBackgroundColor &&
      ((n.dropdownBackgroundColor = o.boardBackgroundColor),
      (n.dropdownBackgroundOpacity = 1)),
    normalizeWallpaperStyleConfig(n, getWallpaperThemeDefaultForTheme(r))
  );
}
function buildLoggedOutDefaultVisualSnapshot() {
  const e = normalizeNewUserWallpaperDefaultConfig(
      wallpaperNewUserDefaultConfig,
    ),
    t = "light" === e.themeMode ? "light" : "dark",
    r = getWallpaperThemeDefaultForTheme(t),
    a = Array.isArray(bundledWallpaperCatalogByTheme?.[t])
      ? bundledWallpaperCatalogByTheme[t]
      : [];
  let o = normalizeBundledWallpaperPathForTheme(t, e.selectionByTheme?.[t]),
    n = r;
  if (o) {
    const e = a.find((e) => e?.file === o);
    e ? (n = normalizeWallpaperStyleConfig(e.style, r)) : (o = null);
  }
  return {
    themeMode: t,
    wallpaper: o,
    style: n,
    updatedAt: new Date().toISOString(),
  };
}
function persistLoggedOutDefaultVisualSnapshot() {
  const e = buildLoggedOutDefaultVisualSnapshot();
  globalThis.LumiListTheme?.publishDefaultTheme(e);
  try {
    localStorage.setItem(
      "lumilist_logged_out_default_visual_v1",
      JSON.stringify(e),
    );
  } catch (e) {}
  return e;
}
function hexToRgb(e) {
  const t = normalizeHexColor(e, null);
  if (!t) return null;
  const r = t.slice(1);
  return {
    r: parseInt(r.slice(0, 2), 16),
    g: parseInt(r.slice(2, 4), 16),
    b: parseInt(r.slice(4, 6), 16),
  };
}
function rgbToHex(e) {
  const toHex = (e) =>
    Math.round(e).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(e.r)}${toHex(e.g)}${toHex(e.b)}`;
}
function mixRgb(e, t, r) {
  const a = clampNumber(r, 0, 1, 0);
  return {
    r: e.r + (t.r - e.r) * a,
    g: e.g + (t.g - e.g) * a,
    b: e.b + (t.b - e.b) * a,
  };
}
function relativeLuminanceFromRgb(e) {
  const toLinear = (e) => {
    const t = clampNumber(e, 0, 255, 0) / 255;
    return t <= 0.03928 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * toLinear(e.r) + 0.7152 * toLinear(e.g) + 0.0722 * toLinear(e.b)
  );
}
function resolveReadableForegroundForHex(e, t = "#1A1F2E", r = "#FFFFFF") {
  const a = hexToRgb(e),
    o = hexToRgb(t),
    n = hexToRgb(r);
  if (!a || !o || !n) return t;
  const i = relativeLuminanceFromRgb(a),
    s = relativeLuminanceFromRgb(o),
    l = relativeLuminanceFromRgb(n);
  return (Math.max(i, s) + 0.05) / (Math.min(i, s) + 0.05) >=
    (Math.max(i, l) + 0.05) / (Math.min(i, l) + 0.05)
    ? t
    : r;
}
function resolveReadableForegroundForHexes(e, t = "#1A1F2E", r = "#FFFFFF") {
  const a = (Array.isArray(e) ? e : []).filter((e) => Boolean(hexToRgb(e)));
  if (0 === a.length) return t;
  const o = hexToRgb(t),
    n = hexToRgb(r);
  if (!o || !n) return t;
  const i = relativeLuminanceFromRgb(o),
    s = relativeLuminanceFromRgb(n);
  let l = Number.POSITIVE_INFINITY,
    c = Number.POSITIVE_INFINITY;
  return (
    a.forEach((e) => {
      const t = hexToRgb(e);
      if (!t) return;
      const r = relativeLuminanceFromRgb(t),
        a = (Math.max(r, i) + 0.05) / (Math.min(r, i) + 0.05),
        o = (Math.max(r, s) + 0.05) / (Math.min(r, s) + 0.05);
      ((l = Math.min(l, a)), (c = Math.min(c, o)));
    }),
    l >= c ? t : r
  );
}
function rgbaFromHex(e, t) {
  const r = hexToRgb(e) || { r: 0, g: 0, b: 0 },
    a = normalizeOpacity(t, 1);
  return `rgba(${r.r}, ${r.g}, ${r.b}, ${a})`;
}
function toOverlayGradientCss(e) {
  const t = isPlainObject(e) ? e : DEFAULT_WALLPAPER_THEME_STYLES.dark.overlay,
    r = normalizeOverlayAngle(t.angle, 180),
    a = normalizeOpacity(t.topOpacity, 0),
    o = normalizeOpacity(t.bottomOpacity, 0);
  return a <= 0 && o <= 0
    ? "none"
    : `linear-gradient(${r}deg, ${rgbaFromHex(t.topColor, t.topOpacity)}, ${rgbaFromHex(t.bottomColor, t.bottomOpacity)})`;
}
function adjustHexTone(e, t) {
  const r = hexToRgb(normalizeHexColor(e, "#05E57B")) || {
      r: 5,
      g: 229,
      b: 123,
    },
    shiftChannel = (e) => clampNumber(e + 255 * t, 0, 255, e);
  return rgbToHex({
    r: shiftChannel(r.r),
    g: shiftChannel(r.g),
    b: shiftChannel(r.b),
  });
}
function buildAccentPalette(e, t) {
  const r = normalizeThemeMode(t),
    a = DEFAULT_WALLPAPER_THEME_STYLES[r].primary,
    o = normalizeHexColor(e, a),
    n = hexToRgb(o) || hexToRgb(a),
    i = "light" === r,
    s = o,
    l = adjustHexTone(o, -0.12),
    c = adjustHexTone(o, 0.04),
    d = adjustHexTone(o, -0.18),
    u = adjustHexTone(o, 0.12),
    p = i ? 0.16 : 0.15,
    m = i ? 0.16 : 0.15,
    g = i ? 0.21 : 0.2,
    f = i ? 0.45 : 0.4,
    h = i ? 0.5 : 0.4,
    y = rgbToHex(
      mixRgb(
        n,
        i ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 },
        i ? 0.72 : 0.6,
      ),
    );
  return {
    accent1: s,
    accent2: l,
    accent3: c,
    accent4: d,
    accentHover: u,
    accentRgb: `${Math.round(n.r)}, ${Math.round(n.g)}, ${Math.round(n.b)}`,
    accentSoft: `rgba(${n.r}, ${n.g}, ${n.b}, ${p})`,
    accentSoft2: `rgba(${n.r}, ${n.g}, ${n.b}, ${m})`,
    accentSoft3: `rgba(${n.r}, ${n.g}, ${n.b}, ${g})`,
    borderAccent: `rgba(${n.r}, ${n.g}, ${n.b}, ${f})`,
    accentOutline: `rgba(${n.r}, ${n.g}, ${n.b}, ${h})`,
    searchPageBadgeBg: `rgba(${n.r}, ${n.g}, ${n.b}, ${i ? 0.2 : 0.13})`,
    searchPageBadgeBorder: `rgba(${n.r}, ${n.g}, ${n.b}, ${i ? 0.5 : 0.32})`,
    searchPageBadgeText: y,
  };
}
function getExpiredOverlayThemeBaseTokens(e) {
  return "light" === normalizeThemeMode(e)
    ? {
        overlayBg: "rgba(245, 244, 240, 0.92)",
        bodyBackdrop: "linear-gradient(135deg, #EEF4FB 0%, #DDE9F6 100%)",
        cardBg: "rgba(15, 23, 42, 0.04)",
        cardBgHover: "rgba(15, 23, 42, 0.07)",
        borderMuted: "rgba(15, 23, 42, 0.1)",
        borderStrong: "rgba(15, 23, 42, 0.2)",
        textPrimary: "#141E2D",
        textSecondary: "#273D57",
        textMuted: "#607892",
        textInverse: "#F4FBF8",
        featureColor: "rgba(20, 30, 45, 0.76)",
        logoutBg: "rgba(15, 23, 42, 0.06)",
        logoutBgHover: "rgba(15, 23, 42, 0.1)",
        logoutColor: "rgba(20, 30, 45, 0.82)",
        logoutColorHover: "#141E2D",
        deleteColor: "#607892",
        deleteHover: "#141E2D",
      }
    : {
        overlayBg: "rgba(12, 16, 26, 0.94)",
        bodyBackdrop: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
        cardBg: "rgba(255, 255, 255, 0.05)",
        cardBgHover: "rgba(255, 255, 255, 0.07)",
        borderMuted: "rgba(255, 255, 255, 0.08)",
        borderStrong: "rgba(255, 255, 255, 0.15)",
        textPrimary: "#FFFFFF",
        textSecondary: "#B8C5D1",
        textMuted: "#6A7A8A",
        textInverse: "#1A1F2E",
        featureColor: "rgba(255, 255, 255, 0.75)",
        logoutBg: "rgba(255, 255, 255, 0.06)",
        logoutBgHover: "rgba(255, 255, 255, 0.1)",
        logoutColor: "rgba(255, 255, 255, 0.86)",
        logoutColorHover: "#FFFFFF",
        deleteColor: "#6A7A8A",
        deleteHover: "rgba(255, 255, 255, 0.75)",
      };
}
function clearExpiredOverlayTheme() {
  const e = document.getElementById("expiredOverlay");
  (e &&
    [
      "--ll-expired-overlay-bg",
      "--ll-expired-title-color",
      "--ll-expired-label-color",
      "--ll-expired-text-primary",
      "--ll-expired-text-secondary",
      "--ll-expired-text-muted",
      "--ll-expired-text-inverse",
      "--ll-expired-card-bg",
      "--ll-expired-card-bg-hover",
      "--ll-expired-card-border",
      "--ll-expired-card-border-strong",
      "--ll-expired-border-accent",
      "--ll-expired-border-accent-strong",
      "--ll-expired-accent-outline",
      "--ll-expired-accent-1",
      "--ll-expired-accent-3",
      "--ll-expired-accent-hover",
      "--ll-expired-recommended-bg",
      "--ll-expired-recommended-shadow",
      "--ll-expired-feature-color",
      "--ll-expired-logout-bg",
      "--ll-expired-logout-color",
      "--ll-expired-logout-border",
      "--ll-expired-logout-bg-hover",
      "--ll-expired-logout-color-hover",
      "--ll-expired-delete-color",
      "--ll-expired-delete-hover",
    ].forEach((t) => {
      e.style.removeProperty(t);
    }),
    document.body?.style &&
      document.body.style.removeProperty("--ll-expired-body-bg"));
}
function applyExpiredOverlayTheme() {
  const e = document.getElementById("expiredOverlay");
  if (!e) return null;
  const t = buildLoggedOutDefaultVisualSnapshot(),
    r = normalizeThemeMode(t?.themeMode),
    a = buildAccentPalette(
      normalizeWallpaperStyleConfig(
        t?.style,
        getWallpaperThemeDefaultForTheme(r),
      ).primary,
      r,
    ),
    o = getExpiredOverlayThemeBaseTokens(r),
    n =
      "light" === r
        ? `linear-gradient(145deg, rgba(${a.accentRgb}, 0.16), rgba(${a.accentRgb}, 0.05))`
        : `linear-gradient(145deg, rgba(${a.accentRgb}, 0.08), rgba(${a.accentRgb}, 0.02))`,
    i =
      "light" === r
        ? `rgba(${a.accentRgb}, 0.18)`
        : `rgba(${a.accentRgb}, 0.12)`;
  return (
    e.style.setProperty("--ll-expired-overlay-bg", o.overlayBg),
    e.style.setProperty("--ll-expired-title-color", o.textPrimary),
    e.style.setProperty("--ll-expired-label-color", a.accent1),
    e.style.setProperty("--ll-expired-text-primary", o.textPrimary),
    e.style.setProperty("--ll-expired-text-secondary", o.textSecondary),
    e.style.setProperty("--ll-expired-text-muted", o.textMuted),
    e.style.setProperty("--ll-expired-text-inverse", o.textInverse),
    e.style.setProperty("--ll-expired-card-bg", o.cardBg),
    e.style.setProperty("--ll-expired-card-bg-hover", o.cardBgHover),
    e.style.setProperty("--ll-expired-card-border", o.borderMuted),
    e.style.setProperty("--ll-expired-card-border-strong", o.borderStrong),
    e.style.setProperty("--ll-expired-border-accent", a.borderAccent),
    e.style.setProperty(
      "--ll-expired-border-accent-strong",
      "light" === r
        ? `rgba(${a.accentRgb}, 0.5)`
        : `rgba(${a.accentRgb}, 0.45)`,
    ),
    e.style.setProperty("--ll-expired-accent-outline", a.accentOutline),
    e.style.setProperty("--ll-expired-accent-1", a.accent1),
    e.style.setProperty("--ll-expired-accent-3", a.accent3),
    e.style.setProperty("--ll-expired-accent-hover", a.accentHover),
    e.style.setProperty("--ll-expired-recommended-bg", n),
    e.style.setProperty("--ll-expired-recommended-shadow", i),
    e.style.setProperty("--ll-expired-feature-color", o.featureColor),
    e.style.setProperty("--ll-expired-logout-bg", o.logoutBg),
    e.style.setProperty("--ll-expired-logout-color", o.logoutColor),
    e.style.setProperty("--ll-expired-logout-border", o.borderMuted),
    e.style.setProperty("--ll-expired-logout-bg-hover", o.logoutBgHover),
    e.style.setProperty("--ll-expired-logout-color-hover", o.logoutColorHover),
    e.style.setProperty("--ll-expired-delete-color", o.deleteColor),
    e.style.setProperty("--ll-expired-delete-hover", o.deleteHover),
    document.body?.style &&
      document.body.style.setProperty("--ll-expired-body-bg", o.bodyBackdrop),
    { themeMode: r, primary: a.accent1 }
  );
}
function formatWallpaperLabelFromFile(e) {
  if ("string" != typeof e || !e.trim()) return "Wallpaper";
  const t = (e.split("/").pop() || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t ? t.replace(/\b\w/g, (e) => e.toUpperCase()) : "Wallpaper";
}
function normalizeWallpaperCloudInstallEntry(e) {
  if (!isPlainObject(e)) return null;
  const t = normalizeThemeMode(e.theme),
    r = normalizeWallpaperPathForTheme(
      t,
      e.sourceUrl || e.file || e.assetUrl || null,
    );
  if (!isHostedWallpaperUrl(r)) return null;
  const a =
    "string" == typeof e.remoteId && e.remoteId.trim()
      ? e.remoteId.trim()
      : "string" == typeof e.id && e.id.trim()
        ? e.id.trim()
        : null;
  return {
    id:
      normalizeInstalledWallpaperRecordId(
        e.recordId || e.localId || e.installedId || e.id,
      ) ||
      createInstalledWallpaperRecordId({ theme: t, remoteId: a, sourceUrl: r }),
    theme: t,
    remoteId: a,
    sourceUrl: r,
    label:
      "string" == typeof e.label && e.label.trim()
        ? e.label.trim()
        : formatWallpaperLabelFromFile(r),
    style: normalizeWallpaperStyleConfig(
      e.style,
      getWallpaperThemeDefaultForTheme(t),
    ),
    thumbnailUrl:
      "string" == typeof e.thumbnailUrl && e.thumbnailUrl.trim()
        ? e.thumbnailUrl.trim()
        : null,
    version:
      "string" == typeof e.version && e.version.trim()
        ? e.version.trim()
        : null,
    archivedAt: normalizeWallpaperArchivedAt(e.archivedAt),
    installedAt:
      "string" == typeof e.installedAt && e.installedAt.trim()
        ? e.installedAt.trim()
        : null,
    updatedAt:
      "string" == typeof e.updatedAt && e.updatedAt.trim()
        ? e.updatedAt.trim()
        : null,
  };
}
function normalizeWallpaperCloudSyncState(e, t = wallpaperAccountScopeUserId) {
  const r = normalizeWallpaperSyncUserId(t),
    a = isPlainObject(e) ? e : {},
    o = normalizeWallpaperSyncUserId(a.userId);
  if (r && o && o !== r) return createEmptyWallpaperCloudSyncState(r);
  const n = createEmptyWallpaperCloudSyncState(o || r || null);
  ((n.hasConfiguredPreferences = !0 === a.hasConfiguredPreferences),
    (n.themeMode =
      "dark" === a.themeMode || "light" === a.themeMode ? a.themeMode : null));
  const i = isPlainObject(a.selectionByTheme) ? a.selectionByTheme : {},
    s = isPlainObject(a.selectionPresenceByTheme)
      ? a.selectionPresenceByTheme
      : null;
  ((n.selectionByTheme = {
    dark: "string" == typeof i.dark && i.dark.trim() ? i.dark.trim() : null,
    light: "string" == typeof i.light && i.light.trim() ? i.light.trim() : null,
  }),
    (n.selectionPresenceByTheme = {
      dark: s ? !0 === s.dark : Object.prototype.hasOwnProperty.call(i, "dark"),
      light: s
        ? !0 === s.light
        : Object.prototype.hasOwnProperty.call(i, "light"),
    }));
  const l = Array.isArray(a.installedWallpapers) ? a.installedWallpapers : [],
    c = new Set();
  return (
    (n.installedWallpapers = l
      .map((e) => normalizeWallpaperCloudInstallEntry(e))
      .filter((e) => !(!e || c.has(e.id) || (c.add(e.id), 0)))
      .sort((e, t) => {
        const r = Date.parse(e?.updatedAt || 0);
        return Date.parse(t?.updatedAt || 0) - r;
      })),
    (n.updatedAt =
      "string" == typeof a.updatedAt && a.updatedAt.trim()
        ? a.updatedAt.trim()
        : null),
    (n.fetchedAt =
      "string" == typeof a.fetchedAt && a.fetchedAt.trim()
        ? a.fetchedAt.trim()
        : null),
    (n.hasConfiguredPreferences =
      n.hasConfiguredPreferences ||
      "dark" === n.themeMode ||
      "light" === n.themeMode ||
      !0 === n.selectionPresenceByTheme.dark ||
      !0 === n.selectionPresenceByTheme.light ||
      n.installedWallpapers.length > 0 ||
      null !== n.updatedAt),
    n
  );
}
function buildWallpaperCloudSyncStateFromPreferencePayload(e, t) {
  const r = normalizeWallpaperSyncUserId(e);
  if (!r) return createEmptyWallpaperCloudSyncState(null);
  const a = t && "object" == typeof t ? t : {},
    o = a.wallpaper_selection && "object" == typeof a.wallpaper_selection,
    n = o ? a.wallpaper_selection : {},
    i =
      "string" == typeof a.wallpaper_preferences_updated_at &&
      a.wallpaper_preferences_updated_at.trim()
        ? a.wallpaper_preferences_updated_at.trim()
        : new Date().toISOString();
  return {
    userId: r,
    hasConfiguredPreferences: !0,
    themeMode:
      "dark" === a.theme_mode || "light" === a.theme_mode ? a.theme_mode : null,
    selectionByTheme: {
      dark: "string" == typeof n.dark && n.dark.trim() ? n.dark.trim() : null,
      light:
        "string" == typeof n.light && n.light.trim() ? n.light.trim() : null,
    },
    selectionPresenceByTheme: {
      dark: !!o && Object.prototype.hasOwnProperty.call(n, "dark"),
      light: !!o && Object.prototype.hasOwnProperty.call(n, "light"),
    },
    installedWallpapers: Array.isArray(a.wallpaper_installs)
      ? a.wallpaper_installs
      : [],
    updatedAt: i,
    fetchedAt: new Date().toISOString(),
  };
}
async function persistWallpaperCloudSyncStateFromPreferencePayload(e, t) {
  const r = buildWallpaperCloudSyncStateFromPreferencePayload(e, t),
    a = await importWallpaperCloudManifestIntoDatabase(r, { broadcast: !1 });
  if ("undefined" == typeof chrome || !chrome.storage?.local?.set) return a;
  try {
    await chrome.storage.local.set({
      [WALLPAPER_CLOUD_SYNC_STATE_STORAGE_KEY]: a,
    });
  } catch (e) {
    console.warn(
      "Failed to persist optimistic wallpaper cloud sync state locally:",
      e,
    );
  }
  return a;
}
function getWallpaperCloudManifestEntriesForUser(
  e = wallpaperAccountScopeUserId,
) {
  const t = normalizeWallpaperSyncUserId(e);
  return t &&
    wallpaperCloudSyncState &&
    wallpaperCloudSyncState.userId === t &&
    Array.isArray(wallpaperCloudSyncState.installedWallpapers)
    ? wallpaperCloudSyncState.installedWallpapers
    : [];
}
function getWallpaperCloudManifestLookupForUser(
  e = wallpaperAccountScopeUserId,
) {
  const t = new Set(),
    r = new Set(),
    a = { dark: new Set(), light: new Set() };
  for (const o of getWallpaperCloudManifestEntriesForUser(e))
    (t.add(o.id),
      o.sourceUrl && r.add(o.sourceUrl),
      o.remoteId && a[o.theme]?.add(o.remoteId));
  return { ids: t, sourceUrls: r, remoteIdsByTheme: a };
}
function getSelectedInstalledWallpaperRecordIds(e = wallpaperSelectionByTheme) {
  const t = new Set();
  return (
    ["dark", "light"].forEach((r) => {
      const a = parseInstalledWallpaperRef(e?.[r]);
      a?.recordId && t.add(a.recordId);
    }),
    t
  );
}
function normalizeInstalledWallpaperRecordId(e) {
  return "string" == typeof e ? e.trim() : "";
}
function getInstalledWallpaperTimestampMs(e, t = []) {
  const r = e && "object" == typeof e ? e : {};
  for (const e of t) {
    const t = Date.parse(r?.[e] || "");
    if (Number.isFinite(t) && t > 0) return t;
  }
  return 0;
}
function normalizeWallpaperArchivedAt(e) {
  return "string" == typeof e && e.trim() ? e.trim() : null;
}
function compareInstalledWallpaperFreshness(e, t) {
  const r = getInstalledWallpaperTimestampMs(e, ["updatedAt", "installedAt"]),
    a = getInstalledWallpaperTimestampMs(t, ["updatedAt", "installedAt"]);
  if (r !== a) return a - r;
  const o = getInstalledWallpaperTimestampMs(e, ["installedAt"]),
    n = getInstalledWallpaperTimestampMs(t, ["installedAt"]);
  if (o !== n) return n - o;
  const i = normalizeInstalledWallpaperRecordId(e?.id || e?.recordId || ""),
    s = normalizeInstalledWallpaperRecordId(t?.id || t?.recordId || "");
  return i.localeCompare(s);
}
function compareInstalledWallpaperDisplayOrder(e, t) {
  const r = getInstalledWallpaperTimestampMs(e, ["installedAt", "updatedAt"]),
    a = getInstalledWallpaperTimestampMs(t, ["installedAt", "updatedAt"]);
  if (r !== a) return a - r;
  const o = "string" == typeof e?.label ? e.label.trim() : "",
    n = "string" == typeof t?.label ? t.label.trim() : "";
  if (o !== n) return o.localeCompare(n);
  const i = normalizeInstalledWallpaperRecordId(e?.id || e?.recordId || ""),
    s = normalizeInstalledWallpaperRecordId(t?.id || t?.recordId || "");
  return i.localeCompare(s);
}
function createInstalledWallpaperRef(e, t) {
  const r = normalizeThemeMode(e),
    a = normalizeInstalledWallpaperRecordId(t);
  return a ? `lumilist-installed://${r}/${encodeURIComponent(a)}` : null;
}
function parseInstalledWallpaperRef(e) {
  if ("string" != typeof e) return null;
  const t = e.trim();
  if (!t.startsWith("lumilist-installed://")) return null;
  try {
    const e = new URL(t);
    if ("lumilist-installed:" !== e.protocol) return null;
    const r = normalizeThemeMode(e.hostname),
      a = normalizeInstalledWallpaperRecordId(
        decodeURIComponent(e.pathname.replace(/^\/+/, "")),
      );
    return a
      ? { theme: r, recordId: a, ref: createInstalledWallpaperRef(r, a) }
      : null;
  } catch (e) {
    return null;
  }
}
function isInstalledWallpaperRef(e) {
  return Boolean(parseInstalledWallpaperRef(e));
}
function computeStableWallpaperIdHash(e) {
  const t = "string" == typeof e ? e : String(e ?? "");
  let r = 2166136261;
  for (let e = 0; e < t.length; e += 1)
    ((r ^= t.charCodeAt(e)), (r = Math.imul(r, 16777619)));
  return (r >>> 0).toString(36);
}
function createInstalledWallpaperRecordId({
  theme: e,
  remoteId: t = null,
  sourceUrl: r = null,
}) {
  const a = normalizeThemeMode(e),
    o = "string" == typeof t ? t.trim() : "";
  if (o) return `gallery:${a}:${o}`;
  const n = "string" == typeof r ? r.trim() : "";
  return n
    ? `hosted:${a}:${computeStableWallpaperIdHash(n)}`
    : `installed:${a}:${generateId()}`;
}
function findExistingInstalledWallpaperRecordId({
  theme: e,
  remoteId: t = null,
  sourceUrl: r = null,
}) {
  const a = normalizeThemeMode(e),
    o = "string" == typeof t ? t.trim() : "",
    n = "string" == typeof r ? r.trim() : "";
  for (const e of installedWallpaperRecordsByRef.values())
    if (normalizeThemeMode(e?.theme) === a) {
      if (o && e?.remoteId === o)
        return normalizeInstalledWallpaperRecordId(e?.id) || null;
      if (n && e?.sourceUrl === n)
        return normalizeInstalledWallpaperRecordId(e?.id) || null;
    }
  return null;
}
function toHostedWallpaperUrl(e) {
  const t =
    "string" == typeof e
      ? e
          .trim()
          .replace(/^\/+/, "")
          .replace(/^wallpaper\//, "")
      : "";
  if (!t) return null;
  const r = t
    .split("/")
    .filter(Boolean)
    .map((e) => encodeURIComponent(e))
    .join("/");
  return r ? `${WALLPAPER_REMOTE_STORAGE_PREFIX}${r}` : null;
}
function isHostedWallpaperUrl(e) {
  return "string" == typeof e && e.startsWith(WALLPAPER_REMOTE_STORAGE_PREFIX);
}
function getInstalledWallpaperRecordByRef(e) {
  const t = parseInstalledWallpaperRef(e);
  return (t && installedWallpaperRecordsByRef.get(t.ref)) || null;
}
function isLocalUserWallpaperRecord(e) {
  return (
    "string" == typeof e?.sourceType && "user-upload" === e.sourceType.trim()
  );
}
function isLocalOnlyInstalledWallpaperRef(e) {
  const t = "string" == typeof e ? e.trim() : "";
  return (
    !!isInstalledWallpaperRef(t) &&
    isLocalUserWallpaperRecord(getInstalledWallpaperRecordByRef(t))
  );
}
function buildSyncSafeWallpaperSelection(e, t = null) {
  const r = e && "object" == typeof e ? e : {},
    a = t && "object" == typeof t ? t : {},
    o = createEmptyWallpaperSelection();
  return (
    ["dark", "light"].forEach((e) => {
      const t = normalizeWallpaperPathForTheme(e, r[e]);
      if (t && isLocalOnlyInstalledWallpaperRef(t)) {
        const t = normalizeWallpaperPathForTheme(e, a[e]);
        return void (o[e] =
          t && !isLocalOnlyInstalledWallpaperRef(t) ? t : null);
      }
      o[e] = t ?? null;
    }),
    o
  );
}
function findInstalledWallpaperRefBySourceUrl(e, t) {
  const r = normalizeThemeMode(e),
    a = normalizeWallpaperPathForTheme(r, t);
  if (!a) return null;
  for (const [e, t] of installedWallpaperRecordsByRef.entries())
    if (normalizeThemeMode(t?.theme) === r && t?.sourceUrl === a) return e;
  return null;
}
function findInstalledWallpaperRefByRemoteIdentity(
  e,
  { remoteId: t = null, sourceUrl: r = null } = {},
) {
  const a = normalizeThemeMode(e),
    o = findExistingInstalledWallpaperRecordId({
      theme: a,
      remoteId: t,
      sourceUrl: normalizeWallpaperPathForTheme(a, r),
    });
  return o ? createInstalledWallpaperRef(a, o) : null;
}
function getWallpaperCanonicalSourceIdentity(e, t) {
  const r = normalizeThemeMode(e),
    a = isPlainObject(t) ? t : null,
    o =
      "string" == typeof a?.remoteId && a.remoteId.trim()
        ? a.remoteId.trim()
        : "",
    n = normalizeInstalledWallpaperRecordId(a?.id || a?.recordId || null),
    i = normalizeWallpaperPathForTheme(
      r,
      "string" == typeof t ? t : a?.sourceUrl || a?.file || null,
    );
  if (isInstalledWallpaperRef(i)) {
    const e = getInstalledWallpaperRecordByRef(i),
      t = normalizeWallpaperPathForTheme(r, e?.sourceUrl || null);
    if (isHostedWallpaperUrl(t)) return `source:${r}:${t}`;
    const a =
      "string" == typeof e?.remoteId && e.remoteId.trim()
        ? e.remoteId.trim()
        : "";
    if (a) return `remote:${r}:${a}`;
    const o = parseInstalledWallpaperRef(i);
    if (o?.recordId) return `record:${r}:${o.recordId}`;
  }
  if (isHostedWallpaperUrl(i)) return `source:${r}:${i}`;
  if ("string" == typeof i && i.startsWith(`wallpaper/${r}/`)) {
    const e = toHostedWallpaperUrl(i);
    return e ? `source:${r}:${e}` : `bundled:${r}:${i}`;
  }
  return o ? `remote:${r}:${o}` : n ? `record:${r}:${n}` : null;
}
function findBundledWallpaperEquivalentEntry(e, t) {
  const r = normalizeThemeMode(e),
    a = getWallpaperCanonicalSourceIdentity(r, t);
  if (!a) return null;
  const o = Array.isArray(bundledWallpaperCatalogByTheme[r])
    ? bundledWallpaperCatalogByTheme[r]
    : [];
  for (const e of o)
    if (getWallpaperCanonicalSourceIdentity(r, e?.file || null) === a) return e;
  return null;
}
function findEquivalentWallpaperCatalogEntry(e, t) {
  const r = normalizeThemeMode(e),
    a = getWallpaperCanonicalSourceIdentity(r, t);
  if (!a) return null;
  const o = getWallpaperCatalogEntriesForTheme(r);
  for (const e of o)
    if (getWallpaperCanonicalSourceIdentity(r, e?.file || null) === a) return e;
  return null;
}
function getInstalledWallpaperObjectUrl(e) {
  const t = parseInstalledWallpaperRef(e);
  if (!t) return null;
  const r = installedWallpaperObjectUrlsByRef.get(t.ref);
  if ("string" == typeof r && r) return r;
  const a = installedWallpaperRecordsByRef.get(t.ref);
  if (!(a?.imageBlob instanceof Blob)) return null;
  if ("undefined" == typeof URL || "function" != typeof URL.createObjectURL)
    return null;
  try {
    const e = URL.createObjectURL(a.imageBlob);
    return (installedWallpaperObjectUrlsByRef.set(t.ref, e), e);
  } catch (e) {
    return (
      console.warn("Failed to create installed wallpaper object URL:", e),
      null
    );
  }
}
function revokeInstalledWallpaperObjectUrl(e) {
  const t = parseInstalledWallpaperRef(e);
  if (!t) return;
  const r = installedWallpaperObjectUrlsByRef.get(t.ref);
  if (
    "string" == typeof r &&
    r &&
    "undefined" != typeof URL &&
    "function" == typeof URL.revokeObjectURL
  )
    try {
      URL.revokeObjectURL(r);
    } catch (e) {
      console.warn("Failed to revoke installed wallpaper object URL:", e);
    }
  installedWallpaperObjectUrlsByRef.delete(t.ref);
}
function shouldKeepInstalledWallpaperObjectUrl(e, t) {
  return (
    e?.imageBlob instanceof Blob &&
    t?.imageBlob instanceof Blob &&
    normalizeThemeMode(e?.theme) === normalizeThemeMode(t?.theme) &&
    (e?.sourceUrl || null) === (t?.sourceUrl || null) &&
    (e?.remoteId || null) === (t?.remoteId || null) &&
    (e?.version || null) === (t?.version || null) &&
    (e?.mimeType || null) === (t?.mimeType || null) &&
    Number(e?.byteSize || 0) === Number(t?.byteSize || 0)
  );
}
function revokeStaleInstalledWallpaperObjectUrls(e) {
  for (const [t, r] of installedWallpaperRecordsByRef.entries()) {
    const a = e.get(t);
    (a &&
      (shouldKeepInstalledWallpaperObjectUrl(r, a) ||
        (a.updatedAt === r?.updatedAt &&
          normalizeThemeMode(a?.theme) === normalizeThemeMode(r?.theme) &&
          (a?.sourceUrl || null) === (r?.sourceUrl || null) &&
          (a?.remoteId || null) === (r?.remoteId || null) &&
          (a?.version || null) === (r?.version || null) &&
          (a?.mimeType || null) === (r?.mimeType || null) &&
          Number(a?.byteSize || 0) === Number(r?.byteSize || 0) &&
          Boolean(a?.imageBlob instanceof Blob) ===
            Boolean(r?.imageBlob instanceof Blob)))) ||
      revokeInstalledWallpaperObjectUrl(t);
  }
}
function createEmptyWallpaperBinaryCache() {
  return { dark: null, light: null };
}
function readCachedWallpaperBinaryCache() {
  try {
    const e = localStorage.getItem(WALLPAPER_BINARY_CACHE_LOCAL_KEY);
    if (!e) return createEmptyWallpaperBinaryCache();
    const t = JSON.parse(e);
    return t && "object" == typeof t
      ? { dark: t.dark || null, light: t.light || null }
      : createEmptyWallpaperBinaryCache();
  } catch (e) {
    return createEmptyWallpaperBinaryCache();
  }
}
function getCachedWallpaperBinaryDataUrl(e, t) {
  const r = normalizeThemeMode(e),
    a = readCachedWallpaperBinaryCache()[r];
  return a && a.source === t && "string" == typeof a.dataUrl ? a.dataUrl : null;
}
function hasCachedWallpaperBinary(e, t) {
  return Boolean(getCachedWallpaperBinaryDataUrl(e, t));
}
function hasCachedHostedWallpaperBinary(e, t) {
  return hasCachedWallpaperBinary(e, t);
}
function writeHostedWallpaperBootCache(e, t, r) {
  const a = normalizeThemeMode(e),
    o = `lumilist_wallpaper_boot_source_${a}`,
    n = `lumilist_wallpaper_boot_binary_${a}`;
  try {
    (null !== localStorage.getItem(o) && localStorage.removeItem(o),
      null !== localStorage.getItem(n) && localStorage.removeItem(n));
  } catch (e) {
    console.warn("Failed to clear legacy wallpaper boot cache locally:", e);
  }
}
function writeWallpaperBootStyleCache(e, t) {
  const r = normalizeThemeMode(e);
  try {
    localStorage.setItem(
      `lumilist_wallpaper_boot_style_${r}`,
      JSON.stringify(t),
    );
  } catch (e) {
    console.warn("Failed to write wallpaper boot style cache locally:", e);
  }
}
function writeCachedWallpaperBinaryDataUrl(e, t, r) {
  const a = normalizeThemeMode(e),
    o = readCachedWallpaperBinaryCache();
  o[a] = { source: t, dataUrl: r, cachedAt: new Date().toISOString() };
  try {
    return (
      localStorage.setItem(WALLPAPER_BINARY_CACHE_LOCAL_KEY, JSON.stringify(o)),
      writeHostedWallpaperBootCache(a, t, r),
      !0
    );
  } catch (e) {
    return (console.warn("Failed to cache wallpaper binary locally:", e), !1);
  }
}
function clearCachedWallpaperBinaryDataUrl(e, t) {
  const r = normalizeThemeMode(e),
    a = normalizeWallpaperPathForTheme(r, t);
  if (!a) return !1;
  let o = !1;
  try {
    const e = readCachedWallpaperBinaryCache();
    e?.[r]?.source === a &&
      ((e[r] = null),
      localStorage.setItem(WALLPAPER_BINARY_CACHE_LOCAL_KEY, JSON.stringify(e)),
      (o = !0));
  } catch (e) {
    console.warn("Failed to clear wallpaper binary cache locally:", e);
  }
  try {
    const e = `lumilist_wallpaper_boot_source_${r}`,
      t = `lumilist_wallpaper_boot_binary_${r}`;
    localStorage.getItem(e) === a &&
      (localStorage.removeItem(e), localStorage.removeItem(t), (o = !0));
  } catch (e) {
    console.warn("Failed to clear wallpaper boot cache locally:", e);
  }
  return o;
}
function normalizeWallpaperPathForTheme(e, t) {
  if ("string" != typeof t) return null;
  const r = normalizeThemeMode(e),
    a = t.trim(),
    o = parseInstalledWallpaperRef(a);
  if (o) return o.theme === r ? o.ref : null;
  const n = a.replace(/^\/+/, "");
  if (n.startsWith(`wallpaper/${r}/`) && WALLPAPER_FILE_PATTERN.test(n))
    return n;
  try {
    const e = new URL(a);
    if (!e.href.startsWith(WALLPAPER_REMOTE_STORAGE_PREFIX)) return null;
    const t = decodeURIComponent(e.href.slice(76));
    return t.startsWith(`${r}/`) && WALLPAPER_FILE_PATTERN.test(t)
      ? toHostedWallpaperUrl(`wallpaper/${t}`)
      : null;
  } catch (e) {
    return null;
  }
}
function normalizeWallpaperCatalog(e, t = {}) {
  const r =
      "function" == typeof t.resolveFilePath
        ? t.resolveFilePath
        : (e, t) => normalizeWallpaperPathForTheme(e, t),
    a = createEmptyWallpaperCatalog(),
    o = createEmptyWallpaperThemeDefaults(),
    n = isPlainObject(e) ? e : {},
    i = isPlainObject(n.themeDefaults) ? n.themeDefaults : {},
    s = isPlainObject(n.themes) ? n.themes : null,
    l = normalizeNewUserWallpaperDefaultConfig(n.newUserDefault, {
      resolveSelectionFile: normalizeBundledWallpaperPathForTheme,
    }),
    c = ["dark", "light"];
  for (const e of c) {
    o[e] = normalizeWallpaperStyleConfig(
      i[e],
      DEFAULT_WALLPAPER_THEME_STYLES[e],
    );
    const t = Array.isArray(s?.[e]) ? s[e] : [],
      n = new Set(),
      l = [];
    for (const a of t) {
      if (!a || "object" != typeof a) continue;
      const t = r(e, a.file);
      if (!t || n.has(t)) continue;
      n.add(t);
      const i =
          "string" == typeof a.id && a.id.trim()
            ? a.id.trim()
            : t.replace(/\.[^.]+$/, ""),
        s =
          "string" == typeof a.label && a.label.trim()
            ? a.label.trim()
            : formatWallpaperLabelFromFile(t),
        c = normalizeWallpaperStyleConfig(a?.style, o[e]);
      l.push({
        id: i,
        file: t,
        label: s,
        style: c,
        sourceType: "bundled",
        isInstalled: !1,
        isArchived: !1,
        archivedAt: null,
      });
    }
    a[e] = l;
  }
  return (
    ["dark", "light"].forEach((e) => {
      const t = l.selectionByTheme?.[e];
      t && (a[e].some((e) => e?.file === t) || (l.selectionByTheme[e] = null));
    }),
    { themes: a, themeDefaults: o, newUserDefault: l }
  );
}
function getWallpaperCatalogEntriesForTheme(e) {
  const t = normalizeThemeMode(e);
  return Array.isArray(wallpaperCatalogByTheme[t])
    ? wallpaperCatalogByTheme[t]
    : [];
}
function mergeWallpaperCatalogs(e, t) {
  const r = {
    themes: createEmptyWallpaperCatalog(),
    themeDefaults: e?.themeDefaults || createEmptyWallpaperThemeDefaults(),
    newUserDefault:
      e?.newUserDefault || createEmptyNewUserWallpaperDefaultConfig(),
  };
  return (
    ["dark", "light"].forEach((a) => {
      const o = [],
        n = new Set();
      ([
        ...(Array.isArray(e?.themes?.[a]) ? e.themes[a] : []),
        ...(Array.isArray(t?.themes?.[a]) ? t.themes[a] : []),
      ].forEach((e) => {
        e?.file && !n.has(e.file) && (n.add(e.file), o.push(e));
      }),
        (r.themes[a] = o));
    }),
    r
  );
}
function getCurrentWallpaperCatalogState() {
  return {
    themes: {
      dark: Array.isArray(wallpaperCatalogByTheme.dark)
        ? wallpaperCatalogByTheme.dark
        : [],
      light: Array.isArray(wallpaperCatalogByTheme.light)
        ? wallpaperCatalogByTheme.light
        : [],
    },
    themeDefaults:
      wallpaperThemeDefaults || createEmptyWallpaperThemeDefaults(),
    newUserDefault:
      wallpaperNewUserDefaultConfig ||
      createEmptyNewUserWallpaperDefaultConfig(),
  };
}
function readCachedWallpaperStyleByTheme() {
  let e = null;
  try {
    const t = localStorage.getItem(WALLPAPER_STYLE_LOCAL_CACHE_KEY);
    if (t) {
      const r = JSON.parse(t);
      r && "object" == typeof r && (e = r);
    }
  } catch (t) {
    e = null;
  }
  const t = {
    dark: e?.dark && "object" == typeof e.dark ? e.dark : null,
    light: e?.light && "object" == typeof e.light ? e.light : null,
  };
  let r = Boolean(t.dark || t.light);
  for (const e of ["dark", "light"])
    try {
      const a = localStorage.getItem(`lumilist_wallpaper_boot_style_${e}`);
      if (!a) continue;
      const o = JSON.parse(a);
      o && "object" == typeof o && ((t[e] = o), (r = !0));
    } catch (e) {}
  return r ? t : null;
}
async function blobToDataUrl(e) {
  return await new Promise((t, r) => {
    const a = new FileReader();
    ((a.onload = () => t(String(a.result || ""))),
      (a.onerror = () => r(new Error("Failed to read wallpaper cache data."))),
      a.readAsDataURL(e));
  });
}
async function fetchHostedWallpaperAsDataUrl(e) {
  const t = await fetch(e, { cache: "force-cache" });
  if (!t.ok) throw new Error(`Wallpaper fetch failed (${t.status})`);
  const r = await t.blob();
  if (!r.size) throw new Error("Wallpaper fetch returned empty data.");
  return await blobToDataUrl(r);
}
async function ensureHostedWallpaperBinaryCache(e, t) {
  if (!isHostedWallpaperUrl(t)) return null;
  const r = getCachedWallpaperBinaryDataUrl(e, t);
  if (r) return (writeHostedWallpaperBootCache(e, t, r), r);
  try {
    const r = await fetchHostedWallpaperAsDataUrl(t);
    return writeCachedWallpaperBinaryDataUrl(e, t, r) ? r : null;
  } catch (e) {
    return (console.warn("Failed to cache hosted wallpaper locally:", e), null);
  }
}
async function ensureInstalledWallpaperBinaryCache(e, t) {
  const r = normalizeThemeMode(e),
    a = normalizeWallpaperPathForTheme(r, t);
  if (!isInstalledWallpaperRef(a)) return null;
  const o = getCachedWallpaperBinaryDataUrl(r, a);
  if (o) return (writeHostedWallpaperBootCache(r, a, o), o);
  const n = getInstalledWallpaperRecordByRef(a);
  if (!(n?.imageBlob instanceof Blob)) return null;
  try {
    const e = await blobToDataUrl(n.imageBlob);
    return writeCachedWallpaperBinaryDataUrl(r, a, e) ? e : null;
  } catch (e) {
    return (
      console.warn("Failed to cache installed wallpaper locally:", e),
      null
    );
  }
}
async function loadInstalledWallpaperCatalogFromDatabase() {
  try {
    const e = await db.table("installedWallpapers").toArray(),
      t = getWallpaperAccountScopeUserId(),
      r = getSelectedInstalledWallpaperRecordIds(),
      a = getWallpaperCloudManifestLookupForUser(t),
      o = [],
      n = new Set();
    e.sort(compareInstalledWallpaperFreshness);
    const i = createEmptyWallpaperCatalog(),
      s = new Map(),
      l = { dark: [], light: [] };
    for (const i of e) {
      const e = normalizeInstalledWallpaperRecordId(i?.id);
      if (!e) continue;
      const c = normalizeThemeMode(i?.theme),
        d = createInstalledWallpaperRef(c, e);
      if (!d) continue;
      const u =
          "string" == typeof i?.installedAt && i.installedAt
            ? i.installedAt
            : new Date().toISOString(),
        p = "string" == typeof i?.updatedAt && i.updatedAt ? i.updatedAt : u,
        m =
          "string" == typeof i?.label && i.label.trim()
            ? i.label.trim()
            : formatWallpaperLabelFromFile(i?.sourceUrl || e),
        g = normalizeWallpaperSyncUserId(i?.ownerUserId),
        f = {
          ...i,
          id: e,
          ownerUserId: g,
          theme: c,
          label: m,
          style: normalizeWallpaperStyleConfig(
            i?.style,
            getWallpaperThemeDefaultForTheme(c),
          ),
          sourceType:
            "string" == typeof i?.sourceType && i.sourceType.trim()
              ? i.sourceType.trim()
              : "remote-install",
          remoteId:
            "string" == typeof i?.remoteId && i.remoteId.trim()
              ? i.remoteId.trim()
              : null,
          sourceUrl:
            "string" == typeof i?.sourceUrl && i.sourceUrl.trim()
              ? i.sourceUrl.trim()
              : null,
          thumbnailUrl:
            "string" == typeof i?.thumbnailUrl && i.thumbnailUrl.trim()
              ? i.thumbnailUrl.trim()
              : null,
          version:
            "string" == typeof i?.version && i.version.trim()
              ? i.version.trim()
              : null,
          mimeType:
            "string" == typeof i?.mimeType && i.mimeType.trim()
              ? i.mimeType.trim()
              : i?.imageBlob instanceof Blob && i.imageBlob.type
                ? i.imageBlob.type
                : null,
          byteSize: Number.isFinite(Number(i?.byteSize))
            ? Number(i.byteSize)
            : i?.imageBlob instanceof Blob && Number.isFinite(i.imageBlob.size)
              ? i.imageBlob.size
              : 0,
          archivedAt: normalizeWallpaperArchivedAt(i?.archivedAt),
          installedAt: u,
          updatedAt: p,
          imageBlob: i?.imageBlob instanceof Blob ? i.imageBlob : null,
        },
        h = r.has(e),
        y =
          a.ids.has(e) ||
          (f.sourceUrl && a.sourceUrls.has(f.sourceUrl)) ||
          (f.remoteId && a.remoteIdsByTheme[c]?.has(f.remoteId));
      if (!(t ? g === t || h || y : h)) continue;
      (t &&
        g !== t &&
        (h || y) &&
        (o.push({ ...f, ownerUserId: t }), (f.ownerUserId = t)),
        s.set(d, f));
      const b =
        getWallpaperCanonicalSourceIdentity(c, {
          id: e,
          remoteId: f.remoteId,
          sourceUrl: f.sourceUrl,
        }) || `record:${c}:${e}`;
      findBundledWallpaperEquivalentEntry(c, {
        id: e,
        remoteId: f.remoteId,
        sourceUrl: f.sourceUrl,
      }) ||
        n.has(b) ||
        (n.add(b),
        l[c].push({
          id: `installed:${e}`,
          file: d,
          label: m,
          style: f.style,
          sourceType: f.sourceType,
          isInstalled: !0,
          isArchived: Boolean(f.archivedAt),
          archivedAt: f.archivedAt,
          installedAt: f.installedAt,
          updatedAt: f.updatedAt,
        }));
    }
    return (
      ["dark", "light"].forEach((e) => {
        i[e] = l[e]
          .sort(compareInstalledWallpaperDisplayOrder)
          .map(({ installedAt: e, updatedAt: t, ...r }) => r);
      }),
      o.length > 0 && (await db.table("installedWallpapers").bulkPut(o)),
      revokeStaleInstalledWallpaperObjectUrls(s),
      (installedWallpaperRecordsByRef = s),
      setInstalledWallpaperCatalogState(i),
      i
    );
  } catch (e) {
    return (
      console.warn(
        "Failed to load installed wallpaper catalog from IndexedDB. Continuing without installed wallpapers.",
        e,
      ),
      revokeStaleInstalledWallpaperObjectUrls(new Map()),
      (installedWallpaperRecordsByRef = new Map()),
      setInstalledWallpaperCatalogState(createEmptyWallpaperCatalog()),
      createEmptyWallpaperCatalog()
    );
  }
}
async function broadcastInstalledWallpaperCatalogVersionChange(
  e = new Date().toISOString(),
) {
  if (
    ((installedWallpaperCatalogVersion = e),
    "undefined" != typeof chrome && chrome.storage?.local)
  )
    try {
      await chrome.storage.local.set({
        [INSTALLED_WALLPAPER_CATALOG_VERSION_STORAGE_KEY]: e,
      });
    } catch (e) {
      console.warn(
        "Failed to broadcast installed wallpaper catalog refresh:",
        e,
      );
    }
}
async function installWallpaperBlobLocally({
  theme: e,
  sourceUrl: t = null,
  imageBlob: r,
  remoteId: a = null,
  label: o = null,
  style: n = null,
  thumbnailUrl: i = null,
  version: s = null,
  sourceType: l = null,
  expectedOwnerUserId: c = null,
}) {
  const d = normalizeThemeMode(e),
    u = "string" == typeof l && l.trim() ? l.trim() : null,
    p = "user-upload" === u,
    m = p ? null : normalizeWallpaperPathForTheme(d, t);
  if (!p && !isHostedWallpaperUrl(m))
    throw new Error("Wallpaper source must be a hosted wallpaper URL.");
  if (!(r instanceof Blob && r.size))
    throw new Error("Wallpaper install requires a non-empty image blob.");
  const g =
      findExistingInstalledWallpaperRecordId({
        theme: d,
        remoteId: a,
        sourceUrl: m,
      }) ||
      createInstalledWallpaperRecordId({ theme: d, remoteId: a, sourceUrl: m }),
    f = createInstalledWallpaperRef(d, g),
    h = await db.table("installedWallpapers").get(g),
    y = new Date().toISOString(),
    b = getWallpaperAccountScopeUserId(),
    S = "string" == typeof c ? c.trim() : "";
  if (S && b !== S)
    throw new Error("Wallpaper upload stopped after the account changed.");
  if (
    (await db
      .table("installedWallpapers")
      .put({
        id: g,
        ownerUserId: b,
        theme: d,
        label:
          "string" == typeof o && o.trim()
            ? o.trim()
            : formatWallpaperLabelFromFile(m),
        style: normalizeWallpaperStyleConfig(
          n,
          getWallpaperThemeDefaultForTheme(d),
        ),
        sourceType:
          u ||
          ("string" == typeof a && a.trim()
            ? "remote-gallery"
            : "remote-hosted"),
        remoteId: "string" == typeof a && a.trim() ? a.trim() : null,
        sourceUrl: m,
        thumbnailUrl: "string" == typeof i && i.trim() ? i.trim() : null,
        version: "string" == typeof s && s.trim() ? s.trim() : null,
        mimeType: r.type || null,
        byteSize: r.size,
        imageBlob: r,
        archivedAt: null,
        installedAt: h?.installedAt || y,
        updatedAt: y,
      }),
    S && getWallpaperAccountScopeUserId() !== S)
  )
    throw (
      await db.table("installedWallpapers").delete(g),
      new Error("Wallpaper upload stopped after the account changed.")
    );
  return (
    await loadInstalledWallpaperCatalogFromDatabase(),
    await broadcastInstalledWallpaperCatalogVersionChange(y),
    { installedRef: f, record: getInstalledWallpaperRecordByRef(f) }
  );
}
async function installRemoteWallpaperLocally({
  theme: e,
  sourceUrl: t,
  remoteId: r = null,
  label: a = null,
  style: o = null,
  thumbnailUrl: n = null,
  version: i = null,
  installContext: s = "unknown",
  fetchCache: l = "force-cache",
}) {
  const c = normalizeThemeMode(e),
    d = normalizeWallpaperPathForTheme(c, t);
  if (!isHostedWallpaperUrl(d))
    throw new Error("Wallpaper install source must be a hosted wallpaper URL.");
  recordWallpaperDiagnosticEvent(
    "wallpaper-install-download-started",
    { theme: c, installContext: s, remoteId: r || null, sourceUrl: d },
    { counter: "installDownloads" },
  );
  try {
    const e = await fetch(d, { cache: l });
    if (!e.ok) {
      const t = new Error(`Wallpaper install failed (${e.status})`);
      throw ((t.status = e.status), t);
    }
    const t = await e.blob();
    if (!t.size) throw new Error("Wallpaper install returned empty data.");
    const u = await installWallpaperBlobLocally({
      theme: c,
      sourceUrl: d,
      imageBlob: t,
      remoteId: r,
      label: a,
      style: o,
      thumbnailUrl: n,
      version: i,
      sourceType:
        "string" == typeof r && r.trim() ? "remote-gallery" : "remote-hosted",
    });
    return (
      recordWallpaperDiagnosticEvent("wallpaper-install-download-succeeded", {
        theme: c,
        installContext: s,
        remoteId: r || null,
        sourceUrl: d,
        installedRef: u?.installedRef || null,
      }),
      u
    );
  } catch (e) {
    throw (
      recordWallpaperDiagnosticEvent(
        "wallpaper-install-download-failed",
        {
          theme: c,
          installContext: s,
          remoteId: r || null,
          sourceUrl: d,
          error: e?.message || String(e),
        },
        { counter: "installFailures" },
      ),
      e
    );
  }
}
function extractWallpaperHttpStatusFromError(e) {
  if (!e) return null;
  const t = Number(e.status || e.statusCode);
  if (Number.isFinite(t)) return t;
  const r = Number(e.code);
  if (Number.isFinite(r) && r >= 100 && r <= 599) return r;
  const a = (e instanceof Error ? e.message : String(e ?? "")).match(
    /\b(4\d{2}|5\d{2})\b/,
  );
  return a ? Number(a[1]) : null;
}
function isWallpaperRemoteAssetMissingError(e) {
  const t = extractWallpaperHttpStatusFromError(e);
  return 400 === t || 404 === t;
}
async function removeInstalledWallpaperRecordLocally(
  e,
  { sourceUrl: t = null } = {},
) {
  const r = parseInstalledWallpaperRef(e);
  if (!r?.recordId)
    return {
      removed: !1,
      installedRef: null,
      recordId: null,
      theme: null,
      sourceUrl: null,
      remoteId: null,
    };
  const a = r.ref,
    o = getInstalledWallpaperRecordByRef(a),
    n = normalizeWallpaperPathForTheme(r.theme, t || o?.sourceUrl || null);
  return (
    clearCachedWallpaperBinaryDataUrl(r.theme, a),
    n && clearCachedWallpaperBinaryDataUrl(r.theme, n),
    revokeInstalledWallpaperObjectUrl(a),
    await db.table("installedWallpapers").delete(r.recordId),
    await loadInstalledWallpaperCatalogFromDatabase(),
    await broadcastInstalledWallpaperCatalogVersionChange(
      new Date().toISOString(),
    ),
    {
      removed: !0,
      installedRef: a,
      recordId: r.recordId,
      theme: r.theme,
      sourceUrl: n,
      remoteId:
        "string" == typeof o?.remoteId && o.remoteId.trim()
          ? o.remoteId.trim()
          : null,
    }
  );
}
async function setInstalledWallpaperArchiveStateLocally(
  e,
  { archived: t = !0 } = {},
) {
  const r = parseInstalledWallpaperRef(e);
  if (!r?.recordId)
    return {
      updated: !1,
      installedRef: null,
      recordId: null,
      theme: null,
      archivedAt: null,
    };
  const a = r.ref,
    o = getInstalledWallpaperRecordByRef(a);
  if (!o)
    return {
      updated: !1,
      installedRef: a,
      recordId: r.recordId,
      theme: r.theme,
      archivedAt: null,
    };
  const n = t ? new Date().toISOString() : null,
    i = normalizeWallpaperArchivedAt(o.archivedAt);
  if ((null !== i) == (null !== n))
    return {
      updated: !0,
      installedRef: a,
      recordId: r.recordId,
      theme: r.theme,
      archivedAt: i,
    };
  const s = new Date().toISOString();
  return (
    await db
      .table("installedWallpapers")
      .update(r.recordId, { archivedAt: n, updatedAt: s }),
    await loadInstalledWallpaperCatalogFromDatabase(),
    await broadcastInstalledWallpaperCatalogVersionChange(s),
    {
      updated: !0,
      installedRef: a,
      recordId: r.recordId,
      theme: r.theme,
      archivedAt: n,
    }
  );
}
async function setInstalledWallpaperStyleLocally(e, { style: t } = {}) {
  const r = parseInstalledWallpaperRef(e);
  if (!r?.recordId)
    return {
      updated: !1,
      installedRef: null,
      recordId: null,
      theme: null,
      style: null,
    };
  const a = r.ref,
    o = getInstalledWallpaperRecordByRef(a);
  if (!o)
    return {
      updated: !1,
      installedRef: a,
      recordId: r.recordId,
      theme: r.theme,
      style: null,
    };
  const n = normalizeWallpaperStyleConfig(
    t,
    getWallpaperThemeDefaultForTheme(r.theme),
  );
  if (JSON.stringify(o.style || null) === JSON.stringify(n))
    return {
      updated: !0,
      installedRef: a,
      recordId: r.recordId,
      theme: r.theme,
      style: n,
    };
  const i = new Date().toISOString();
  return (
    await db
      .table("installedWallpapers")
      .update(r.recordId, { style: n, updatedAt: i }),
    await loadInstalledWallpaperCatalogFromDatabase(),
    await broadcastInstalledWallpaperCatalogVersionChange(i),
    {
      updated: !0,
      installedRef: a,
      recordId: r.recordId,
      theme: r.theme,
      style: n,
    }
  );
}
async function importWallpaperCloudManifestIntoDatabase(
  e,
  { broadcast: t = !1 } = {},
) {
  const r = getWallpaperAccountScopeUserId(),
    a = normalizeWallpaperCloudSyncState(e, r);
  if (shouldIgnoreIncomingWallpaperCloudState(a, wallpaperCloudSyncState))
    return (
      recordWallpaperDiagnosticEvent("wallpaper-cloud-state-ignored-stale", {
        userId: a?.userId || null,
        incomingUpdatedAt: a?.updatedAt || null,
        currentUpdatedAt: wallpaperCloudSyncState?.updatedAt || null,
      }),
      wallpaperCloudSyncState
    );
  if (((wallpaperCloudSyncState = a), !r || a.userId !== r))
    return (await loadInstalledWallpaperCatalogFromDatabase(), a);
  const o = Array.isArray(a.installedWallpapers)
      ? [...a.installedWallpapers].sort((e, t) => {
          const r = Date.parse(e?.updatedAt || 0);
          return Date.parse(t?.updatedAt || 0) - r;
        })
      : [],
    n = [],
    i = new Set();
  if (
    (o.forEach((e) => {
      const t =
        getWallpaperCanonicalSourceIdentity(e?.theme, e) ||
        `record:${normalizeThemeMode(e?.theme)}:${normalizeInstalledWallpaperRecordId(e?.id)}`;
      t &&
        !i.has(t) &&
        (findBundledWallpaperEquivalentEntry(e?.theme, e) ||
          (i.add(t), n.push(e)));
    }),
    n.length > 0)
  ) {
    const e = await db.table("installedWallpapers").toArray(),
      t = new Map(
        e.map((e) => [normalizeInstalledWallpaperRecordId(e?.id), e]),
      ),
      a = new Date().toISOString(),
      o = n.map((e) => {
        const o = t.get(e.id) || null;
        return {
          ...(o || {}),
          id: e.id,
          ownerUserId: r,
          theme: e.theme,
          label: e.label,
          style: e.style,
          sourceType:
            o?.sourceType || (e.remoteId ? "remote-gallery" : "remote-hosted"),
          remoteId: e.remoteId,
          sourceUrl: e.sourceUrl,
          thumbnailUrl: e.thumbnailUrl,
          version: e.version,
          mimeType: o?.mimeType || null,
          byteSize: Number.isFinite(Number(o?.byteSize))
            ? Number(o.byteSize)
            : 0,
          imageBlob: o?.imageBlob instanceof Blob ? o.imageBlob : null,
          installedAt: o?.installedAt || e.installedAt || e.updatedAt || a,
          updatedAt: e.updatedAt || o?.updatedAt || a,
        };
      });
    await db.table("installedWallpapers").bulkPut(o);
  }
  return (
    await loadInstalledWallpaperCatalogFromDatabase(),
    t &&
      (await broadcastInstalledWallpaperCatalogVersionChange(
        a.updatedAt || new Date().toISOString(),
      )),
    a
  );
}
async function loadWallpaperCloudSyncStateFromStorage(
  e = wallpaperAccountScopeUserId,
  t,
) {
  const r = normalizeWallpaperSyncUserId(e);
  return (
    (wallpaperCloudSyncState = createEmptyWallpaperCloudSyncState(r)),
    await loadInstalledWallpaperCatalogFromDatabase(),
    wallpaperCloudSyncState
  );
}
async function buildWallpaperPreferenceSyncPayload(e) {
  const t = normalizeWallpaperSyncUserId(e);
  if (!t) return null;
  let r = wallpaperSelectionByTheme;
  if ("undefined" != typeof chrome && chrome.storage?.local)
    try {
      const e = await chrome.storage.local.get(WALLPAPER_STORAGE_KEY);
      Object.prototype.hasOwnProperty.call(e, WALLPAPER_STORAGE_KEY) &&
        (r = e[WALLPAPER_STORAGE_KEY]);
    } catch (e) {
      console.warn(
        "Failed to read shared wallpaper selection for sync payload:",
        e,
      );
    }
  const a = buildSyncSafeWallpaperSelection(r),
    { selection: o } = reconcileWallpaperSelection(a, {
      preserveHostedSelections: !0,
      preserveInstalledSelections: !0,
    }),
    n = getSelectedInstalledWallpaperRecordIds(o),
    i = getWallpaperCloudManifestLookupForUser(t),
    s = await db.table("installedWallpapers").toArray();
  s.sort(compareInstalledWallpaperDisplayOrder);
  const l = [],
    c = new Set();
  for (const e of s) {
    if (isLocalUserWallpaperRecord(e)) continue;
    const r = normalizeWallpaperCloudInstallEntry({
      id: e?.id,
      recordId: e?.id,
      theme: e?.theme,
      remoteId: e?.remoteId,
      sourceUrl: e?.sourceUrl,
      label: e?.label,
      style: e?.style,
      thumbnailUrl: e?.thumbnailUrl,
      version: e?.version,
      installedAt: e?.installedAt || null,
      updatedAt: e?.updatedAt || e?.installedAt || null,
    });
    if (!r) continue;
    if (
      !(
        normalizeWallpaperSyncUserId(e?.ownerUserId) === t ||
        n.has(r.id) ||
        i.ids.has(r.id) ||
        (r.sourceUrl && i.sourceUrls.has(r.sourceUrl)) ||
        (r.remoteId && i.remoteIdsByTheme[r.theme]?.has(r.remoteId))
      )
    )
      continue;
    if (findBundledWallpaperEquivalentEntry(r.theme, r)) continue;
    const a =
      getWallpaperCanonicalSourceIdentity(r.theme, r) ||
      `record:${r.theme}:${r.id}`;
    c.has(a) || (c.add(a), l.push(r));
  }
  return (
    l.sort(compareInstalledWallpaperDisplayOrder),
    {
      theme_mode: normalizeThemeMode(themeMode),
      wallpaper_selection: { dark: o.dark ?? null, light: o.light ?? null },
      wallpaper_installs: l,
      wallpaper_preferences_updated_at: getNextWallpaperPreferenceUpdatedAt(t),
    }
  );
}
async function persistCurrentWallpaperCloudSyncStateLocally(
  e = wallpaperAccountScopeUserId,
) {
  const t = normalizeWallpaperSyncUserId(e);
  if (!t) return null;
  const r = await buildWallpaperPreferenceSyncPayload(t);
  return r
    ? (await persistWallpaperCloudSyncStateFromPreferencePayload(t, r), r)
    : null;
}
async function queueWallpaperPreferenceSync(e = "wallpaper-preferences") {
  return (
    (wallpaperPreferenceSyncPending = !1),
    { success: !1, skipped: !0, reason: "wallpaper_sync_disabled", context: e }
  );
}
async function markWallpaperPreferenceSyncReady(e) {
  const t = normalizeWallpaperSyncUserId(e);
  if (
    t &&
    t === getWallpaperAccountScopeUserId() &&
    ((wallpaperPreferenceSyncReadyUserId = t), wallpaperPreferencesInitialized)
  )
    try {
      (await ensureWallpaperPreferencesInitialized(),
        await applyWebsiteWallpaperHandoffFromUrl());
    } catch (e) {
      console.warn(
        "Failed to resume pending wallpaper handoff after local wallpaper restore:",
        e,
      );
    }
}
function resolveWallpaperRenderSource(e, t) {
  const r = normalizeThemeMode(e),
    a = normalizeWallpaperPathForTheme(r, t);
  if (isInstalledWallpaperRef(a)) {
    const e = getInstalledWallpaperRecordByRef(a),
      t = normalizeWallpaperPathForTheme(r, e?.sourceUrl || null);
    return (
      getCachedWallpaperBinaryDataUrl(r, a) ||
      getInstalledWallpaperObjectUrl(a) ||
      t ||
      null
    );
  }
  return (
    (isHostedWallpaperUrl(a) && getCachedWallpaperBinaryDataUrl(r, a)) || a
  );
}
function findWallpaperCatalogEntry(e, t) {
  if (!t) return null;
  const r = normalizeWallpaperPathForTheme(e, t);
  return (
    (r && getWallpaperCatalogEntriesForTheme(e).find((e) => e.file === r)) ||
    null
  );
}
function areWallpaperSelectionsEqual(e, t) {
  return (
    (e?.dark ?? null) === (t?.dark ?? null) &&
    (e?.light ?? null) === (t?.light ?? null)
  );
}
function reconcileWallpaperSelection(e, t = {}) {
  const r = !0 === t.preserveHostedSelections,
    a = !1 !== t.preserveInstalledSelections,
    o = !1 !== t.preserveBundledSelections,
    n = e && "object" == typeof e ? e : {},
    i = createEmptyWallpaperSelection();
  let s = !1;
  const l = ["dark", "light"];
  for (const e of l) {
    const t = Object.prototype.hasOwnProperty.call(n, e),
      l = t ? n[e] : void 0,
      c = normalizeThemeMode(e);
    if (t && null === l) i[c] = null;
    else {
      const e = normalizeWallpaperPathForTheme(c, l),
        t = e ? findEquivalentWallpaperCatalogEntry(c, e) : null,
        n = r && isHostedWallpaperUrl(e),
        s = a && isInstalledWallpaperRef(e),
        d = o && e && !isHostedWallpaperUrl(e) && !isInstalledWallpaperRef(e),
        u = isHostedWallpaperUrl(e) && hasCachedHostedWallpaperBinary(c, e),
        p = isInstalledWallpaperRef(e) && hasCachedWallpaperBinary(c, e);
      t?.file
        ? (i[c] = t.file)
        : e && (findWallpaperCatalogEntry(c, e) || n || s || d || u || p)
          ? (i[c] = e)
          : (i[c] = null);
    }
    (t && l === i[c]) || (s = !0);
  }
  return { selection: i, changed: s };
}
function cacheWallpaperSelectionLocally(e = wallpaperSelectionByTheme) {
  try {
    localStorage.setItem(
      WALLPAPER_LOCAL_CACHE_KEY,
      JSON.stringify({ dark: e.dark ?? null, light: e.light ?? null }),
    );
  } catch (e) {}
}
function readCachedWallpaperSelection() {
  try {
    const e = localStorage.getItem(WALLPAPER_LOCAL_CACHE_KEY);
    if (!e) return null;
    const t = JSON.parse(e);
    return t && "object" == typeof t ? t : null;
  } catch (e) {
    return null;
  }
}
function getResolvedWallpaperStyleForTheme(
  e,
  { allowWallpaper: t = !0, includeUserOverrides: r = !0 } = {},
) {
  const a = normalizeThemeMode(e),
    o = getWallpaperThemeDefaultForTheme(a);
  if (!t)
    return r && "function" == typeof applyWallpaperUserStyleOverride
      ? applyWallpaperUserStyleOverride(a, o)
      : o;
  const n = wallpaperSelectionByTheme[a] || null,
    i = n ? findWallpaperCatalogEntry(a, n) : null,
    s = n ? readCachedWallpaperStyleByTheme() : null,
    l = s?.[a],
    c = isInstalledWallpaperRef(n) ? getInstalledWallpaperRecordByRef(n) : null;
  let d = null;
  if (
    ((d = normalizeWallpaperStyleConfig(
      c
        ? c?.style
          ? c.style
          : i?.style
            ? i.style
            : l
        : !i && n
          ? l
          : i?.style,
      o,
    )),
    c &&
      "string" == typeof c?.sourceType &&
      "user-upload" === c.sourceType.trim())
  ) {
    const e = "light" === a ? "#1A1F2E" : "#FFFFFF",
      t = normalizeHexColor(d.boardBackgroundColor, o.boardBackgroundColor),
      r = normalizeOpacity(d.boardBackgroundOpacity, o.boardBackgroundOpacity),
      n = normalizeBoardBackdropBlur(d.boardBackdropBlur, o.boardBackdropBlur);
    d = normalizeWallpaperStyleConfig(
      {
        ...d,
        addBoardColor: e,
        inactiveControlColor: t,
        inactiveControlOpacity: r,
        inactiveControlBackdropBlur: n,
        popupBackgroundColor: t,
        popupBackgroundOpacity: 1,
        dropdownBackgroundColor: t,
        dropdownBackgroundOpacity: 1,
        overlay: { ...(d?.overlay || {}), topOpacity: 0, bottomOpacity: 0 },
      },
      o,
    );
  }
  return r && "function" == typeof applyWallpaperUserStyleOverride
    ? applyWallpaperUserStyleOverride(a, d)
    : d;
}
function cacheWallpaperStyleLocally() {
  try {
    const e = {
      dark: getResolvedWallpaperStyleForTheme("dark"),
      light: getResolvedWallpaperStyleForTheme("light"),
    };
    (localStorage.setItem(WALLPAPER_STYLE_LOCAL_CACHE_KEY, JSON.stringify(e)),
      writeWallpaperBootStyleCache("dark", e.dark),
      writeWallpaperBootStyleCache("light", e.light),
      globalThis.LumiListTheme?.publishTheme(
        getWallpaperAccountScopeUserId(),
        themeMode,
        e,
      ));
  } catch (e) {}
}
function applyThemeStyleTokens(e) {
  const t = normalizeThemeMode(themeMode),
    r = normalizeWallpaperStyleConfig(e, DEFAULT_WALLPAPER_THEME_STYLES[t]),
    a = buildAccentPalette(r.primary, t),
    o = resolveReadableForegroundForHexes(
      [a.accent1, a.accent3, a.accentHover],
      "#1A1F2E",
      "#FFFFFF",
    ),
    n = normalizeHexColor(
      r.activeTextColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].activeTextColor,
    ),
    i = normalizeHexColor(
      r.tabHoverTextColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].tabHoverTextColor,
    ),
    s = normalizeHexColor(
      r.inactiveTabTextColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].inactiveTabTextColor,
    ),
    l = normalizeHexColor(
      r.boardTextColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].boardTextColor,
    ),
    c = normalizeHexColor(
      r.linkDescriptionTextColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].linkDescriptionTextColor,
    ),
    d = normalizeHexColor(
      r.iconColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].iconColor,
    ),
    u = normalizeHexColor(
      r.tabArrowColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].tabArrowColor,
    ),
    p = normalizeHexColor(
      r.addBoardColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].addBoardColor,
    ),
    m = resolveReadableForegroundForHex(p, "#1A1F2E", "#FFFFFF"),
    g = hexToRgb(p) ||
      hexToRgb(DEFAULT_WALLPAPER_THEME_STYLES[t].addBoardColor) || {
        r: 45,
        g: 255,
        b: 177,
      },
    f = normalizeHexColor(
      r.boardBackgroundColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].boardBackgroundColor,
    ),
    h = hexToRgb(f) ||
      hexToRgb(DEFAULT_WALLPAPER_THEME_STYLES[t].boardBackgroundColor) || {
        r: 41,
        g: 46,
        b: 61,
      },
    y = normalizeOpacity(
      r.boardBackgroundOpacity,
      DEFAULT_WALLPAPER_THEME_STYLES[t].boardBackgroundOpacity,
    ),
    b = normalizeBoardBackdropBlur(
      r.boardBackdropBlur,
      DEFAULT_WALLPAPER_THEME_STYLES[t].boardBackdropBlur,
    ),
    S = normalizeBoardBackdropSaturate(
      r.boardBackdropSaturate,
      DEFAULT_WALLPAPER_THEME_STYLES[t].boardBackdropSaturate,
    ),
    w = normalizeHexColor(
      r.inactiveControlColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].inactiveControlColor,
    ),
    k = hexToRgb(w) ||
      hexToRgb(DEFAULT_WALLPAPER_THEME_STYLES[t].inactiveControlColor) || {
        r: 58,
        g: 70,
        b: 82,
      },
    I = normalizeOpacity(
      r.inactiveControlOpacity,
      DEFAULT_WALLPAPER_THEME_STYLES[t].inactiveControlOpacity,
    ),
    L = normalizeInactiveControlBackdropBlur(
      r.inactiveControlBackdropBlur,
      DEFAULT_WALLPAPER_THEME_STYLES[t].inactiveControlBackdropBlur,
    ),
    T = normalizeInactiveControlBackdropSaturate(
      r.inactiveControlBackdropSaturate,
      DEFAULT_WALLPAPER_THEME_STYLES[t].inactiveControlBackdropSaturate,
    ),
    E = Number(Math.min(1, I + 0.12).toFixed(3)),
    C = normalizeHexColor(
      r.popupBackgroundColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].popupBackgroundColor,
    ),
    v = hexToRgb(C) ||
      hexToRgb(DEFAULT_WALLPAPER_THEME_STYLES[t].popupBackgroundColor) || {
        r: 40,
        g: 44,
        b: 52,
      },
    A = normalizeOpacity(
      r.popupBackgroundOpacity,
      DEFAULT_WALLPAPER_THEME_STYLES[t].popupBackgroundOpacity,
    ),
    _ = Number(Math.max(0, A - 0.1).toFixed(3)),
    B = Number(Math.max(0, A - 0.24).toFixed(3)),
    P = Number(Math.max(0, A - 0.08).toFixed(3)),
    R = normalizeHexColor(
      r.popupCardBackgroundColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].popupCardBackgroundColor,
    ),
    F = hexToRgb(R) ||
      hexToRgb(DEFAULT_WALLPAPER_THEME_STYLES[t].popupCardBackgroundColor) || {
        r: 255,
        g: 255,
        b: 255,
      },
    x = normalizeOpacity(
      r.popupCardBackgroundOpacity,
      DEFAULT_WALLPAPER_THEME_STYLES[t].popupCardBackgroundOpacity,
    ),
    M = normalizeHexColor(
      r.dropdownBackgroundColor,
      DEFAULT_WALLPAPER_THEME_STYLES[t].dropdownBackgroundColor,
    ),
    O = hexToRgb(M) ||
      hexToRgb(DEFAULT_WALLPAPER_THEME_STYLES[t].dropdownBackgroundColor) || {
        r: 62,
        g: 69,
        b: 91,
      },
    W = normalizeOpacity(
      r.dropdownBackgroundOpacity,
      DEFAULT_WALLPAPER_THEME_STYLES[t].dropdownBackgroundOpacity,
    ),
    U = Number(Math.max(0, W - 0.1).toFixed(3)),
    D = document.documentElement.style;
  (D.setProperty("--ll-app-wallpaper-overlay", toOverlayGradientCss(r.overlay)),
    D.setProperty("--ll-accent-1", a.accent1),
    D.setProperty("--ll-accent-2", a.accent2),
    D.setProperty("--ll-accent-3", a.accent3),
    D.setProperty("--ll-accent-4", a.accent4),
    D.setProperty("--ll-accent-hover", a.accentHover),
    D.setProperty("--ll-accent-rgb", a.accentRgb),
    D.setProperty("--ll-accent-soft", a.accentSoft),
    D.setProperty("--ll-accent-soft-2", a.accentSoft2),
    D.setProperty("--ll-accent-soft-3", a.accentSoft3),
    D.setProperty("--ll-border-accent", a.borderAccent),
    D.setProperty("--ll-accent-outline", a.accentOutline),
    D.setProperty("--ll-search-page-badge-bg", a.searchPageBadgeBg),
    D.setProperty("--ll-search-page-badge-border", a.searchPageBadgeBorder),
    D.setProperty("--ll-search-page-badge-text", a.searchPageBadgeText),
    D.setProperty("--ll-active-text-color", n),
    D.setProperty("--ll-accent-active-text-color", o),
    D.setProperty("--ll-tab-hover-text-color", i),
    D.setProperty("--ll-tab-inactive-text-color", s),
    D.setProperty("--ll-board-text-color", l),
    D.setProperty("--ll-link-description-color", c),
    D.setProperty("--ll-icon-color", d),
    D.setProperty("--ll-icon-dot", d),
    D.setProperty("--ll-tab-arrow-color", u),
    D.setProperty("--ll-add-board-color", p),
    D.setProperty(
      "--ll-add-board-rgb",
      `${Math.round(g.r)}, ${Math.round(g.g)}, ${Math.round(g.b)}`,
    ),
    D.setProperty("--ll-add-board-icon-color", m),
    D.setProperty("--ll-board-bg-color", f),
    D.setProperty(
      "--ll-board-bg-rgb",
      `${Math.round(h.r)}, ${Math.round(h.g)}, ${Math.round(h.b)}`,
    ),
    D.setProperty("--ll-board-bg-opacity", String(y)),
    D.setProperty("--ll-board-backdrop-blur", `${b}px`),
    D.setProperty("--ll-board-backdrop-saturate", `${S}%`),
    D.setProperty("--ll-control-bg-color", w),
    D.setProperty(
      "--ll-control-bg-rgb",
      `${Math.round(k.r)}, ${Math.round(k.g)}, ${Math.round(k.b)}`,
    ),
    D.setProperty("--ll-control-bg-opacity", String(I)),
    D.setProperty("--ll-control-bg-hover-opacity", String(E)),
    D.setProperty("--ll-control-backdrop-blur", `${L}px`),
    D.setProperty("--ll-control-backdrop-saturate", `${T}%`),
    D.setProperty("--ll-popup-bg-color", C),
    D.setProperty(
      "--ll-popup-bg-rgb",
      `${Math.round(v.r)}, ${Math.round(v.g)}, ${Math.round(v.b)}`,
    ),
    D.setProperty("--ll-popup-bg-opacity", String(A)),
    D.setProperty("--ll-popup-bg-opacity-soft", String(_)),
    D.setProperty("--ll-popup-bg-sidebar-opacity", String(B)),
    D.setProperty("--ll-popup-bg-content-opacity", String(P)),
    D.setProperty("--ll-popup-card-bg-color", R),
    D.setProperty(
      "--ll-popup-card-bg-rgb",
      `${Math.round(F.r)}, ${Math.round(F.g)}, ${Math.round(F.b)}`,
    ),
    D.setProperty("--ll-popup-card-bg-opacity", String(x)),
    D.setProperty(
      "--ll-popup-bg-surface",
      `linear-gradient(135deg, rgba(${Math.round(v.r)}, ${Math.round(v.g)}, ${Math.round(v.b)}, ${A}), rgba(${Math.round(v.r)}, ${Math.round(v.g)}, ${Math.round(v.b)}, ${_}))`,
    ),
    D.setProperty("--ll-dropdown-bg-color", M),
    D.setProperty(
      "--ll-dropdown-bg-rgb",
      `${Math.round(O.r)}, ${Math.round(O.g)}, ${Math.round(O.b)}`,
    ),
    D.setProperty("--ll-dropdown-bg-opacity", String(W)),
    D.setProperty("--ll-dropdown-bg-opacity-soft", String(U)),
    D.setProperty(
      "--ll-dropdown-bg-surface",
      `linear-gradient(135deg, rgba(${Math.round(O.r)}, ${Math.round(O.g)}, ${Math.round(O.b)}, ${W}), rgba(${Math.round(O.r)}, ${Math.round(O.g)}, ${Math.round(O.b)}, ${U}))`,
    ));
  const N = globalThis.LumiListTheme?.buildInterfaceTokens(r, t) || {};
  for (const [e, t] of Object.entries(N)) D.setProperty(e, t);
}
function toCssUrlValue(e) {
  return e ? `url("${String(e).replace(/["\\]/g, "\\$&")}")` : "none";
}
function getThemeTokenValue(e, t = "") {
  try {
    const r = getComputedStyle(document.documentElement).getPropertyValue(e);
    return (r ? r.trim() : "") || t;
  } catch (e) {
    return t;
  }
}
async function ensureFirstTabSelected() {
  const e = await db.pages.filter((e) => !e.deletedAt).sortBy("order");
  0 !== e.length &&
    (e.find((e) => e.id === currentPageId) ||
      ((currentPageId = e[0].id),
      "undefined" != typeof chrome &&
        chrome.storage &&
        (await chrome.storage.local.set({ currentPageId: e[0].id }))),
    document.querySelectorAll(".page-tab").forEach((e) => {
      const t = e.dataset.pageId;
      (e.classList.remove("active"),
        t === currentPageId && e.classList.add("active"));
    }),
    document.querySelectorAll(".dropdown-item").forEach((e) => {
      const t = e.dataset.pageId;
      (e.classList.remove("active"),
        t === currentPageId && e.classList.add("active"));
    }));
}
exposeWallpaperDiagnosticsDebugApi();
let syncPollInterval = null;
"undefined" != typeof chrome &&
  chrome.storage &&
  chrome.storage.onChanged &&
  chrome.storage.onChanged.addListener((e, t) => {
    try {
      if ("local" === t && e.reloadBoardsSignal) {
        const t = e.reloadBoardsSignal.newValue;
        if (t && t.timestamp) {
          if (!initialAuthCompleted) return;
          if (t.broadcastId && ownBroadcastIds.has(t.broadcastId)) return;
          if (
            "undefined" != typeof SyncManager &&
            SyncManager.isSyncing &&
            SyncManager.isSyncing()
          )
            return (
              syncPollInterval &&
                (clearInterval(syncPollInterval), (syncPollInterval = null)),
              (syncPollInterval = setInterval(async () => {
                try {
                  SyncManager.isSyncing() ||
                    (clearInterval(syncPollInterval),
                    (syncPollInterval = null),
                    await loadPagesNavigation(),
                    await ensureFirstTabSelected(),
                    await loadBoardsFromDatabase(),
                    await refreshSearchIfOpen());
                } catch (e) {
                  (console.error("Error in sync poll interval:", e),
                    clearInterval(syncPollInterval),
                    (syncPollInterval = null));
                }
              }, 200)),
              void setTimeout(async () => {
                if (syncPollInterval) {
                  (clearInterval(syncPollInterval), (syncPollInterval = null));
                  try {
                    (await loadPagesNavigation(),
                      await ensureFirstTabSelected(),
                      await loadBoardsFromDatabase(),
                      await refreshSearchIfOpen());
                  } catch (e) {
                    console.error("Failed to load boards after timeout:", e);
                  }
                }
              }, 5e3)
            );
          setTimeout(async () => {
            _showPlaceholderTimeoutId &&
              (clearTimeout(_showPlaceholderTimeoutId),
              (_showPlaceholderTimeoutId = null));
            try {
              (await recalculateBookmarkCount(),
                await loadPagesNavigation(),
                await ensureFirstTabSelected(),
                await loadBoardsFromDatabase(),
                await refreshSearchIfOpen(),
                "quickSave" === t.source && scheduleReviewPromptDisplay());
            } catch (e) {
              console.error("Failed to reload boards:", e);
            }
          }, 300);
        }
      }
    } catch (e) {
      console.error(
        "Error in reloadBoardsSignal handler:",
        e?.message || e,
        e?.stack,
      );
    }
  });
let isAddingBookmark = !1,
  isAddingBoard = !1,
  isCreatingPage = !1;
function getElementIndex(e) {
  const t = e.parentNode;
  return t ? Array.from(t.children).indexOf(e) : -1;
}
function getDragAfterElement(e, t) {
  return [...e.querySelectorAll(".board:not(.dragging)")].reduce(
    (e, r) => {
      const a = r.getBoundingClientRect(),
        o = t - a.top - a.height / 2;
      return o < 0 && o > e.offset ? { offset: o, element: r } : e;
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}
function getOrCreateDropIndicator() {
  let e = document.querySelector(".drop-indicator");
  return (
    e ||
      ((e = document.createElement("div")), (e.className = "drop-indicator")),
    e
  );
}
function getBookmarkDragAfterElement(e, t) {
  return [...e.querySelectorAll("li[data-bookmark-id]:not(.dragging)")].reduce(
    (e, r) => {
      const a = r.getBoundingClientRect(),
        o = t - a.top - a.height / 2;
      return o < 0 && o > e.offset ? { offset: o, element: r } : e;
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}
function getOrCreateBookmarkDropIndicator() {
  let e = document.querySelector(".bookmark-drop-indicator");
  return (
    e ||
      ((e = document.createElement("div")),
      (e.className = "bookmark-drop-indicator")),
    e
  );
}
let currentBoardId = null;
function getDescriptionCharactersRemaining(e = "") {
  return 2e3 - e.length;
}
function updateDescriptionRemainingCounter(e, t) {
  if (!t) return;
  const r = e && "string" == typeof e.value ? e.value : "";
  t.textContent = String(getDescriptionCharactersRemaining(r));
}
function initializeDescriptionRemainingCounter(e, t) {
  e &&
    t &&
    ((e.maxLength = 2e3),
    "true" !== e.dataset.descriptionCounterBound &&
      (e.addEventListener("input", () => {
        updateDescriptionRemainingCounter(e, t);
      }),
      (e.dataset.descriptionCounterBound = "true")),
    updateDescriptionRemainingCounter(e, t));
}
function createInlineLinkTitleFetchGuard() {
  let e = null,
    t = !1;
  return {
    run(r) {
      if (e) return e;
      t = !1;
      const a = Promise.resolve().then(r);
      e = a;
      const clearRequest = () => {
        e === a && (e = null);
      };
      return (a.then(clearRequest, clearRequest), a);
    },
    markTitleInteraction() {
      t = !0;
    },
    shouldApplyFetchedTitle: () => !t,
  };
}
function showInlineLinkInput(e) {
  if (!canModify()) return;
  ((_isInlineInputActive = !0),
    document.querySelectorAll(".inline-link-input").forEach((e) => e.remove()));
  const t = document.querySelector(`.board[data-board-id="${e}"]`);
  if (!t) return void (_isInlineInputActive = !1);
  const r = t.querySelector(".board-links");
  if (!r) return void (_isInlineInputActive = !1);
  currentBoardId = e;
  const a = document.createElement("div");
  ((a.className = "inline-link-input"),
    (a.innerHTML = `\n        <div class="inline-link-input-fields">\n            <div class="url-display"></div>\n            <input type="text" class="url-input" placeholder="https://example.com" autofocus>\n            <div class="loading-indicator">\n                <div class="loading-spinner"></div>\n                <span data-i18n="bookmark.fetchingTitle">${escapeHTML(llT("bookmark.fetchingTitle"))}</span>\n            </div>\n            <textarea class="title-textarea" placeholder="${escapeHTML(llT("bookmark.titlePlaceholder"))}" data-i18n-placeholder="bookmark.titlePlaceholder"></textarea>\n            <div class="note-input-wrap">\n                <textarea class="note-textarea" placeholder="${escapeHTML(llT("bookmark.descriptionPlaceholder"))}" data-i18n-placeholder="bookmark.descriptionPlaceholder"></textarea>\n                <span class="description-char-remaining" aria-live="polite" aria-atomic="true"></span>\n            </div>\n        </div>\n        <div class="inline-link-input-buttons">\n            <button class="inline-link-input-btn" data-i18n="bookmark.addLink">${escapeHTML(llT("bookmark.addLink"))}</button>\n            <button class="inline-link-input-cancel" data-i18n="common.cancel">${escapeHTML(llT("common.cancel"))}</button>\n        </div>\n    `),
    r.appendChild(a));
  const o = a.querySelector(".url-input"),
    n = a.querySelector(".url-display"),
    i = a.querySelector(".title-textarea"),
    s = a.querySelector(".note-textarea"),
    l = a.querySelector(".description-char-remaining"),
    c = a.querySelector(".inline-link-input-btn"),
    d = a.querySelector(".inline-link-input-cancel");
  initializeDescriptionRemainingCounter(s, l);
  let u = "",
    p = !1;
  const m = createInlineLinkTitleFetchGuard();
  async function transitionToTitleState() {
    if (!p)
      return m.run(async () => {
        const e = (function normalizeUrl(e) {
          if (!(e = e.trim())) return null;
          e.match(/^https?:\/\//i) || (e = "https://" + e);
          try {
            return (new URL(e), e);
          } catch {
            return null;
          }
        })(o.value);
        if (!e) return void o.focus();
        ((u = e), a.classList.add("state-loading"), (n.textContent = e));
        const t = await (async function fetchTitle(e) {
          return fetchPageTitleFromBackground(e);
        })(e);
        if (!a.isConnected) return;
        (a.classList.remove("state-loading"),
          a.classList.add("state-title"),
          (p = !0));
        const r =
          t?.success && "string" == typeof t.title ? t.title.trim() : "";
        (m.shouldApplyFetchedTitle() &&
          (i.value = r || getFallbackTitleFromUrl(e)),
          s && ((s.value = ""), updateDescriptionRemainingCounter(s, l)),
          setTimeout(() => {
            a.isConnected &&
              (i.focus(), m.shouldApplyFetchedTitle() && i.select());
          }, 50));
      });
  }
  async function addLink() {
    if (!p) return void (await transitionToTitleState());
    let e = i.value.trim();
    e || (e = getFallbackTitleFromUrl(u));
    const t = s ? s.value : null;
    (await addNewBookmark(e, u, t),
      (currentBoardId = null),
      completeInlineInput());
  }
  function cancel() {
    (a.remove(), (currentBoardId = null), completeInlineInput());
  }
  (setTimeout(() => o.focus(), 50),
    o.addEventListener("keydown", (e) => {
      "Enter" === e.key
        ? (e.preventDefault(), transitionToTitleState())
        : "Escape" === e.key && cancel();
    }),
    o.addEventListener("blur", () => {
      setTimeout(() => {
        o.value.trim() &&
          !p &&
          document.activeElement !== d &&
          transitionToTitleState();
      }, 100);
    }),
    i.addEventListener("keydown", (e) => {
      (m.markTitleInteraction(),
        "Enter" !== e.key || e.shiftKey
          ? "Escape" === e.key && cancel()
          : (e.preventDefault(), addLink()));
    }),
    i.addEventListener("mousedown", () => {
      m.markTitleInteraction();
    }),
    i.addEventListener("input", () => {
      m.markTitleInteraction();
    }),
    s.addEventListener("keydown", (e) => {
      "Escape" !== e.key
        ? "Enter" === e.key &&
          (e.ctrlKey || e.metaKey) &&
          (e.preventDefault(), addLink())
        : cancel();
    }),
    c.addEventListener("click", addLink),
    d.addEventListener("click", cancel),
    a.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    }));
}
function openAddBookmarkModal(e) {
  showInlineLinkInput(e);
}
function closeAddBookmarkModal() {
  (document.getElementById("addBookmarkModal").classList.remove("active"),
    (currentBoardId = null),
    document.getElementById("addBookmarkForm").reset(),
    updateDescriptionRemainingCounter(
      document.getElementById("bookmarkDescription"),
      document.getElementById("bookmarkDescriptionRemaining"),
    ));
}
async function getReviewPromptUserId() {
  return getCurrentStoredUserId();
}
async function sendReviewPromptMessage(e, t = {}) {
  if (globalThis.LumiListModules?.extensionContext?.isInvalidated())
    return null;
  if ("undefined" == typeof chrome || !chrome.runtime?.sendMessage) return null;
  try {
    return await chrome.runtime.sendMessage({ action: e, ...t });
  } catch (t) {
    return (
      globalThis.LumiListModules?.extensionContext?.handleError(t) ||
        console.warn(`[ReviewPrompt] ${e} message failed:`, t),
      null
    );
  }
}
function isKnownReviewPromptSubscriptionStatus(e) {
  return "trial" === e || "active" === e || "grace" === e || "expired" === e;
}
function isKnownSettingsSubscriptionStatus(e) {
  return (
    "trial" === e ||
    "active" === e ||
    "cancelled" === e ||
    "grace" === e ||
    "expired" === e
  );
}
function isReviewPromptSubscriptionEligibleStatus(e) {
  return "trial" === e || "active" === e;
}
async function canShowReviewPromptForSubscription() {
  let e = isKnownReviewPromptSubscriptionStatus(window.subscriptionStatus)
    ? window.subscriptionStatus
    : null;
  if (
    (!e &&
      isKnownReviewPromptSubscriptionStatus(window.cachedSubscriptionStatus) &&
      (e = window.cachedSubscriptionStatus),
    !e && "undefined" != typeof chrome && chrome.storage?.local)
  )
    try {
      const t = await chrome.storage.local.get([
          "subscriptionStatus",
          "subscriptionData",
          "subscriptionLastKnownState",
          "subscriptionOwnerUserId",
        ]),
        r = await getReviewPromptUserId(),
        a =
          t.subscriptionOwnerUserId ||
          t.subscriptionData?.user_id ||
          t.subscriptionLastKnownState?.userId ||
          null,
        o = Boolean(r && a === r);
      o && isKnownReviewPromptSubscriptionStatus(t.subscriptionStatus)
        ? (e = t.subscriptionStatus)
        : o &&
          isKnownReviewPromptSubscriptionStatus(
            t.subscriptionLastKnownState?.status,
          ) &&
          (e = t.subscriptionLastKnownState.status);
    } catch (e) {
      console.warn(
        "[ReviewPrompt] Failed to read subscription status for review gating:",
        e,
      );
    }
  return isReviewPromptSubscriptionEligibleStatus(e);
}
function getReviewPromptReviewUrl() {
  try {
    const e =
      "undefined" != typeof chrome && chrome.runtime?.getManifest
        ? chrome.runtime.getManifest()
        : null;
    if (e?.browser_specific_settings?.gecko?.id)
      return REVIEW_PROMPT_AMO_REVIEW_URL;
  } catch (e) {
    console.warn(
      "[ReviewPrompt] Failed to detect browser-specific review destination:",
      e,
    );
  }
  return REVIEW_PROMPT_CWS_REVIEW_URL;
}
function isReviewPromptModalActive() {
  const e = document.getElementById("reviewPromptModal");
  return !(!e || !e.classList.contains("active"));
}
function isReviewPromptUiBlocked() {
  if (!initialAuthCompleted) return !0;
  if ("visible" !== document.visibilityState) return !0;
  if (!document.hasFocus()) return !0;
  if (document.body?.classList?.contains("not-authenticated")) return !0;
  if (document.body?.classList?.contains("workspace-startup-pending"))
    return !0;
  if (isColdWorkspaceHydrationPending) return !0;
  if (_crossTabLoginInProgress) return !0;
  if (quickTourState?.active) return !0;
  if ("undefined" != typeof _isInlineInputActive && _isInlineInputActive)
    return !0;
  if ("undefined" != typeof _isBoardDragInProgress && _isBoardDragInProgress)
    return !0;
  if (
    "undefined" != typeof _isBookmarkDragInProgress &&
    _isBookmarkDragInProgress
  )
    return !0;
  if ("undefined" != typeof _isTabDragInProgress && _isTabDragInProgress)
    return !0;
  for (const e of ["welcomeScreen", "loadingOverlay"]) {
    const t = document.getElementById(e);
    if (t && !t.classList.contains("hidden") && "none" !== t.style.display)
      return !0;
  }
  if ("function" == typeof isSearchOverlayOpen && isSearchOverlayOpen())
    return !0;
  if (
    document.querySelector(
      ".modal-overlay.active:not(#reviewPromptModal), dialog[open]",
    )
  )
    return !0;
  const e = document.getElementById("importPopup");
  if (e && e.classList.contains("active")) return !0;
  const t = document.getElementById("wallpaperPopup");
  return !(!t || !t.classList.contains("active"));
}
function scheduleReviewPromptDisplay() {
  (null !== reviewPromptDisplayTimer && clearTimeout(reviewPromptDisplayTimer),
    (reviewPromptDisplayTimer = null),
    !window.LumiListWeb &&
      "visible" === document.visibilityState &&
      document.hasFocus() &&
      (reviewPromptDisplayTimer = setTimeout(() => {
        ((reviewPromptDisplayTimer = null),
          maybeShowReviewPrompt("workspace_visit").catch((e) => {
            console.warn(
              "[ReviewPrompt] Workspace invitation check failed:",
              e,
            );
          }));
      }, 2e3)));
}
function initReviewPromptVisitChecks() {
  if (reviewPromptVisitChecksInitialized || window.LumiListWeb) return;
  ((reviewPromptVisitChecksInitialized = !0),
    window.addEventListener("focus", scheduleReviewPromptDisplay),
    document.addEventListener("visibilitychange", scheduleReviewPromptDisplay));
  const e = new MutationObserver(scheduleReviewPromptDisplay);
  for (const t of [
    document.body,
    ...document.querySelectorAll(
      ".modal-overlay, dialog, #welcomeScreen, #loadingOverlay, #searchOverlay, #importPopup, #wallpaperPopup",
    ),
  ])
    e.observe(t, {
      attributes: !0,
      attributeFilter: ["class", "style", "open"],
    });
  (chrome.storage.onChanged.addListener((e, t) => {
    "local" === t &&
      [
        "lumilist_user",
        "subscriptionStatus",
        "subscriptionData",
        "subscriptionOwnerUserId",
        "subscriptionLastKnownState",
      ].some((t) => Object.prototype.hasOwnProperty.call(e, t)) &&
      scheduleReviewPromptDisplay();
  }),
    scheduleReviewPromptDisplay());
}
function setReviewPromptRating(e = 0, t = {}) {
  const r = Number(e),
    a = Number.isFinite(r) ? Math.min(5, Math.max(0, Math.floor(r))) : 0,
    o = Array.from(
      document.querySelectorAll("#reviewPromptRating .review-prompt-star"),
    ),
    n = !0 === t.focus;
  ((activeReviewPromptRating = a),
    document
      .getElementById("reviewPromptRating")
      ?.classList.remove("is-previewing"),
    o.forEach((e, t) => {
      const r = Number(e.dataset.rating),
        o = r === a;
      (e.classList.toggle("is-preview", !1),
        e.classList.toggle("is-selected", a > 0 && r <= a),
        e.setAttribute("aria-checked", String(o)),
        (e.tabIndex = a > 0 ? (o ? 0 : -1) : 0 === t ? 0 : -1));
    }));
  const i = document.getElementById("reviewPromptSubmitRatingBtn");
  if (i) {
    const e =
      "function" == typeof llT
        ? llT
        : (e) =>
            ({
              "review.leaveStoreReview": "Leave a store review",
              "review.submitRating": "Submit rating",
            })[e] || e;
    ((i.disabled = 0 === a || reviewPromptSubmissionInFlight),
      (i.textContent = e(
        a > 0 ? "review.leaveStoreReview" : "review.submitRating",
      )));
  }
  return (
    n && a > 0 && o.find((e) => Number(e.dataset.rating) === a)?.focus(),
    a
  );
}
function previewReviewPromptRating(e = 0) {
  const t = Number(e),
    r = Number.isFinite(t) ? Math.min(5, Math.max(0, Math.floor(t))) : 0,
    a = document.getElementById("reviewPromptRating"),
    o = Array.from(
      document.querySelectorAll("#reviewPromptRating .review-prompt-star"),
    );
  (a?.classList.toggle("is-previewing", r > 0),
    o.forEach((e) => {
      e.classList.toggle("is-preview", r > 0 && Number(e.dataset.rating) <= r);
    }));
}
function handleReviewPromptRatingKeydown(e) {
  const t = Number(e.currentTarget?.dataset?.rating);
  if (!Number.isFinite(t)) return;
  let r = null;
  ("ArrowRight" === e.key || "ArrowDown" === e.key
    ? (r = Math.min(5, t + 1))
    : "ArrowLeft" === e.key || "ArrowUp" === e.key
      ? (r = Math.max(1, t - 1))
      : "Home" === e.key
        ? (r = 1)
        : "End" === e.key && (r = 5),
    null !== r &&
      (e.preventDefault(), setReviewPromptRating(r, { focus: !0 })));
}
function openReviewPromptModal(e = null) {
  const t = document.getElementById("reviewPromptModal"),
    r = normalizeRuntimeUserId(e);
  return t
    ? t.classList.contains("active")
      ? ((activeReviewPromptUserId = r), !0)
      : ((activeReviewPromptUserId = r),
        (reviewPromptSubmissionInFlight = !1),
        setReviewPromptRating(0),
        t.classList.add("active"),
        document
          .querySelector("#reviewPromptRating .review-prompt-star")
          ?.focus(),
        t.classList.contains("active"))
    : ((activeReviewPromptUserId = r), !1);
}
async function closeReviewPromptModal(e = {}) {
  const { userAction: t = null, recordDismiss: r = !1 } = e,
    a = document.getElementById("reviewPromptModal");
  if (!a)
    return (
      (activeReviewPromptUserId = null),
      (reviewPromptSubmissionInFlight = !1),
      void setReviewPromptRating(0)
    );
  const o = a.classList.contains("active");
  a.classList.remove("active");
  const n = normalizeRuntimeUserId(activeReviewPromptUserId);
  if (
    ((activeReviewPromptUserId = null),
    (reviewPromptSubmissionInFlight = !1),
    setReviewPromptRating(0),
    !o)
  )
    return;
  const i = t || (r ? "dismiss" : null);
  if (!i) return;
  const s = n || (await getReviewPromptUserId());
  s &&
    (await sendReviewPromptMessage("reviewPromptHandleAction", {
      userId: s,
      userAction: i,
    }));
}
async function maybeShowReviewPrompt(e = "workspace_visit") {
  if (window.LumiListWeb) return;
  if (reviewPromptCheckInFlight) return;
  if (isReviewPromptModalActive()) return;
  if (isReviewPromptUiBlocked()) return;
  if (!(await canShowReviewPromptForSubscription())) return;
  const t = await getReviewPromptUserId();
  if (!t) return;
  reviewPromptCheckInFlight = !0;
  let r = "",
    a = !1;
  try {
    const o = await sendReviewPromptMessage("reviewPromptRequestDisplay", {
      userId: t,
      trigger: e,
    });
    if (!o?.success || !o.showPrompt) return;
    if (
      ((r = "string" == typeof o.reservationToken ? o.reservationToken : ""),
      isReviewPromptUiBlocked())
    )
      return;
    const n = await getReviewPromptUserId();
    if (!n || n !== t) return;
    if (!openReviewPromptModal(t)) return;
    if (r) {
      const e = await sendReviewPromptMessage("reviewPromptConfirmDisplay", {
        userId: t,
        reservationToken: r,
      });
      if (!e?.success || !e.confirmed)
        return void (await closeReviewPromptModal());
      a = !0;
    }
  } finally {
    (r &&
      !a &&
      (await sendReviewPromptMessage("reviewPromptCancelDisplay", {
        userId: t,
        reservationToken: r,
      })),
      (reviewPromptCheckInFlight = !1));
  }
}
async function openReviewPromptReviewPage() {
  const e = getReviewPromptReviewUrl();
  try {
    return "undefined" != typeof chrome && chrome.tabs?.create
      ? (await chrome.tabs.create({ url: e }), !0)
      : !!window.open(e, "_blank", "noopener");
  } catch (e) {
    return (console.warn("[ReviewPrompt] Failed to open review page:", e), !1);
  }
}
function setReviewPromptSubmissionInFlight(e) {
  reviewPromptSubmissionInFlight = !0 === e;
  const t = document.getElementById("reviewPromptSubmitRatingBtn");
  t &&
    ((t.disabled =
      reviewPromptSubmissionInFlight || activeReviewPromptRating < 1),
    reviewPromptSubmissionInFlight
      ? t.setAttribute("aria-busy", "true")
      : t.removeAttribute("aria-busy"));
}
async function handleReviewPromptPublicReview() {
  if (!reviewPromptSubmissionInFlight) {
    setReviewPromptSubmissionInFlight(!0);
    try {
      if (!(await openReviewPromptReviewPage()))
        return void (
          "function" == typeof showGlassToast &&
          showGlassToast(
            ("function" == typeof llLiteral ? llLiteral : (e) => e)(
              "Could not open the review page. Please try again.",
            ),
            "error",
          )
        );
      await closeReviewPromptModal({ userAction: "review_clicked" });
    } finally {
      (setReviewPromptSubmissionInFlight(!1),
        setReviewPromptRating(activeReviewPromptRating));
    }
  }
}
async function handleReviewPromptSubmitRating() {
  activeReviewPromptRating < 1
    ? document.querySelector("#reviewPromptRating .review-prompt-star")?.focus()
    : await handleReviewPromptPublicReview();
}
async function handleReviewPromptNotNow() {
  await closeReviewPromptModal({ userAction: "not_now" });
}
async function addNewBookmark(e, t, r) {
  if (canModify())
    if (isAddingBookmark) console.warn("Bookmark add already in progress");
    else {
      isAddingBookmark = !0;
      try {
        const a = sanitizeUrl(t);
        if (!a)
          return void showGlassToast(
            llLiteral("Invalid or unsafe URL. Please enter a valid URL."),
            "warning",
          );
        const o = currentBoardId;
        if (!o) return void console.error("No board selected for bookmark");
        const n = await db.bookmarks
            .where("boardId")
            .equals(o)
            .filter((e) => !e.deletedAt)
            .toArray(),
          i = n.length > 0 ? Math.max(...n.map((e) => e.order)) + 1 : 0,
          s = {
            boardId: o,
            title:
              ("string" == typeof e ? e.trim() : "") ||
              getFallbackTitleFromUrl(a) ||
              "Untitled",
            url: a,
            description: sanitizeBookmarkNote(r),
            order: i,
          },
          l = await addBookmark(s);
        if (!l) return;
        (await updateBoardBookmarks(o),
          emitQuickTourEvent("bookmark_created", {
            bookmarkId: l,
            boardId: o,
          }));
        try {
          scheduleReviewPromptDisplay();
        } catch (e) {
          console.warn(
            "[ReviewPrompt] Failed to process manual bookmark event:",
            e,
          );
        }
      } catch (e) {
        (console.error("Failed to add bookmark:", e),
          showGlassToast("Failed to add bookmark. Please try again.", "error"));
      } finally {
        isAddingBookmark = !1;
      }
    }
  else
    showGlassToast(
      llLiteral("Cannot add bookmarks in read-only mode."),
      "warning",
    );
}
async function updateBoardBookmarks(e) {
  closeBookmarkMenu();
  try {
    const t = document.querySelector(`[data-board-id="${e}"]`);
    if (!t) return;
    const r = await db.bookmarks
        .where("boardId")
        .equals(e)
        .filter((e) => !e.deletedAt)
        .sortBy("order"),
      a = getVisibleBookmarksForBoard(e, r),
      o = getBoardBookmarkToggleControl(e, r.length),
      n = t.querySelector(".board-links");
    if (!n) return;
    n.innerHTML = "";
    for (const e of a) {
      const t = document.createElement("li");
      ((t.draggable = !0), t.setAttribute("data-bookmark-id", e.id));
      const r = document.createElement("a");
      r.href = e.url;
      const a = document.createElement("div");
      a.className = "bookmark-content";
      const o = await createFaviconElement(e.url, e.title);
      a.appendChild(o);
      const i = document.createElement("span");
      i.className = "bookmark-text";
      const s = document.createElement("span");
      ((s.className = "bookmark-title"),
        (s.textContent = e.title),
        (s.title = s.textContent),
        i.appendChild(s));
      const l = getBookmarkNoteText(e.description);
      if (l) {
        const e = document.createElement("span");
        ((e.className = "bookmark-note"),
          (e.textContent = l),
          i.appendChild(e));
      }
      a.appendChild(i);
      const c = document.createElement("div");
      ((c.className = "bookmark-actions"),
        c.appendChild(createBookmarkMenuButton(e.id)));
      const d = document.createElement("button");
      ((d.className = "bookmark-edit-btn"),
        (d.innerHTML = BOOKMARK_EDIT_ICON),
        (d.title = llLiteral("Edit bookmark")),
        d.addEventListener("click", async function (t) {
          (t.preventDefault(),
            t.stopPropagation(),
            await openEditBookmarkModal(e.id));
        }));
      const u = document.createElement("button");
      ((u.className = "bookmark-delete-btn"),
        (u.innerHTML = BOOKMARK_DELETE_ICON),
        (u.title = llLiteral("Delete bookmark")),
        u.addEventListener("click", async function (t) {
          (t.preventDefault(),
            t.stopPropagation(),
            await showDeleteConfirmation(e.title, "bookmark", e.id));
        }),
        c.appendChild(d),
        c.appendChild(u),
        r.appendChild(a),
        r.appendChild(c),
        t.appendChild(r),
        n.appendChild(t));
    }
    const i = t.querySelector(".board-show-remaining-btn");
    if (o) {
      const r = i || document.createElement("button");
      ((r.className = "board-show-remaining-btn"),
        (r.textContent = o.label),
        r.setAttribute("data-action", o.action),
        r.setAttribute("data-board-id", e),
        i || t.appendChild(r));
    } else i && i.remove();
    (attachDragDropListeners(),
      applyOpenInNewTabSetting(openLinksInNewTab),
      await refreshSearchIfOpen());
  } catch (e) {
    console.error("Failed to update board bookmarks:", e);
  }
}
function isValidUrl(e) {
  try {
    return (new URL(e), !0);
  } catch (e) {
    return !1;
  }
}
const TITLE_PSL_EXACT_RULES = new Set([
    "ac.uk",
    "co.uk",
    "gov.uk",
    "ltd.uk",
    "me.uk",
    "net.uk",
    "org.uk",
    "plc.uk",
    "sch.uk",
    "asn.au",
    "com.au",
    "edu.au",
    "gov.au",
    "id.au",
    "net.au",
    "org.au",
    "ac.nz",
    "co.nz",
    "geek.nz",
    "gen.nz",
    "govt.nz",
    "iwi.nz",
    "kiwi.nz",
    "maori.nz",
    "net.nz",
    "org.nz",
    "ac.in",
    "co.in",
    "edu.in",
    "firm.in",
    "gen.in",
    "gov.in",
    "ind.in",
    "mil.in",
    "net.in",
    "nic.in",
    "org.in",
    "res.in",
    "ac.jp",
    "ad.jp",
    "co.jp",
    "ed.jp",
    "go.jp",
    "gr.jp",
    "lg.jp",
    "ne.jp",
    "or.jp",
    "com.br",
    "edu.br",
    "gov.br",
    "net.br",
    "org.br",
    "ac.za",
    "co.za",
    "edu.za",
    "gov.za",
    "net.za",
    "org.za",
    "com.mx",
    "edu.mx",
    "gob.mx",
    "net.mx",
    "org.mx",
    "ac.kr",
    "co.kr",
    "go.kr",
    "mil.kr",
    "ne.kr",
    "or.kr",
    "pe.kr",
    "re.kr",
    "com.sg",
    "edu.sg",
    "gov.sg",
    "net.sg",
    "org.sg",
    "per.sg",
    "com.my",
    "edu.my",
    "gov.my",
    "net.my",
    "org.my",
    "com.hk",
    "edu.hk",
    "gov.hk",
    "idv.hk",
    "net.hk",
    "org.hk",
    "bel.tr",
    "com.tr",
    "edu.tr",
    "gov.tr",
    "net.tr",
    "org.tr",
    "ac.cn",
    "com.cn",
    "edu.cn",
    "gov.cn",
    "mil.cn",
    "net.cn",
    "org.cn",
  ]),
  TITLE_PSL_WILDCARD_RULES = new Set(["ck"]),
  TITLE_PSL_EXCEPTION_RULES = new Set(["www.ck"]),
  TITLE_PSL_COMMON_CCTLD_SLD = new Set([
    "ac",
    "asn",
    "bel",
    "co",
    "com",
    "edu",
    "firm",
    "gen",
    "go",
    "gob",
    "gov",
    "id",
    "idv",
    "ind",
    "ltd",
    "mil",
    "name",
    "net",
    "ne",
    "nic",
    "nom",
    "or",
    "org",
    "plc",
    "res",
    "sch",
  ]),
  TITLE_GENERIC_PATH_TOKENS = new Set([
    "about",
    "account",
    "accounts",
    "admin",
    "api",
    "app",
    "apps",
    "auth",
    "callback",
    "content",
    "d",
    "dashboard",
    "default",
    "edit",
    "en",
    "feed",
    "home",
    "i",
    "id",
    "index",
    "item",
    "items",
    "login",
    "logout",
    "m",
    "mobile",
    "new",
    "page",
    "pages",
    "p",
    "post",
    "posts",
    "profile",
    "root",
    "settings",
    "share",
    "u",
    "user",
    "users",
    "v",
    "view",
    "www",
  ]),
  TITLE_ACRONYM_TOKENS = new Set([
    "ai",
    "api",
    "cdn",
    "crm",
    "cpu",
    "css",
    "dns",
    "faq",
    "gpu",
    "html",
    "http",
    "https",
    "id",
    "ip",
    "json",
    "oauth",
    "pdf",
    "seo",
    "sdk",
    "sms",
    "sql",
    "ssh",
    "ssl",
    "sso",
    "tcp",
    "tls",
    "ui",
    "uid",
    "url",
    "ux",
    "xml",
    "yaml",
  ]),
  TITLE_MINOR_WORDS = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "by",
    "for",
    "from",
    "in",
    "of",
    "on",
    "or",
    "the",
    "to",
    "vs",
    "via",
  ]),
  TITLE_QUERY_PRIORITY_KEYS = [
    "q",
    "query",
    "search",
    "term",
    "keyword",
    "keywords",
    "topic",
    "section",
    "tab",
    "view",
    "screen",
    "page",
    "name",
    "title",
    "resource",
    "resource_id",
    "doc",
    "docid",
    "project",
    "repo",
    "board",
    "folder",
    "category",
  ],
  TITLE_GENERIC_QUERY_TOKENS = new Set([
    "all",
    "any",
    "default",
    "false",
    "id",
    "item",
    "items",
    "link",
    "list",
    "none",
    "null",
    "page",
    "q",
    "search",
    "tab",
    "true",
    "undefined",
    "url",
    "view",
  ]);
function getPublicSuffixLengthFromPsl(e) {
  if (!Array.isArray(e) || 0 === e.length) return 0;
  let t = 0;
  for (let r = 0; r < e.length; r++) {
    const a = e.slice(r).join(".");
    TITLE_PSL_EXCEPTION_RULES.has(a) && (t = Math.max(t, e.length - r));
  }
  if (t > 0) return Math.max(1, t - 1);
  let r = 1;
  for (let t = 0; t < e.length; t++) {
    const a = e.slice(t).join(".");
    TITLE_PSL_EXACT_RULES.has(a) && (r = Math.max(r, e.length - t));
  }
  for (let t = 0; t < e.length - 1; t++) {
    const a = e.slice(t + 1).join(".");
    TITLE_PSL_WILDCARD_RULES.has(a) && (r = Math.max(r, e.length - t));
  }
  if (e.length >= 2) {
    const t = e[e.length - 1],
      a = e[e.length - 2];
    2 === t.length && TITLE_PSL_COMMON_CCTLD_SLD.has(a) && (r = Math.max(r, 2));
  }
  return Math.min(r, e.length);
}
function parseRegistrableDomain(e) {
  const t = (e || "").toLowerCase().split(".").filter(Boolean);
  if (0 === t.length) return null;
  const r = getPublicSuffixLengthFromPsl(t),
    a = t.length - r - 1;
  return a < 0
    ? {
        registrableLabel: t[0],
        registrableDomain: t.join("."),
        subdomainLabels: [],
      }
    : {
        registrableLabel: t[a],
        registrableDomain: t.slice(a).join("."),
        subdomainLabels: t.slice(0, a),
      };
}
function formatFallbackTitleWord(e, t) {
  const r = (e || "").trim();
  if (!r) return "";
  const a = r.toLowerCase();
  return TITLE_ACRONYM_TOKENS.has(a)
    ? a.toUpperCase()
    : /^\d+[a-z]{2,4}$/i.test(r)
      ? r.replace(/^(\d+)([a-z]{2,4})$/i, (e, t, r) => `${t}${r.toUpperCase()}`)
      : t > 0 && TITLE_MINOR_WORDS.has(a)
        ? a
        : a.charAt(0).toUpperCase() + a.slice(1);
}
function formatFallbackTitleToken(e) {
  const t = (e || "").trim();
  if (!t) return "Untitled";
  const r = t
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!r) return "Untitled";
  const a = r.split(" ").filter(Boolean);
  return 0 === a.length
    ? "Untitled"
    : a.map((e, t) => formatFallbackTitleWord(e, t)).join(" ");
}
function isGenericSubdomainToken(e) {
  const t = (e || "").toLowerCase();
  return (
    !t ||
    new Set([
      "m",
      "mobile",
      "www",
      "ww1",
      "ww2",
      "w1",
      "w2",
      "app",
      "apps",
      "api",
      "cdn",
      "static",
      "assets",
      "img",
      "images",
      "media",
      "edge",
      "amp",
    ]).has(t)
  );
}
function sanitizePathToken(e) {
  if (!e) return "";
  let t = e;
  try {
    t = decodeURIComponent(e);
  } catch (e) {}
  return t
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]{1,6}$/i, "");
}
function isOpaquePathToken(e) {
  return !(
    e &&
    !/^\d+$/.test(e) &&
    !/^[a-f0-9]{12,}$/i.test(e) &&
    (!/^[a-z0-9]{20,}$/i.test(e) || e.includes("-") || e.includes("_"))
  );
}
function isMeaningfulContextToken(e, t = {}) {
  const r = sanitizePathToken(e),
    a = t?.source || "general";
  return !(
    !r ||
    r.length <= 1 ||
    TITLE_GENERIC_PATH_TOKENS.has(r) ||
    ("query" === a && TITLE_GENERIC_QUERY_TOKENS.has(r)) ||
    isGenericSubdomainToken(r) ||
    isOpaquePathToken(r)
  );
}
function getPathFallbackToken(e) {
  if (!e || "string" != typeof e) return "";
  const t = e.split("/").map(sanitizePathToken).filter(Boolean);
  for (const e of t)
    if (!TITLE_GENERIC_PATH_TOKENS.has(e) && !isOpaquePathToken(e)) return e;
  return "";
}
function tokenizeQueryValue(e) {
  if (!e || "string" != typeof e) return [];
  let t = e;
  try {
    t = decodeURIComponent(e);
  } catch (e) {}
  const r = t
    .replace(/\+/g, " ")
    .replace(/[()[\]{}]/g, " ")
    .trim();
  if (!r) return [];
  const a = [];
  try {
    const e = new URL(r),
      t = (e.hostname || "").replace(/^www\./i, "").toLowerCase();
    if (t) {
      const r = parseRegistrableDomain(t),
        o = sanitizePathToken(r?.registrableLabel || t.split(".")[0] || "");
      o && a.push(o);
      const n = getPathFallbackToken(e.pathname || "");
      n && a.push(n);
    }
  } catch (e) {}
  const o = r.split(/[\/\\?&#=,:;|]+|\s+/);
  for (const e of o) {
    const t = sanitizePathToken(e);
    if (!t) continue;
    const r = t.split(".").map(sanitizePathToken).filter(Boolean);
    r.length > 1 ? a.push(...r) : a.push(t);
  }
  return [...new Set(a)];
}
function getQueryFallbackToken(e) {
  if (!e || "function" != typeof e.entries) return "";
  const t = Array.from(e.entries());
  if (0 === t.length) return "";
  const getPriority = (e) => {
    const t = (e || "").toLowerCase(),
      r = TITLE_QUERY_PRIORITY_KEYS.indexOf(t);
    return -1 === r ? Number.MAX_SAFE_INTEGER : r;
  };
  t.sort((e, t) => {
    const r = getPriority(e[0]),
      a = getPriority(t[0]);
    return r !== a ? r - a : (e[0] || "").localeCompare(t[0] || "");
  });
  for (const [e, r] of t) {
    const t = tokenizeQueryValue(r);
    for (const e of t)
      if (
        !TITLE_GENERIC_QUERY_TOKENS.has(e) &&
        isMeaningfulContextToken(e, { source: "query" })
      )
        return e;
    const a = sanitizePathToken(e);
    if (
      a &&
      !TITLE_GENERIC_QUERY_TOKENS.has(a) &&
      isMeaningfulContextToken(a, { source: "query" })
    )
      return a;
  }
  return "";
}
function getFallbackTitleFromUrl(e) {
  if (!e || "string" != typeof e) return "Untitled";
  try {
    const t = new URL(e),
      r = (t.hostname || "").replace(/^www\./i, "").toLowerCase();
    if (!r) return "Untitled";
    const a = r.split(".").filter(Boolean),
      o = /^\d{1,3}(\.\d{1,3}){3}$/.test(r),
      n = r.includes(":");
    if (o) return r;
    if (n) return r.replace(/^\[|\]$/g, "");
    if (1 === a.length) return formatFallbackTitleToken(a[0] || r);
    const i = parseRegistrableDomain(r),
      s = formatFallbackTitleToken(i?.registrableLabel || a[0]),
      l = i?.subdomainLabels || [];
    let c = "";
    if (l.length > 0)
      for (let e = l.length - 1; e >= 0; e--) {
        const t = l[e];
        if (isMeaningfulContextToken(t)) {
          c = t;
          break;
        }
      }
    let d = c;
    if (!d) {
      const e = getPathFallbackToken(t.pathname || "");
      isMeaningfulContextToken(e) && (d = e);
    }
    if (!d) {
      const e = getQueryFallbackToken(t.searchParams);
      isMeaningfulContextToken(e) && (d = e);
    }
    if (!d) return s;
    const u = formatFallbackTitleToken(d);
    return u && u.toLowerCase() !== s.toLowerCase() ? `${s} ${u}` : s;
  } catch (t) {
    const r = e
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0];
    if (!r) return "Untitled";
    let a = r;
    a = a.startsWith("[") ? a.replace(/^\[|\]$/g, "") : a.split(":")[0];
    const o = /^\d{1,3}(\.\d{1,3}){3}$/.test(a),
      n = a.includes(":");
    if (o || n) return a;
    const i = parseRegistrableDomain(a);
    return formatFallbackTitleToken(
      i?.registrableLabel || a.split(".")[0] || a,
    );
  }
}
async function fetchPageTitleFromBackground(e) {
  return new Promise((t) => {
    let r = !1;
    const a = setTimeout(() => {
      r ||
        ((r = !0),
        console.warn("[FetchTitle] Timeout waiting for background response"),
        t({ success: !1, title: "", error: "Request timed out" }));
    }, 1e4);
    "undefined" != typeof chrome && chrome.runtime && chrome.runtime.sendMessage
      ? chrome.runtime.sendMessage(
          { action: "fetchPageTitle", url: e },
          (e) => {
            if (!r) {
              if (((r = !0), clearTimeout(a), chrome.runtime.lastError))
                return (
                  console.error(
                    "Error fetching title:",
                    chrome.runtime.lastError,
                  ),
                  void t({
                    success: !1,
                    title: "",
                    error: chrome.runtime.lastError.message,
                  })
                );
              t(
                e || {
                  success: !1,
                  title: "",
                  error: "No response from background",
                },
              );
            }
          },
        )
      : ((r = !0),
        clearTimeout(a),
        t({ success: !1, title: "", error: "Extension runtime unavailable" }));
  });
}
let currentBookmarkToEdit = null;
async function openEditBookmarkModal(e) {
  if (canModify())
    try {
      const t = await db.bookmarks.get(e);
      if (!t) return void showGlassToast("Bookmark not found", "error");
      if (t.deletedAt)
        return void showGlassToast(
          "Cannot edit items in trash. Restore first.",
          "error",
        );
      ((currentBookmarkToEdit = e),
        (document.getElementById("editBookmarkUrl").value = t.url),
        (document.getElementById("editBookmarkTitle").value = t.title));
      const r = document.getElementById("editBookmarkDescription");
      ((r.value = t.description || ""),
        updateDescriptionRemainingCounter(
          r,
          document.getElementById("editBookmarkDescriptionRemaining"),
        ),
        (document.getElementById("fetchTitleError").textContent = ""),
        document.getElementById("editBookmarkModal").classList.add("active"),
        document.getElementById("editBookmarkTitle").focus());
    } catch (e) {
      (console.error("Failed to open edit bookmark modal:", e),
        showGlassToast("Failed to open edit form. Please try again.", "error"));
    }
}
function closeEditBookmarkModal() {
  (document.getElementById("editBookmarkModal").classList.remove("active"),
    (currentBookmarkToEdit = null),
    document.getElementById("editBookmarkForm").reset(),
    updateDescriptionRemainingCounter(
      document.getElementById("editBookmarkDescription"),
      document.getElementById("editBookmarkDescriptionRemaining"),
    ));
}
async function saveBookmarkEdit(e, t, r, a) {
  if (canModify())
    try {
      const o = sanitizeUrl(r);
      if (!o) return void showGlassToast("Invalid or unsafe URL.", "warning");
      const n = await db.bookmarks.get(e);
      if (!n) throw new Error("Bookmark not found");
      const i =
        ("string" == typeof t ? t.trim() : "") || getFallbackTitleFromUrl(o);
      (await updateBookmark(e, {
        title: i || "Untitled",
        url: o,
        description: sanitizeBookmarkNote(a),
      }),
        await updateBoardBookmarks(n.boardId));
    } catch (e) {
      (console.error("Failed to update bookmark:", e),
        showGlassToast(
          "Failed to update bookmark. Please try again.",
          "error",
        ));
    }
  else showGlassToast("Cannot edit bookmarks in read-only mode.", "warning");
}
let _activeBoardMenuScrollListener = null;
function toggleBoardMenu(e) {
  const t = document.getElementById(`board-menu-${e}`),
    r = document.querySelector(`.board-menu-btn[data-board-id="${e}"]`);
  if (!t || !r) {
    if (
      (console.warn(
        `toggleBoardMenu: Missing element - menu: ${!!t}, button: ${!!r}, boardId: ${e}`,
      ),
      !t && r)
    ) {
      const t = r.closest(".board");
      if (t) {
        const r = t.classList.contains("shared-board");
        if (
          (ensureBoardMenuExists(e, r),
          document.getElementById(`board-menu-${e}`))
        )
          return void toggleBoardMenu(e);
      }
    }
    return;
  }
  (closeTabContextMenu(), closeBoardMenus(e));
  const a = !t.classList.contains("active");
  if ((t.classList.toggle("active"), a)) {
    const e = r.getBoundingClientRect(),
      a = 150;
    let o = e.right - a,
      n = e.bottom + 4;
    (o < 10 && (o = 10),
      o + a > window.innerWidth - 10 && (o = window.innerWidth - a - 10));
    const i = t.offsetHeight || 150;
    (n + i > window.innerHeight - 10 && (n = e.top - i - 4),
      (t.style.left = `${o}px`),
      (t.style.top = `${n}px`),
      (_activeBoardMenuScrollListener = () => {
        closeBoardMenus();
      }),
      window.addEventListener("scroll", _activeBoardMenuScrollListener, !0));
  }
}
function closeBoardMenus(e = null) {
  (closeBookmarkMenu(),
    document.querySelectorAll(".board-menu").forEach((t) => {
      (e && t.id === `board-menu-${e}`) || t.classList.remove("active");
    }),
    _activeBoardMenuScrollListener &&
      (window.removeEventListener("scroll", _activeBoardMenuScrollListener, !0),
      (_activeBoardMenuScrollListener = null)));
}
async function openAllBoardLinks(e) {
  try {
    const t = await db.bookmarks
      .where("boardId")
      .equals(e)
      .filter((e) => !e.deletedAt)
      .toArray();
    if (0 === t.length)
      return void showGlassToast("No links in this board", "info");
    const r = t.filter((e) => e.url).map((e) => e.url);
    openMultipleUrls(r);
  } catch (e) {
    console.error("Failed to open board links:", e);
  }
}
let boardLinkCopyInProgress = !1;
async function copyAllBoardLinks(e) {
  if (boardLinkCopyInProgress) return;
  const t = normalizeRuntimeUserId(window.__lumilistWorkspaceOwnerUserId),
    isCurrent = () =>
      t &&
      t === getActiveStoredUserId() &&
      t === normalizeRuntimeUserId(window.__lumilistWorkspaceOwnerUserId) &&
      !getWorkspaceMutationBlockedReason();
  if (isCurrent()) {
    boardLinkCopyInProgress = !0;
    try {
      const r = await db.transaction(
          "r",
          db.pages,
          db.boards,
          db.bookmarks,
          async () => {
            const t = await db.boards.get(e),
              r = t && !t.deletedAt ? await db.pages.get(t.pageId) : null;
            return !r || r.deletedAt
              ? null
              : db.bookmarks
                  .where("boardId")
                  .equals(e)
                  .filter((e) => !e.deletedAt)
                  .toArray();
          },
        ),
        a = await chrome.storage.local.get("lumilist_user");
      if (!isCurrent() || normalizeRuntimeUserId(a.lumilist_user?.id) !== t)
        return;
      if (!r) throw new Error("Board is no longer available");
      const o = r
        .sort((e, t) => (e.order || 0) - (t.order || 0))
        .filter((e) => "string" == typeof e.url && e.url.trim())
        .map((e) => e.url);
      if (!o.length)
        return void showGlassToast(llT("search.emptyBoard"), "info");
      const n = o.join("\n");
      try {
        await navigator.clipboard.writeText(n);
      } catch {
        if (!isCurrent()) return;
        const e = document.activeElement,
          t = document.createElement("textarea");
        ((t.value = n),
          (t.readOnly = !0),
          (t.tabIndex = -1),
          (t.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;"),
          document.body.appendChild(t));
        try {
          if ((t.select(), !document.execCommand("copy")))
            throw new Error("Clipboard copy was rejected");
        } finally {
          (t.remove(), e?.isConnected && e.focus({ preventScroll: !0 }));
        }
      }
      isCurrent() && showGlassToast(llT("board.copyLinksSuccess"), "success");
    } catch (e) {
      (console.error("Failed to copy board links:", e),
        isCurrent() && showGlassToast(llT("board.copyLinksFailed"), "error"));
    } finally {
      boardLinkCopyInProgress = !1;
    }
  } else showGlassToast(llT("board.copyLinksFailed"), "error");
}
function showFetchTitlesProgressModal(e) {
  const t = document.getElementById("fetchTitlesModal"),
    r = document.getElementById("fetchTitlesProgressBar"),
    a = document.getElementById("fetchTitlesStatusText");
  return (
    !!(t && r && a) &&
    ((r.style.width = "0%"),
    (a.textContent = llT("import.progressLinksProcessed", {
      current: 0,
      total: e,
    })),
    t.classList.add("active"),
    !0)
  );
}
function updateFetchTitlesProgressModal(e, t) {
  const r = document.getElementById("fetchTitlesProgressBar"),
    a = document.getElementById("fetchTitlesStatusText");
  if (!r || !a || t <= 0) return;
  const o = Math.max(0, Math.min(e, t)),
    n = Math.round((o / t) * 100);
  ((r.style.width = `${n}%`),
    (a.textContent = llT("import.progressLinksProcessed", {
      current: o,
      total: t,
    })));
}
function hideFetchTitlesProgressModal() {
  const e = document.getElementById("fetchTitlesModal");
  e && e.classList.remove("active");
}
function setImportLinksProgressCancelable(e) {
  const t = document.getElementById("cancelImportLinksProgressBtn");
  t && ((t.style.display = e ? "inline-flex" : "none"), (t.disabled = !e));
}
function getImportLinksProgressTitle(e = !1) {
  return llT(e ? "import.progressPapalyTitle" : "import.progressLinksTitle");
}
function getImportLinksImportedStatus(e, t) {
  return llT("import.progressLinksImported", { current: e, total: t });
}
function getImportLinksProcessedStatus(e, t) {
  return llT("import.progressLinksProcessed", { current: e, total: t });
}
function getImportCountLabel(e, t, r) {
  return llT(1 === Number(e) ? t : r);
}
function getUnsafeImportSuffix(e) {
  return !Number.isFinite(e) || e <= 0
    ? ""
    : llT("import.unsafeBlocked", {
        count: llNumber(e),
        urlLabel: getImportCountLabel(
          e,
          "import.urlSingular",
          "import.urlPlural",
        ),
      });
}
function getImportSuccessMessage({
  links: e = 0,
  boards: t = 0,
  pages: r = null,
  unsafe: a = 0,
  trailingWarning: o = "",
} = {}) {
  const n = {
      links: llNumber(e),
      boards: llNumber(t),
      pages: llNumber(r),
      linkLabel: getImportCountLabel(
        e,
        "import.linkSingular",
        "import.linkPlural",
      ),
      boardLabel: getImportCountLabel(
        t,
        "import.boardSingular",
        "import.boardPlural",
      ),
      pageLabel: getImportCountLabel(
        r,
        "import.pageSingular",
        "import.pagePlural",
      ),
    },
    i = [
      Number.isFinite(r) && null !== r
        ? llT("import.successMultiPage", n)
        : llT("import.successSinglePage", n),
    ],
    s = getUnsafeImportSuffix(a);
  return (s && i.push(s), o && i.push(o), i.join(". "));
}
function showImportLinksProgressModal(
  e = llT("import.progressLinksTitle"),
  t = llT("import.progressStarting"),
) {
  const r = document.getElementById("importLinksProgressModal"),
    a = document.getElementById("importLinksProgressTitle"),
    o = document.getElementById("importLinksProgressStatusText"),
    n = document.getElementById("importLinksProgressBar");
  return (
    !!(r && a && o && n) &&
    ((a.textContent = e),
    (o.textContent = t),
    (n.style.width = "0%"),
    setImportLinksProgressCancelable(!1),
    r.classList.add("active"),
    !0)
  );
}
function updateImportLinksProgressModal(e, t, r = 0, a = 0) {
  const o = document.getElementById("importLinksProgressTitle"),
    n = document.getElementById("importLinksProgressStatusText"),
    i = document.getElementById("importLinksProgressBar");
  if (
    o &&
    n &&
    i &&
    ("string" == typeof e && e.trim() && (o.textContent = e),
    "string" == typeof t && t.trim() && (n.textContent = t),
    Number.isFinite(a) && a > 0)
  ) {
    const e = Math.max(0, Math.min(r, a)),
      t = Math.round((e / a) * 100);
    i.style.width = `${t}%`;
  }
}
function hideImportLinksProgressModal() {
  const e = document.getElementById("importLinksProgressModal");
  e && (setImportLinksProgressCancelable(!1), e.classList.remove("active"));
}
function buildImportRollbackSyncOperations(e = []) {
  const t = normalizeUndoRedoOps(e);
  return 0 === t.length
    ? []
    : buildUndoRedoSyncOperations(
        t.map((e) => ({
          table: e.table,
          id: e.id,
          snapshot: cloneUndoRedoSnapshot(e.before),
        })),
      );
}
async function rollbackImportMutationBatch(e = [], t = {}) {
  const r = normalizeUndoRedoOps(e);
  if (0 === r.length) return { success: !0, rolledBack: !1 };
  const a = await queueSyncOperationsAtomically(
    buildImportRollbackSyncOperations(r),
    {
      contextLabel: t.contextLabel || "rollbackImportMutationBatch",
      ensureBootstrapPages: !1,
    },
  );
  return a.success
    ? (await rollbackLocalMutationOps(r), { success: !0, rolledBack: !0 })
    : {
        success: !1,
        error:
          a.error || "Failed to queue rollback for partial import changes.",
      };
}
async function fetchAllBoardLinkTitles(e) {
  if (!canModify()) return;
  let t = !1;
  try {
    if (
      !(
        await ensureLocalMutationSyncScopeAllowed({
          contextLabel: "fetchAllBoardLinkTitles",
        })
      ).allowed
    )
      return;
    const r = await db.boards.get(e);
    if (!r || r.deletedAt)
      return void showGlassToast("Board not found", "error");
    const a = await db.bookmarks
      .where("boardId")
      .equals(e)
      .filter((e) => !e.deletedAt)
      .toArray();
    if (0 === a.length)
      return void showGlassToast("No links in this board", "info");
    if (
      !(await showGlassConfirm(
        llT("board.fetchAllTitlesConfirmTitle"),
        llT("board.fetchAllTitlesConfirmMessage", {
          boardName: r.name || llT("common.untitledBoard"),
        }),
        { confirmText: llT("board.fetchAllTitlesConfirmButton") },
      ))
    )
      return;
    t = showFetchTitlesProgressModal(a.length);
    const o = [];
    let n = 0;
    const i = 4;
    let s = 0;
    if (
      (await Promise.all(
        Array.from({ length: Math.min(i, a.length) }, () =>
          (async function worker() {
            for (;;) {
              const e = s++;
              if (e >= a.length) break;
              const r = a[e];
              try {
                if (!r || !r.id || !r.url) continue;
                const e = sanitizeUrl(r.url);
                if (!e) continue;
                const t = await fetchPageTitleFromBackground(e),
                  a =
                    t?.success && "string" == typeof t.title
                      ? t.title.trim()
                      : "";
                if (!a) continue;
                const n = "string" == typeof r.title ? r.title.trim() : "";
                if (!a || a === n) continue;
                o.push({ id: r.id, title: a });
              } catch (e) {
                console.error("Failed to fetch title for bookmark:", r?.id, e);
              } finally {
                (n++, t && updateFetchTitlesProgressModal(n, a.length));
              }
            }
          })(),
        ),
      ),
      0 === o.length)
    )
      return;
    const l = getCurrentTimestamp();
    await db.transaction("rw", db.bookmarks, async () => {
      for (const e of o)
        await db.bookmarks.update(e.id, { title: e.title, updatedAt: l });
    });
    const c = o.map((e) => e.id),
      d = (await db.bookmarks.bulkGet(c)).filter(Boolean);
    if (d.length > 0) {
      const t = createUndoRedoSnapshotMap(a.filter((e) => c.includes(e.id))),
        r = createUndoRedoSnapshotMap(d),
        o = buildUndoRedoOpsFromSnapshotMaps("bookmarks", t, r),
        n = await queueSyncItemsAtomically(
          o
            .filter((e) => e.after)
            .map((e) => ({
              op: "upsert",
              table: "bookmarks",
              id: e.id,
              data: e.after,
            })),
          { contextLabel: "fetchAllBoardLinkTitles" },
        );
      if (!n.success)
        return (
          await rollbackLocalMutationOps(o),
          n.staleWorkspace ||
            showGlassToast(n.error || llT("error.replaceLinkTitles"), "error"),
          void (await updateBoardBookmarks(e))
        );
      isApplyingUndoRedoHistory ||
        (await recordUndoRedoHistoryEntry({
          kind: "bookmark_bulk_title_replace",
          label:
            1 === d.length
              ? llT("history.replaceTitleOne")
              : llT("history.replaceTitlesMany", { count: d.length }),
          ops: o,
        }));
    }
    (await updateBoardBookmarks(e),
      broadcastDataChange("fetchAllBoardLinkTitles"));
  } catch (e) {
    console.error("Failed to fetch all board link titles:", e);
  } finally {
    t && hideFetchTitlesProgressModal();
  }
}
(document.addEventListener("click", (e) => {
  e.target.closest(".board-menu-container") ||
    e.target.closest(".board-menu") ||
    closeBoardMenus();
}),
  document.addEventListener(
    "contextmenu",
    (e) => {
      (e.target.closest(".board-menu-container") ||
        e.target.closest(".board-menu") ||
        closeBoardMenus(),
        e.target.closest(".tab-menu-dropdown") || closeTabContextMenu(),
        e.target.closest(".wallpaper-context-menu") ||
          closeWallpaperContextMenu());
    },
    !0,
  ));
let currentBoardToEdit = null;
async function openEditBoardModal(e) {
  if (canModify())
    try {
      const t = await db.boards.get(e);
      if (!t) return void showGlassToast("Board not found", "error");
      if (t.deletedAt)
        return void showGlassToast(
          "Cannot edit items in trash. Restore first.",
          "error",
        );
      ((currentBoardToEdit = e),
        (document.getElementById("editBoardName").value = t.name),
        document.getElementById("editBoardModal").classList.add("active"),
        document.getElementById("editBoardName").focus());
    } catch (e) {
      (console.error("Failed to open edit board modal:", e),
        showGlassToast("Failed to open edit form. Please try again.", "error"));
    }
}
function closeEditBoardModal() {
  (document.getElementById("editBoardModal").classList.remove("active"),
    (currentBoardToEdit = null),
    document.getElementById("editBoardForm").reset());
}
async function updateBoardName(e, t) {
  if (canModify())
    try {
      const r = t.trim();
      if (
        !(await updateBoard(
          e,
          { name: r },
          {
            historyKind: "board_rename",
            historyLabel: `Rename board to "${r}"`,
          },
        ))
      )
        return void showGlassToast("Board not found", "error");
      const a = document.querySelector(`[data-board-id="${e}"]`);
      if (a) {
        const e = a.querySelector(".board-title-text");
        e && (e.textContent = r);
      }
      await refreshSearchIfOpen();
    } catch (e) {
      (console.error("Failed to update board name:", e),
        showGlassToast(
          "Failed to update board name. Please try again.",
          "error",
        ));
    }
}
function closeAddBoardModal() {
  (document.getElementById("addBoardModal").classList.remove("active"),
    document.getElementById("addBoardForm").reset());
}
function openAddPageModal() {
  canModify() &&
    (document.getElementById("addPageModal").classList.add("active"),
    document.getElementById("pageName").focus());
}
function closeAddPageModal() {
  (document.getElementById("addPageModal").classList.remove("active"),
    document.getElementById("addPageForm").reset());
}
async function createNewBoard(e, t, r = null) {
  if (isAddingBoard) console.warn("Board creation already in progress");
  else {
    isAddingBoard = !0;
    try {
      const a = "number" == typeof r ? r : 0,
        o = await db.boards
          .where("pageId")
          .equals(currentPageId)
          .and((e) => e.columnIndex === a)
          .toArray(),
        n = o.length > 0 ? Math.max(...o.map((e) => e.order)) + 1 : 0,
        i = {
          name: e.trim(),
          columnIndex: a,
          order: n,
          description: t ? t.trim() : null,
          pageId: currentPageId,
        },
        s = await addBoard(i);
      if (!s) return;
      ((i.id = s),
        (pageHasBoards = !0),
        hideAddBoardPlaceholder(),
        await loadBoardsFromDatabase(),
        emitQuickTourEvent("board_created", {
          boardId: s,
          pageId: currentPageId,
        }));
    } catch (e) {
      (console.error("Failed to create board:", e),
        showGlassToast("Failed to create board. Please try again.", "error"));
    } finally {
      isAddingBoard = !1;
    }
  }
}
function updateSettingsVersionInfo() {
  const e = document.getElementById("settingsVersionRow"),
    t = document.getElementById("settingsVersionText");
  if (!e || !t) return;
  let r = "";
  try {
    "undefined" != typeof chrome &&
      chrome.runtime &&
      "function" == typeof chrome.runtime.getManifest &&
      (r = chrome.runtime.getManifest()?.version || "");
  } catch (e) {
    console.warn("Unable to read extension manifest version for settings:", e);
  }
  r
    ? ((t.textContent = llT("settings.version", { version: r })),
      (e.hidden = !1))
    : (e.hidden = !0);
}
function selectSettingsTab(e = "general") {
  const t = ["general", "account", "mobile", "language", "support"].includes(e)
    ? e
    : "general";
  (document
    .querySelectorAll(".settings-nav-item")
    .forEach((e) => e.classList.remove("active")),
    document
      .querySelectorAll(".settings-tab-pane")
      .forEach((e) => e.classList.remove("active")));
  const r = document.querySelector(`.settings-nav-item[data-tab="${t}"]`),
    a = "settings" + t.charAt(0).toUpperCase() + t.slice(1) + "Tab",
    o = document.getElementById(a);
  (r && r.classList.add("active"),
    o
      ? (o.classList.add("active"),
        "mobile" === t &&
          window.LumiListMobilePromotion?.resetSettingsPlatform())
      : console.warn("[Settings] Tab content element not found:", {
          tabName: t,
          tabId: a,
        }));
  const n = document.querySelector(".settings-content");
  n && (n.scrollTop = 0);
}
let settingsPopupMotion = null,
  settingsPopupGeneration = 0;
async function openSettingsModal(e = {}) {
  const t = document.getElementById("settingsModal");
  if (!t) return;
  const r =
      e && "object" == typeof e && "string" == typeof e.initialTab
        ? e.initialTab
        : "general",
    a = t.querySelector(".settings-modal-glass"),
    o = ++settingsPopupGeneration,
    n = t.classList.contains("active") && !settingsPopupMotion?.isClosing(a);
  (n || settingsPopupMotion?.finish(a),
    t.classList.add("active"),
    selectSettingsTab(r),
    n ||
      ((settingsPopupMotion ||=
        window.LumiListModules?.popupMotion?.create(window)),
      settingsPopupMotion?.open(
        a,
        document.getElementById("floatingSettingsBtn"),
        { duration: 130, backdrop: t },
      )),
    updateThemeModeToggle(),
    updateCompactModeToggle(),
    updateFloatingControlsCollapsedToggle(),
    updateLargeBoardCollapseToggle(),
    loadCloseTabsAfterSaveAllTabsSetting().catch((e) => {
      console.error(
        "Failed to load close-tabs-after-save-all setting for settings modal:",
        e,
      );
    }),
    updateSettingsVersionInfo(),
    refreshSettingsQuickSaveControls().catch((e) => {
      console.error("Failed to refresh quick save settings controls:", e);
    }),
    window.LumiListAccountPassword?.close());
  const i = document.getElementById("settingsLoggedIn"),
    s = document.getElementById("settingsLoggedOut"),
    l = document.getElementById("settingsAccountEmail"),
    c = document.getElementById("settingsUserAvatar");
  try {
    const e = await chrome.storage.local.get("lumilist_user");
    if (o !== settingsPopupGeneration || !t.classList.contains("active"))
      return;
    if (e.lumilist_user?.email) {
      const r = e.lumilist_user.email;
      ((l.textContent = r),
        c && (c.textContent = r.charAt(0).toUpperCase()),
        (i.style.display = "block"),
        (s.style.display = "none"),
        t.classList.contains("active") &&
          window.LumiListAccountPassword?.open(e.lumilist_user),
        "function" == typeof updateSettingsSubscriptionDisplay &&
          updateSettingsSubscriptionDisplay().catch((e) => {
            console.error(
              "Failed to refresh settings subscription display:",
              e,
            );
          }));
    } else ((i.style.display = "none"), (s.style.display = "block"));
  } catch (e) {
    if (o !== settingsPopupGeneration || !t.classList.contains("active"))
      return;
    ((i.style.display = "none"), (s.style.display = "block"));
  }
}
function closeSettingsModal(e = {}) {
  const t = document.getElementById("settingsModal"),
    r = t?.querySelector(".settings-modal-glass");
  if (!0 !== e?.immediate && settingsPopupMotion?.isClosing(r)) return;
  if ((++settingsPopupGeneration, window.LumiListAccountPassword?.close(), !t))
    return;
  const hide = () => t.classList.remove("active");
  if (
    !0 === e?.immediate ||
    !t.classList.contains("active") ||
    !settingsPopupMotion
  )
    return (
      hide(),
      settingsPopupMotion?.finish(r),
      void settingsPopupMotion?.stopPulse()
    );
  settingsPopupMotion.close(r, document.getElementById("floatingSettingsBtn"), {
    duration: 130,
    backdrop: t,
    onFinish: hide,
  });
}
async function getChromeBookmarks() {
  return new Promise((e) => {
    chrome.bookmarks.getTree((t) => {
      const r = [];
      let a = 0;
      (!(function processFolder(e, t = 0) {
        if ("0" !== e.id) {
          if (!e.url && e.children) {
            const o = (function countBookmarksInFolder(e) {
              let t = 0;
              function traverse(e) {
                e.url
                  ? t++
                  : e.children && e.children.forEach((e) => traverse(e));
              }
              return (e.children?.forEach((e) => traverse(e)), t);
            })(e);
            (o > 0 &&
              (r.push({
                id: e.id,
                name: e.title || "Untitled Folder",
                bookmarkCount: o,
                depth: t,
                node: e,
              }),
              (a += o)),
              t < 1 && e.children.forEach((e) => processFolder(e, t + 1)));
          }
        } else e.children?.forEach((e) => processFolder(e, t));
      })(t[0]),
        e({ folders: r, totalBookmarks: a }));
    });
  });
}
function collectBookmarksFromFolder(e) {
  const t = [];
  function traverse(e) {
    e.url
      ? t.push({ title: e.title || "", url: e.url })
      : e.children && e.children.forEach((e) => traverse(e));
  }
  return (e.children?.forEach((e) => traverse(e)), t);
}
function prepareChromeImportBookmarks(e = []) {
  const t = [];
  let r = 0;
  for (const a of e) {
    if (isUnsafeUrl(a?.url)) {
      (r++, console.warn(`Skipped unsafe URL: ${a?.url}`));
      continue;
    }
    const e = sanitizeUrl(a?.url);
    if (!e) {
      (r++, console.warn(`Skipped invalid URL: ${a?.url}`));
      continue;
    }
    let o = a?.title;
    if (!o)
      try {
        o = new URL(e).hostname;
      } catch {
        o = "Untitled";
      }
    t.push({ title: o, url: e });
  }
  return { validBookmarks: t, skippedCount: r };
}
let _chromeImportInProgress = !1;
function getChromeDefaultFolderLocalizationKey(e) {
  if (!e || 0 !== Number(e.depth)) return null;
  const t = String(e.id || ""),
    r = String(e.name || "")
      .trim()
      .toLowerCase();
  return "1" === t || "bookmarks bar" === r
    ? "import.defaultFolder.bookmarksBar"
    : "2" === t || "other bookmarks" === r
      ? "import.defaultFolder.otherBookmarks"
      : "3" === t || "mobile bookmarks" === r
        ? "import.defaultFolder.mobileBookmarks"
        : null;
}
function getChromeImportFolderDisplayName(e) {
  const t = getChromeDefaultFolderLocalizationKey(e);
  return t
    ? llT(t)
    : String(e?.name || "").trim() || llT("import.untitledFolder");
}
function refreshChromeImportLocalizedLabels() {
  const e = document.getElementById("importChromeModal");
  if (!e || !e.classList.contains("active")) return;
  const t = document.getElementById("chromeImportPreview"),
    r = document.getElementById("confirmChromeImportBtn");
  r &&
    !_chromeImportInProgress &&
    (r.textContent = llT("common.importSelected"));
  const a = Array.isArray(e.folderData) ? e.folderData : [];
  if (!t || "none" === t.style.display) return;
  if (0 === a.length)
    return void (t.innerHTML = `<div class="import-empty-message">${escapeHtml(llT("import.noChromeFolders"))}</div>`);
  const o = new Map(a.map((e) => [String(e.id), e]));
  t.querySelectorAll(".import-folder-item").forEach((e) => {
    const t = e.querySelector('input[type="checkbox"]'),
      r = e.querySelector(".import-folder-name"),
      a = e.querySelector(".import-folder-count"),
      n = t ? o.get(String(t.value)) : null;
    n &&
      (r && (r.textContent = getChromeImportFolderDisplayName(n)),
      a &&
        (a.textContent = llT(
          1 === n.bookmarkCount
            ? "import.bookmarkCountOne"
            : "import.bookmarkCountMany",
          { count: n.bookmarkCount },
        )));
  });
}
async function showChromeImportModal() {
  const e = getWorkspaceMutationBlockedReason();
  if (e) return void showWorkspaceMutationBlockedToast(e);
  const t = await getCurrentStoredUserId();
  if (!t)
    return void showGlassToast(
      "Please sign in again before importing Chrome bookmarks.",
      "warning",
    );
  const r = document.getElementById("importChromeModal"),
    a = document.getElementById("chromeImportPreview"),
    o = document.getElementById("chromeImportProgress"),
    n = document.getElementById("confirmChromeImportBtn");
  ((activeChromeImportUserId = t),
    (o.style.display = "none"),
    (n.disabled = !1),
    (n.textContent = llT("common.importSelected")));
  const { folders: i, totalBookmarks: s } = await getChromeBookmarks(),
    l = await getCurrentStoredUserId();
  l && l === t
    ? (0 === i.length
        ? ((a.innerHTML = `<div class="import-empty-message">${escapeHtml(llT("import.noChromeFolders"))}</div>`),
          (n.disabled = !0))
        : ((a.innerHTML = i
            .map((e) => {
              const t = llT(
                1 === e.bookmarkCount
                  ? "import.bookmarkCountOne"
                  : "import.bookmarkCountMany",
                { count: e.bookmarkCount },
              );
              return `\n                <label class="import-folder-item">\n                    <input type="checkbox" value="${escapeHtml(e.id)}" checked>\n                    <div class="import-folder-info">\n                        <span class="import-folder-name">${escapeHtml(getChromeImportFolderDisplayName(e))}</span>\n                        <span class="import-folder-count">${escapeHtml(t)}</span>\n                    </div>\n                </label>\n            `;
            })
            .join("")),
          (r.folderData = i)),
      r.classList.add("active"))
    : (activeChromeImportUserId = null);
}
function closeChromeImportModal() {
  const e = document.getElementById("importChromeModal"),
    t = document.getElementById("chromeImportPreview"),
    r = document.getElementById("chromeImportProgress"),
    a = document.getElementById("cancelChromeImportBtn");
  ((activeChromeImportUserId = null),
    e.classList.remove("active"),
    delete e.folderData,
    t && (t.style.display = "block"),
    r && (r.style.display = "none"),
    a && (a.disabled = !1));
}
async function importSelectedChromeBookmarks() {
  if (!canModify()) return;
  const e = getWorkspaceMutationBlockedReason();
  if (e)
    return (
      closeChromeImportModal(),
      void showWorkspaceMutationBlockedToast(e)
    );
  const t = normalizeRuntimeUserId(activeChromeImportUserId),
    r = await getCurrentStoredUserId();
  if (!t || !r || t !== r)
    return (
      closeChromeImportModal(),
      void showGlassToast(
        "This import window is out of date after an account change. Please reopen it.",
        "warning",
      )
    );
  if (_chromeImportInProgress)
    return void showToast("Import already in progress", "info");
  _chromeImportInProgress = !0;
  const a = window.LumiListMobilePromotion?.captureBookmarkSave?.(t),
    o = document.getElementById("importChromeModal"),
    n = document.getElementById("chromeImportPreview"),
    i = document.getElementById("chromeImportProgress"),
    s = document.getElementById("importProgressBar"),
    l = document.getElementById("importStatusText"),
    c = document.getElementById("confirmChromeImportBtn"),
    d = document.getElementById("cancelChromeImportBtn"),
    u = Array.from(n.querySelectorAll('input[type="checkbox"]:checked')).map(
      (e) => e.value,
    );
  if (0 === u.length)
    return (
      showToast("Please select at least one folder to import", "error"),
      void (_chromeImportInProgress = !1)
    );
  const p = (o.folderData || [])
      .filter((e) => u.includes(e.id))
      .map((e) => {
        const { validBookmarks: t, skippedCount: r } =
          prepareChromeImportBookmarks(collectBookmarksFromFolder(e.node));
        return { ...e, validBookmarks: t, skippedCount: r };
      }),
    m = p.filter((e) => e.validBookmarks.length > 0),
    g = m.reduce((e, t) => e + t.validBookmarks.length, 0),
    f = m.length,
    h = checkBoardLimit(f);
  if (!h.allowed)
    return (
      console.warn("[Chrome Import] Board limit would be exceeded:", h.warning),
      h.remaining > 0
        ? showGlassToast(
            llT("import.limitFoldersPartial", {
              remaining: llNumber(h.remaining),
              total: llNumber(f),
            }),
            "warning",
          )
        : showGlassToast(h.warning, "error"),
      void (_chromeImportInProgress = !1)
    );
  if (0 === f || 0 === g)
    return (
      showGlassToast(
        "No valid bookmarks found in the selected folders.",
        "warning",
      ),
      void (_chromeImportInProgress = !1)
    );
  const y = await checkBookmarkLimitForBulkImport(g);
  if (!y.allowed)
    return (
      console.warn(
        "[Chrome Import] Bookmark limit would be exceeded:",
        y.warning,
      ),
      y.remaining > 0
        ? showGlassToast(
            llT("import.limitChromeBookmarksPartial", {
              remaining: llNumber(y.remaining),
              total: llNumber(g),
            }),
            "warning",
          )
        : showGlassToast(y.warning, "error"),
      void (_chromeImportInProgress = !1)
    );
  ((n.style.display = "none"),
    (i.style.display = "block"),
    (c.disabled = !0),
    (d.disabled = !0));
  let b = 0,
    S = p.reduce((e, t) => e + t.skippedCount, 0);
  const w = m.length,
    k = [];
  let I = !1;
  try {
    for (let e = 0; e < m.length; e++) {
      const t = m[e],
        r = Math.round(((e + 1) / w) * 100);
      ((s.style.width = `${r}%`),
        (l.textContent = llT("import.importingFolder", {
          name: t.name,
          current: e + 1,
          total: w,
        })));
      const a = await db.boards
          .where("pageId")
          .equals(currentPageId)
          .filter((e) => !e.deletedAt)
          .toArray(),
        o = buildUniqueImportedBoardName(
          t.name,
          collectImportedNameRegistry(a, sanitizeBoardName),
        ),
        n = [0, 0, 0, 0];
      a.forEach((e) => {
        e.columnIndex >= 0 && e.columnIndex < 4 && n[e.columnIndex]++;
      });
      const i = n.indexOf(Math.min(...n)),
        c = a
          .filter((e) => e.columnIndex === i)
          .reduce((e, t) => Math.max(e, t.order || 0), -1),
        d = await addBoard(
          { pageId: currentPageId, name: o, columnIndex: i, order: c + 1 },
          { skipHistory: !0 },
        );
      if (!d) throw new Error(`Failed to create import board "${o}".`);
      const u = await db.boards.get(d);
      u && k.push({ table: "boards", id: u.id, before: null, after: u });
      const p = t.validBookmarks.map((e, t) => ({
          boardId: d,
          title: e.title,
          url: e.url,
          order: t,
        })),
        g = await bulkAddBookmarks(p, { skipHistory: !0 });
      ((b += g.length),
        g.length > 0 &&
          (await db.bookmarks.bulkGet(g)).filter(Boolean).forEach((e) => {
            k.push({ table: "bookmarks", id: e.id, before: null, after: e });
          }));
    }
    (!isApplyingUndoRedoHistory &&
      k.length > 0 &&
      (await recordUndoRedoHistoryEntry({
        kind: "import_chrome_bookmarks",
        label: `Import ${b} Chrome bookmarks`,
        ops: k,
      })),
      (I = !0),
      b > 0 && (await a?.()),
      (l.textContent = llT("import.progressComplete")),
      (s.style.width = "100%"),
      setTimeout(() => {
        (closeChromeImportModal(), closeSettingsModal({ immediate: !0 }));
        const e = llT(1 === b ? "import.linkSingular" : "import.linkPlural"),
          t =
            S > 0
              ? llT("import.chromeSuccessSkipped", {
                  count: llNumber(b),
                  label: e,
                  skipped: llNumber(S),
                })
              : llT("import.chromeSuccess", { count: llNumber(b), label: e });
        showGlassToast(t, "success");
      }, 300),
      (pageHasBoards = !0),
      hideAddBoardPlaceholder(),
      loadBoardsFromDatabase(),
      broadcastDataChange("chromeImport"));
  } catch (e) {
    if ((console.error("Import error:", e), !I && k.length > 0)) {
      const e = await rollbackImportMutationBatch(k, {
        contextLabel: "chromeImportRollback",
      });
      if (!e.success)
        return (
          console.error("Failed to roll back partial Chrome import:", e.error),
          (l.textContent = llT("import.progressFailedPartial")),
          (c.disabled = !1),
          void (d.disabled = !1)
        );
      await loadBoardsFromDatabase();
    }
    ((l.textContent = llT("import.progressFailed")),
      (c.disabled = !1),
      (d.disabled = !1),
      (i.style.display = "none"),
      (n.style.display = "block"));
  } finally {
    _chromeImportInProgress = !1;
  }
}
const ONBOARDING_STEP_PLAN = "plan",
  ONBOARDING_STEP_WELCOME = "welcome",
  ONBOARDING_SEEN_STORAGE_KEY_PREFIX = "lumilist_has_seen_onboarding_",
  ONBOARDING_PENDING_CHECKOUT_KEY_PREFIX =
    "lumilist_pending_onboarding_checkout_",
  ONBOARDING_PENDING_CHECKOUT_TTL_MS = 864e5,
  ONBOARDING_FRESH_ACCOUNT_MAX_AGE_MS = 864e5,
  ONBOARDING_ACCOUNT_CLOCK_SKEW_MS = 3e5;
let onboardingTrialRequest = null;
function setOnboardingTrialLoading(e) {
  const t = document.getElementById("onboardingTrialLoading");
  t && (t.hidden = !e);
  for (const t of [
    "startTrialOnboardingBtn",
    "monthlyOnboardingBtn",
    "lifetimeOnboardingBtn",
    "yearlyOnboardingBtn",
  ]) {
    const r = document.getElementById(t);
    r && (r.disabled = e);
  }
  (document
    .getElementById("startTrialOnboardingBtn")
    ?.setAttribute("aria-busy", e ? "true" : "false"),
    syncOnboardingTrialAvailability());
}
function resetOnboardingTrialRequest() {
  ((onboardingTrialRequest = null), setOnboardingTrialLoading(!1));
}
function isKnownOnboardingSubscriptionStatus(e) {
  return (
    "trial" === e ||
    "active" === e ||
    "grace" === e ||
    "expired" === e ||
    "plan_required" === e
  );
}
function isOnboardingPlanRequiredStatus(e) {
  return "plan_required" === e;
}
function isOnboardingPlanRequiredPayload(e) {
  return Boolean(
    e &&
    "object" == typeof e &&
    ("plan_required" === e.status || !0 === e.requires_plan_selection),
  );
}
function getOnboardingTrialUnavailableReason(
  e = window.subscriptionData || null,
) {
  return e && "object" == typeof e
    ? !1 !== e.trial_available
      ? null
      : "previously_used" === e.trial_unavailable_reason
        ? "previously_used"
        : "temporarily_unavailable"
    : null;
}
function getOnboardingTrialUnavailableMessage(e) {
  return "previously_used" === e
    ? "A free trial is not available for this sign-in. Choose a paid plan or contact support."
    : "Trial availability cannot be verified right now. Try again later or choose a paid plan.";
}
function getOnboardingPlanChoiceState(e = null) {
  const t = !0 === e?.lifetime_offer?.assigned ? e.lifetime_offer : null;
  return {
    lifetimeOffer: t,
    showTrial: !0,
    showMonthly: !t,
    showLifetime: Boolean(t),
    showYearly: !t,
  };
}
function syncOnboardingTrialAvailability(e = window.subscriptionData || null) {
  const t = document.getElementById("startTrialOnboardingBtn"),
    r = document.getElementById("trialAvailabilityMessage"),
    a = document.getElementById("monthlyOnboardingBtn"),
    o = document.getElementById("lifetimeOnboardingBtn"),
    n = document.getElementById("lifetimeOnboardingPrice"),
    i = document.getElementById("yearlyOnboardingBtn"),
    s = document.querySelector("#onboardingPlanStep .onboarding-title"),
    l = document.querySelector("#onboardingPlanStep .onboarding-subtitle"),
    c = document.querySelector("#onboardingPlanStep .onboarding-plan-options"),
    d = document.querySelector("#onboardingPlanStep .onboarding-plan-footnote");
  if (!t) return;
  const u = getOnboardingPlanChoiceState(e),
    p = u.lifetimeOffer;
  (t.classList.toggle("hidden", !u.showTrial),
    a?.classList.toggle("hidden", !u.showMonthly),
    o && o.classList.toggle("hidden", !u.showLifetime),
    i && i.classList.toggle("hidden", !u.showYearly),
    n &&
      p &&
      (n.textContent = llT("subscription.lifetimePrice", {
        amount: formatLifetimeOfferAmount(p),
      })),
    s && (s.textContent = llLiteral("Choose your LinkLabs plan")),
    l && (l.textContent = llLiteral("Select one option to continue.")),
    c &&
      c.setAttribute("aria-label", llLiteral("Choose your LinkLabs plan")),
    d &&
      (d.textContent = llLiteral(
        "After you choose, LumiList will open your workspace.",
      )));
  const m = getOnboardingTrialUnavailableReason(e),
    g = Boolean(m);
  ((t.disabled = g || Boolean(onboardingTrialRequest)),
    t.classList.toggle("is-unavailable", g),
    t.setAttribute("aria-disabled", t.disabled ? "true" : "false"),
    r &&
      ((r.hidden = !g),
      (r.textContent = g ? getOnboardingTrialUnavailableMessage(m) : "")));
}
function hasOnboardingWorkspaceAccessStatus(e) {
  return "trial" === e || "active" === e || "grace" === e;
}
function isOnboardingPlanSelectionRequired(e, t) {
  return !1;
}
function isExpiredSubscriptionOverlayActiveForOnboarding() {
  if ("undefined" == typeof document) return !1;
  const e = document.body?.classList?.contains("subscription-expired"),
    t =
      "function" == typeof document.getElementById
        ? document.getElementById("expiredOverlay")
        : null,
    r = t && !t.classList.contains("hidden");
  return !(!e && !r);
}
function getRuntimeOnboardingSubscriptionStatus() {
  const e = "undefined" != typeof window ? window : globalThis,
    t = e.subscriptionData || null;
  let r = isKnownOnboardingSubscriptionStatus(e.subscriptionStatus)
    ? e.subscriptionStatus
    : e.cachedSubscriptionStatus;
  if (isOnboardingPlanSelectionRequired(r, t)) return "plan_required";
  if (
    t &&
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager.getEffectiveStatus
  ) {
    const e = SyncManager.getEffectiveStatus(t);
    isKnownOnboardingSubscriptionStatus(e) && (r = e);
  }
  return isKnownOnboardingSubscriptionStatus(r) ? r : null;
}
function getOnboardingSeenStorageKey(e) {
  return `lumilist_has_seen_onboarding_${e}`;
}
function getOnboardingPendingCheckoutStorageKey(e) {
  return `${ONBOARDING_PENDING_CHECKOUT_KEY_PREFIX}${e}`;
}
function isFreshOnboardingAccount(e, t = Date.now()) {
  const r = e?.createdAt || e?.created_at || null;
  if (!r) return !1;
  const a = new Date(r).getTime();
  if (!Number.isFinite(a)) return !1;
  const o = t - a;
  return o >= -3e5 && o <= 864e5;
}
async function getCurrentOnboardingUser() {
  try {
    const e = await chrome.storage.local.get("lumilist_user");
    return e?.lumilist_user || null;
  } catch (e) {
    return (console.warn("[Onboarding] Failed to read current user:", e), null);
  }
}
async function getCurrentOnboardingUserId() {
  return (await getCurrentOnboardingUser())?.id || null;
}
async function markOnboardingSeenForUser(e) {
  return (
    !!e &&
    (await chrome.storage.local.set({ [getOnboardingSeenStorageKey(e)]: !0 }),
    !0)
  );
}
function getOnboardingInitialStep(e = null) {
  return e === ONBOARDING_STEP_PLAN || "welcome" === e
    ? e
    : hasOnboardingWorkspaceAccessStatus(
          getRuntimeOnboardingSubscriptionStatus(),
        )
      ? "welcome"
      : ONBOARDING_STEP_PLAN;
}
function setOnboardingStep(e) {
  const t = document.getElementById("onboardingModal"),
    r = document.getElementById("onboardingPlanStep"),
    a = document.getElementById("onboardingWelcomeStep"),
    o = getOnboardingInitialStep(e);
  (t && (t.dataset.step = o),
    r && r.classList.toggle("hidden", o !== ONBOARDING_STEP_PLAN),
    a && a.classList.toggle("hidden", "welcome" !== o),
    o === ONBOARDING_STEP_PLAN && syncOnboardingTrialAvailability());
}
function isOnboardingPlanStepActive() {
  const e = document.getElementById("onboardingModal");
  return (
    !(!e || !e.classList.contains("active")) &&
    e.dataset.step === ONBOARDING_STEP_PLAN
  );
}
async function markOnboardingSeenForCurrentUser() {
  return markOnboardingSeenForUser(await getCurrentOnboardingUserId());
}
async function rememberPendingOnboardingCheckoutForCurrentUser(e) {
  const t = await getCurrentOnboardingUserId();
  return (
    !!t &&
    (await chrome.storage.local.set({
      [getOnboardingPendingCheckoutStorageKey(t)]: {
        plan: e,
        timestamp: Date.now(),
      },
    }),
    !0)
  );
}
async function hasFreshPendingOnboardingCheckoutForCurrentUser() {
  const e = await getCurrentOnboardingUserId();
  if (!e) return !1;
  const t = getOnboardingPendingCheckoutStorageKey(e),
    r = await chrome.storage.local.get(t),
    a = r?.[t];
  return (
    !!a?.timestamp &&
    (!!(Date.now() - Number(a.timestamp) <= 864e5) ||
      (await chrome.storage.local.remove(t), !1))
  );
}
async function consumePendingOnboardingCheckoutForCurrentUser() {
  const e = await getCurrentOnboardingUserId();
  return !!e && consumePendingOnboardingCheckoutForUser(e);
}
async function consumePendingOnboardingCheckoutForUser(e) {
  const t = normalizeRuntimeUserId(e);
  if (!t) return !1;
  const r = getOnboardingPendingCheckoutStorageKey(t),
    a = await chrome.storage.local.get(r),
    o = a?.[r],
    n = Boolean(o?.timestamp && Date.now() - Number(o.timestamp) <= 864e5);
  return ((n || o?.timestamp) && (await chrome.storage.local.remove(r)), n);
}
async function showOnboardingWelcomeStepForCurrentUser(e = null) {
  return (
    !!openOnboardingModal({ step: "welcome" }) &&
    (e
      ? await markOnboardingSeenForUser(e)
      : await markOnboardingSeenForCurrentUser(),
    !0)
  );
}
async function maybeShowOnboardingWelcomeAfterCheckout(
  e = getRuntimeOnboardingSubscriptionStatus(),
  t = null,
) {
  if (
    (!t &&
      window.pendingWorkspaceAccessUserId &&
      (t = captureSubscriptionRequestContext()),
    t && !isSubscriptionRequestContextCurrent(t))
  )
    return !1;
  if (!hasOnboardingWorkspaceAccessStatus(e)) return !1;
  if (
    window.pendingWorkspaceAccessUserId &&
    !(await resumeWorkspaceAfterAccessGranted(e))
  )
    return !1;
  const r = await getCurrentOnboardingUser(),
    a = r?.id || null;
  if (!a) return !1;
  if (t && (!isSubscriptionRequestContextCurrent(t) || a !== t.userId))
    return !1;
  const o = getOnboardingSeenStorageKey(a),
    n = await chrome.storage.local.get(o);
  if (t && !isSubscriptionRequestContextCurrent(t)) return !1;
  const i = isOnboardingPlanStepActive();
  if (!isFreshOnboardingAccount(r))
    return (
      await markOnboardingSeenForUser(a),
      !(
        (t && !isSubscriptionRequestContextCurrent(t)) ||
        (await consumePendingOnboardingCheckoutForUser(a),
        (t && !isSubscriptionRequestContextCurrent(t)) ||
          (i && closeOnboardingModal()),
        1)
      )
    );
  if (n?.[o])
    return (
      await consumePendingOnboardingCheckoutForUser(a),
      (t && !isSubscriptionRequestContextCurrent(t)) ||
        (i && closeOnboardingModal()),
      !1
    );
  const s = await consumePendingOnboardingCheckoutForUser(a);
  return (
    !(t && !isSubscriptionRequestContextCurrent(t)) &&
    !(!s && !i) &&
    showOnboardingWelcomeStepForCurrentUser(a)
  );
}
async function showRequiredPlanSelectionForCurrentUser(
  e = getRuntimeOnboardingSubscriptionStatus(),
  t = null,
  r = null,
) {
  return (
    !(r && !isSubscriptionRequestContextCurrent(r, t)) &&
    !!isOnboardingPlanSelectionRequired(e, t) &&
    !(await shouldSuppressOnboardingForSubscriptionStateAsync()) &&
    !(r && !isSubscriptionRequestContextCurrent(r, t)) &&
    !hasOnboardingWorkspaceAccessStatus(
      getRuntimeOnboardingSubscriptionStatus(),
    ) &&
    openOnboardingModal({ step: ONBOARDING_STEP_PLAN })
  );
}
async function refreshRuntimeSubscriptionStateFromStorage() {
  if (
    "undefined" == typeof SyncManager ||
    "function" != typeof SyncManager.getStoredSubscriptionStatus
  )
    return null;
  try {
    const e = await SyncManager.getStoredSubscriptionStatus();
    if (!e || "object" != typeof e) return null;
    const t = e.status ?? null,
      r = Number.isFinite(e.daysLeft) ? e.daysLeft : 0,
      a = e.subscription || null;
    return (
      (window.subscriptionStatus = t),
      (window.subscriptionDaysLeft = r),
      (window.subscriptionData = a),
      { status: t, daysLeft: r, subscription: a }
    );
  } catch (e) {
    return (
      console.warn(
        "[Subscription] Failed to refresh runtime state from storage:",
        e,
      ),
      null
    );
  }
}
async function refreshRuntimeSubscriptionStateFromServerForOnboarding() {
  if (
    "undefined" == typeof SyncManager ||
    "function" != typeof SyncManager.fetchSubscriptionFromServer
  )
    return refreshRuntimeSubscriptionStateFromStorage();
  try {
    const e = await SyncManager.fetchSubscriptionFromServer();
    if (!e || "object" != typeof e)
      return refreshRuntimeSubscriptionStateFromStorage();
    const t = e.status ?? null,
      r = Number.isFinite(e.daysLeft) ? e.daysLeft : 0,
      a = e.subscription || null;
    return (
      "function" == typeof SyncManager.storeSubscriptionStatus &&
        (await SyncManager.storeSubscriptionStatus(t, r, a)),
      (window.subscriptionStatus = t),
      (window.subscriptionDaysLeft = r),
      (window.subscriptionData = a),
      { status: t, daysLeft: r, subscription: a }
    );
  } catch (e) {
    return (
      console.warn(
        "[Subscription] Failed to refresh onboarding state from server:",
        e,
      ),
      refreshRuntimeSubscriptionStateFromStorage()
    );
  }
}
function getOnboardingStorageCleanupKeys(e = {}) {
  return Object.keys(e || {}).filter(
    (e) =>
      e.startsWith("lumilist_has_seen_onboarding_") ||
      e.startsWith(ONBOARDING_PENDING_CHECKOUT_KEY_PREFIX) ||
      e.startsWith("lumilist_onboarding_owner_"),
  );
}
function shouldSuppressOnboardingForSubscriptionState() {
  return (
    "expired" === getRuntimeOnboardingSubscriptionStatus() ||
    isExpiredSubscriptionOverlayActiveForOnboarding()
  );
}
async function shouldSuppressOnboardingForSubscriptionStateAsync() {
  if (shouldSuppressOnboardingForSubscriptionState()) return !0;
  if (
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager.getStoredSubscriptionStatus
  ) {
    const e = await SyncManager.getStoredSubscriptionStatus();
    if (
      isKnownOnboardingSubscriptionStatus(e?.status) &&
      "expired" === e.status
    )
      return !0;
  }
  return shouldSuppressOnboardingForSubscriptionState();
}
function clearPendingOnboardingOpen() {
  (_onboardingRetryTimeoutId &&
    (clearTimeout(_onboardingRetryTimeoutId),
    (_onboardingRetryTimeoutId = null)),
    _onboardingOpenTimeoutId &&
      (clearTimeout(_onboardingOpenTimeoutId),
      (_onboardingOpenTimeoutId = null)));
}
function openOnboardingModal(e = {}) {
  if (shouldSuppressOnboardingForSubscriptionState())
    return (clearPendingOnboardingOpen(), !1);
  const t = document.getElementById("onboardingModal");
  if (!t) return !1;
  const r =
      navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
      navigator.userAgent.toUpperCase().indexOf("MAC") >= 0,
    a = document.getElementById("quickSaveShortcut");
  return (
    a && (a.textContent = r ? "Cmd+Shift+Y" : "Ctrl+Shift+Y"),
    setOnboardingStep(e?.step || null),
    t.classList.add("active"),
    !0
  );
}
function closeOnboardingModal(e = !1) {
  resetOnboardingTrialRequest();
  const t = document.getElementById("onboardingModal");
  t &&
    (t.classList.remove("active"),
    e &&
      window.LumiListMobilePromotion?.completeOnboarding?.(
        getLoadedWorkspaceOwnerUserId(),
      ));
}
function getQuickTourStorageKey(e) {
  return `lumilist_quick_tour_v1_${e}`;
}
function clearQuickTourRetryTimeout() {
  quickTourRetryTimeoutId &&
    (clearTimeout(quickTourRetryTimeoutId), (quickTourRetryTimeoutId = null));
}
function cancelQuickTourAnchorRefreshFrame() {
  null !== quickTourAnchorRefreshRafId &&
    (cancelAnimationFrame(quickTourAnchorRefreshRafId),
    (quickTourAnchorRefreshRafId = null));
}
function refreshQuickTourAnchorTarget() {
  if (
    ((quickTourAnchorRefreshRafId = null),
    !quickTourState.active || !quickTourPopoverEl)
  )
    return;
  const e = QUICK_TOUR_STEPS[quickTourState.stepIndex];
  if (!e) return;
  const t = resolveQuickTourStepState(e, quickTourState.context),
    r = t?.targetEl || null;
  r &&
    (updateQuickTourPopoverContent(quickTourPopoverEl, t),
    syncQuickTourForcedBoard(e, quickTourState.context, r),
    setQuickTourTargetHighlight(r),
    positionQuickTourPopover(r, t?.placement || "auto"));
}
function scheduleQuickTourAnchorRefresh() {
  quickTourState.active &&
    null === quickTourAnchorRefreshRafId &&
    (quickTourAnchorRefreshRafId = requestAnimationFrame(() => {
      refreshQuickTourAnchorTarget();
    }));
}
function emitQuickTourEvent(e, t = {}) {
  if (e && 0 !== quickTourEventListeners.size)
    for (const r of quickTourEventListeners)
      try {
        r({ type: e, payload: t, timestamp: Date.now() });
      } catch (e) {
        console.error("[QuickTour] Listener error:", e);
      }
}
function onQuickTourEvent(e) {
  return "function" != typeof e
    ? () => {}
    : (quickTourEventListeners.add(e),
      () => {
        quickTourEventListeners.delete(e);
      });
}
function shouldPersistQuickTourCompletion(e) {
  return "dev-test-button" !== e;
}
async function markQuickTourCompletedForUser(e) {
  if (e && "undefined" != typeof chrome && chrome.storage?.local)
    try {
      const t = getQuickTourStorageKey(e);
      await chrome.storage.local.set({
        [t]: {
          completed: !0,
          completedAt: new Date().toISOString(),
          version: 1,
        },
      });
    } catch (e) {
      console.error("[QuickTour] Failed to persist completion status:", e);
    }
}
function ensureQuickTourPopoverElement() {
  if (quickTourPopoverEl) return quickTourPopoverEl;
  const e = document.createElement("div");
  ((e.className = "quick-tour-popover"),
    (e.innerHTML = `\n        <div class="quick-tour-title"></div>\n        <div class="quick-tour-body"></div>\n        <div class="quick-tour-actions">\n            <button type="button" class="quick-tour-skip">${escapeHTML(llT("quickTour.skip"))}</button>\n        </div>\n    `));
  const t = e.querySelector(".quick-tour-skip");
  return (
    t &&
      t.addEventListener("click", () => {
        stopQuickTour("dismissed");
      }),
    document.body.appendChild(e),
    (quickTourPopoverEl = e),
    e
  );
}
function clearQuickTourTargetHighlight() {
  quickTourCurrentTargetEl &&
    (quickTourCurrentTargetEl.classList.remove("quick-tour-target"),
    (quickTourCurrentTargetEl = null));
}
function setQuickTourTargetHighlight(e) {
  e &&
    quickTourCurrentTargetEl !== e &&
    (clearQuickTourTargetHighlight(),
    e.classList.add("quick-tour-target"),
    (quickTourCurrentTargetEl = e));
}
function clearQuickTourForcedBoard() {
  quickTourForcedBoardEl &&
    (quickTourForcedBoardEl.classList.remove("quick-tour-force-actions"),
    (quickTourForcedBoardEl = null));
}
function syncQuickTourForcedBoard(e, t = {}, r = null) {
  if (!e || "add_link" !== e.id) return void clearQuickTourForcedBoard();
  let a = null;
  if (t.boardId) {
    const e = escapeCssAttributeValue(t.boardId);
    a = document.querySelector(`.board[data-board-id="${e}"]`);
  }
  (!a && r && (a = r.closest(".board")),
    a
      ? quickTourForcedBoardEl !== a &&
        (clearQuickTourForcedBoard(),
        a.classList.add("quick-tour-force-actions"),
        (quickTourForcedBoardEl = a))
      : clearQuickTourForcedBoard());
}
function getQuickTourBoardElement(e = {}) {
  if (e.boardId) {
    const t = escapeCssAttributeValue(e.boardId),
      r = document.querySelector(`.board[data-board-id="${t}"]`);
    if (r) return r;
  }
  return document.querySelector(".board");
}
function resolveQuickTourAddLinkState(e = {}) {
  const t = getQuickTourBoardElement(e),
    r =
      t?.querySelector(".inline-link-input") ||
      document.querySelector(".inline-link-input");
  return r
    ? r.classList.contains("state-loading")
      ? { stage: "loading", boardEl: t, targetEl: r, placement: "side" }
      : r.classList.contains("state-title")
        ? { stage: "finish", boardEl: t, targetEl: r, placement: "side" }
        : {
            stage: "url",
            boardEl: t,
            targetEl: r.querySelector(".url-input") || r,
            placement: "side",
          }
    : {
        stage: "button",
        boardEl: t,
        targetEl:
          t?.querySelector(".board-add-btn") ||
          document.querySelector(".board-add-btn"),
        placement: "auto",
      };
}
function resolveQuickTourStepState(e, t = {}) {
  if (!e?.id) return null;
  if ("create_board" === e.id) {
    let t = document.querySelector(".inline-board-input");
    if ((t || (t = document.querySelector(".add-board-placeholder")), !t)) {
      const e = Number.isInteger(currentPlaceholderColumn)
        ? currentPlaceholderColumn
        : Number.isInteger(lastActivePlaceholderColumn)
          ? lastActivePlaceholderColumn
          : 0;
      (showAddBoardPlaceholder(e),
        (t =
          document.querySelector(".add-board-placeholder") ||
          document.querySelector(`.column[data-column="${e}"]`) ||
          document.querySelector('.column[data-column="0"]')));
    }
    return {
      title: llT(e.titleKey),
      body: llT(e.bodyKey),
      targetEl: t,
      placement: "auto",
    };
  }
  if ("add_link" === e.id) {
    const r = resolveQuickTourAddLinkState(t);
    let a = llT("quickTour.stepAddLinkBody");
    return (
      "url" === r.stage
        ? (a = llT("quickTour.stepAddLinkUrl"))
        : "loading" === r.stage
          ? (a = llT("quickTour.stepAddLinkLoading"))
          : "finish" === r.stage && (a = llT("quickTour.stepAddLinkFinish")),
      {
        title: llT(e.titleKey),
        body: a,
        targetEl: r.targetEl,
        placement: r.placement,
      }
    );
  }
  return "open_wallpaper" === e.id
    ? {
        title: llT(e.titleKey),
        body: llT(e.bodyKey),
        targetEl: document.getElementById("floatingWallpaperBtn"),
        placement: "auto",
      }
    : {
        title: llT(e.titleKey),
        body: llT(e.bodyKey),
        targetEl: null,
        placement: "auto",
      };
}
function updateQuickTourPopoverContent(e, t) {
  if (!e || !t) return;
  const r = e.querySelector(".quick-tour-title"),
    a = e.querySelector(".quick-tour-body");
  (r && (r.textContent = t.title || ""), a && (a.textContent = t.body || ""));
}
function positionQuickTourPopover(e, t = "auto") {
  if (!quickTourPopoverEl || !e) return;
  const r = e.getBoundingClientRect();
  if (0 === r.width && 0 === r.height) return;
  ((quickTourPopoverEl.style.visibility = "hidden"),
    (quickTourPopoverEl.style.left = "0px"),
    (quickTourPopoverEl.style.top = "0px"));
  const a = quickTourPopoverEl.getBoundingClientRect();
  let o = (() => {
    let e = r.left,
      t = r.bottom + 12;
    if (
      (e + a.width > window.innerWidth - 8 &&
        (e = window.innerWidth - a.width - 8),
      e < 8 && (e = 8),
      t + a.height > window.innerHeight - 8)
    ) {
      const e = r.top - a.height - 12;
      t = e >= 8 ? e : Math.max(8, window.innerHeight - a.height - 8);
    }
    return { left: e, top: t };
  })();
  if ("side" === t) {
    const e = Math.max(8, window.innerHeight - a.height - 8),
      t = Math.min(Math.max(r.top, 8), e),
      n = r.right + 12,
      i = r.left - a.width - 12;
    n + a.width <= window.innerWidth - 8
      ? (o = { left: n, top: t })
      : i >= 8 && (o = { left: i, top: t });
  }
  ((quickTourPopoverEl.style.left = `${Math.round(o.left)}px`),
    (quickTourPopoverEl.style.top = `${Math.round(o.top)}px`),
    (quickTourPopoverEl.style.visibility = "visible"));
}
function escapeCssAttributeValue(e) {
  return "string" != typeof e
    ? ""
    : window.CSS && "function" == typeof window.CSS.escape
      ? window.CSS.escape(e)
      : e.replace(/["\\]/g, "\\$&");
}
async function renderQuickTourStep(e, t = {}) {
  if (!quickTourState.active || !e) return;
  const r = resolveQuickTourStepState(e, t),
    a = r?.targetEl || null;
  if (!a)
    return (
      clearQuickTourRetryTimeout(),
      quickTourState.retryCount >= 12
        ? (console.warn("[QuickTour] Could not resolve target for step:", e.id),
          void stopQuickTour("target_missing"))
        : ((quickTourState.retryCount += 1),
          void (quickTourRetryTimeoutId = setTimeout(() => {
            renderQuickTourStep(e, t).catch((e) => {
              (console.error("[QuickTour] Failed to render step:", e),
                stopQuickTour("render_error"));
            });
          }, 150)))
    );
  (clearQuickTourRetryTimeout(),
    (quickTourState.retryCount = 0),
    updateQuickTourPopoverContent(ensureQuickTourPopoverElement(), r),
    syncQuickTourForcedBoard(e, t, a),
    setQuickTourTargetHighlight(a),
    positionQuickTourPopover(a, r?.placement || "auto"));
}
function cleanupQuickTourRuntime() {
  (clearQuickTourRetryTimeout(),
    cancelQuickTourAnchorRefreshFrame(),
    quickTourEventUnsubscribe &&
      (quickTourEventUnsubscribe(), (quickTourEventUnsubscribe = null)),
    quickTourRepositionHandler &&
      (window.removeEventListener("resize", quickTourRepositionHandler),
      window.removeEventListener("scroll", quickTourRepositionHandler, !0),
      (quickTourRepositionHandler = null)),
    quickTourEscapeHandler &&
      (document.removeEventListener("keydown", quickTourEscapeHandler, !0),
      (quickTourEscapeHandler = null)),
    quickTourPointerMoveHandler &&
      (document.removeEventListener(
        "mousemove",
        quickTourPointerMoveHandler,
        !0,
      ),
      (quickTourPointerMoveHandler = null)),
    quickTourMutationObserver &&
      (quickTourMutationObserver.disconnect(),
      (quickTourMutationObserver = null)),
    clearQuickTourForcedBoard(),
    quickTourPopoverEl &&
      (quickTourPopoverEl.remove(), (quickTourPopoverEl = null)),
    clearQuickTourTargetHighlight());
}
function stopQuickTour(e = "dismissed") {
  (quickTourState.active || quickTourPopoverEl || quickTourCurrentTargetEl) &&
    ("onboarding" === quickTourState.source &&
      ["dismissed", "completed", "target_missing", "render_error"].includes(
        e,
      ) &&
      window.LumiListMobilePromotion?.completeOnboarding?.(
        quickTourState.userId,
      ),
    cleanupQuickTourRuntime(),
    (quickTourState = {
      active: !1,
      stepIndex: 0,
      retryCount: 0,
      source: null,
      userId: null,
      context: { boardId: null },
    }),
    "target_missing" === e &&
      console.warn(
        "[QuickTour] Stopped because target could not be resolved.",
      ));
}
async function startQuickTour(e = {}) {
  if ((stopQuickTour("restart"), "undefined" == typeof SyncManager)) return;
  if (!(await SyncManager.isLoggedIn()))
    return void showGlassToast(llT("quickTour.signIn"), "warning");
  if ("function" == typeof canModify && !canModify())
    return void showGlassToast(llT("quickTour.readOnly"), "warning");
  const t = await SyncManager.getStoredUser(),
    r = t?.id || null;
  if (!r) return void showGlassToast(llT("quickTour.signIn"), "warning");
  ((quickTourState = {
    active: !0,
    stepIndex: 0,
    retryCount: 0,
    source: e.source || "manual",
    userId: r,
    context: { boardId: null },
  }),
    (quickTourRepositionHandler = () => {
      scheduleQuickTourAnchorRefresh();
    }),
    window.addEventListener("resize", quickTourRepositionHandler),
    window.addEventListener("scroll", quickTourRepositionHandler, !0),
    (quickTourEscapeHandler = (e) => {
      "Escape" === e.key && quickTourState.active && stopQuickTour("dismissed");
    }),
    document.addEventListener("keydown", quickTourEscapeHandler, !0),
    (quickTourPointerMoveHandler = () => {
      scheduleQuickTourAnchorRefresh();
    }),
    document.addEventListener("mousemove", quickTourPointerMoveHandler, !0));
  const a = document.querySelector(".container");
  (a &&
    "undefined" != typeof MutationObserver &&
    ((quickTourMutationObserver = new MutationObserver(() => {
      scheduleQuickTourAnchorRefresh();
    })),
    quickTourMutationObserver.observe(a, {
      childList: !0,
      subtree: !0,
      attributes: !0,
      attributeFilter: ["class"],
    })),
    (quickTourEventUnsubscribe = onQuickTourEvent(async (e) => {
      if (quickTourState.active && e?.type)
        return 0 === quickTourState.stepIndex && "board_created" === e.type
          ? ((quickTourState.context.boardId = e.payload?.boardId || null),
            (quickTourState.stepIndex = 1),
            void (await renderQuickTourStep(
              QUICK_TOUR_STEPS[1],
              quickTourState.context,
            )))
          : 1 === quickTourState.stepIndex && "bookmark_created" === e.type
            ? ((quickTourState.stepIndex = 2),
              void (await renderQuickTourStep(
                QUICK_TOUR_STEPS[2],
                quickTourState.context,
              )))
            : void (
                2 === quickTourState.stepIndex &&
                "wallpaper_opened" === e.type &&
                (shouldPersistQuickTourCompletion(quickTourState.source) &&
                  (await markQuickTourCompletedForUser(quickTourState.userId)),
                stopQuickTour("completed"),
                showGlassToast(llT("quickTour.done"), "success"))
              );
    })),
    await renderQuickTourStep(QUICK_TOUR_STEPS[0], quickTourState.context));
}
async function checkShowOnboarding(e = !1) {
  try {
    const t =
        (await chrome.storage.local.get("lumilist_user")).lumilist_user || null,
      r = t?.id;
    if (!r) return;
    const a = getOnboardingSeenStorageKey(r);
    if (!isFreshOnboardingAccount(t))
      return (
        await markOnboardingSeenForUser(r),
        await window.LumiListMobilePromotion?.completeOnboarding?.(r),
        void clearPendingOnboardingOpen()
      );
    if (
      (await refreshRuntimeSubscriptionStateFromStorage(),
      await shouldSuppressOnboardingForSubscriptionStateAsync())
    )
      return;
    if ((await chrome.storage.local.get(a))[a])
      document
        .getElementById("onboardingModal")
        ?.classList.contains("active") ||
        quickTourState.active ||
        (await window.LumiListMobilePromotion?.completeOnboarding?.(r));
    else {
      const t = `lumilist_onboarding_owner_${r}`,
        o = (await chrome.storage.local.get(t))[t],
        n = 3e4;
      if (
        o &&
        o.userId === r &&
        o.tabId &&
        o.tabId !== TAB_INSTANCE_ID &&
        !(Date.now() - (o.timestamp || 0) > n)
      ) {
        if (!_onboardingRetryTimeoutId) {
          const e = await chrome.storage.local.get(
              "lumilist_login_sync_complete",
            ),
            t = e?.lumilist_login_sync_complete;
          if (t?.userId === r && "created_home" === t?.action) {
            const e = n - (Date.now() - (o.timestamp || 0)),
              t = Math.max(e + 50, 50);
            _onboardingRetryTimeoutId = setTimeout(() => {
              ((_onboardingRetryTimeoutId = null), checkShowOnboarding(!0));
            }, t);
          }
        }
        return;
      }
      const i = { userId: r, tabId: TAB_INSTANCE_ID, timestamp: Date.now() };
      await chrome.storage.local.set({ [t]: i });
      const s = (await chrome.storage.local.get(t))[t];
      if (!s || s.tabId !== TAB_INSTANCE_ID) return;
      if ((await db.bookmarks.filter((e) => !e.deletedAt).count()) > 0)
        return (
          await markOnboardingSeenForUser(r),
          await window.LumiListMobilePromotion?.completeOnboarding?.(r),
          void (await chrome.storage.local.remove(t))
        );
      if (!e) {
        const e = await SyncManager.checkServerHasData();
        if (!1 !== e)
          return (
            !0 === e &&
              (await markOnboardingSeenForUser(r),
              await window.LumiListMobilePromotion?.completeOnboarding?.(r)),
            void (await chrome.storage.local.remove(t))
          );
      }
      (_onboardingOpenTimeoutId &&
        (clearTimeout(_onboardingOpenTimeoutId),
        (_onboardingOpenTimeoutId = null)),
        (_onboardingOpenTimeoutId = setTimeout(async () => {
          _onboardingOpenTimeoutId = null;
          try {
            const e = await chrome.storage.local.get(["lumilist_user", t]),
              o = e?.lumilist_user?.id || null,
              n = e?.[t];
            if (o !== r) return;
            if (!n || n.tabId !== TAB_INSTANCE_ID) return;
            if (
              _crossTabLoginInProgress ||
              document.body?.classList?.contains("not-authenticated")
            )
              return;
            if (
              (await refreshRuntimeSubscriptionStateFromServerForOnboarding(),
              await shouldSuppressOnboardingForSubscriptionStateAsync())
            )
              return void (await chrome.storage.local.remove(t));
            const i = getOnboardingInitialStep();
            if (!openOnboardingModal({ step: i }))
              return void (await chrome.storage.local.remove(t));
            ("welcome" === i && (await chrome.storage.local.set({ [a]: !0 })),
              await chrome.storage.local.remove(t));
          } catch (e) {
            console.error("Failed to open delayed onboarding modal:", e);
          }
        }, 500)));
    }
  } catch (e) {
    console.error("Error checking onboarding status:", e);
  }
}
const FAVICON_CACHE_EXPIRY_MS = 6048e5,
  FAVICON_MISSING_CACHE_EXPIRY_MS = 9e5,
  FAVICON_COMPRESS_THRESHOLD = 5e3,
  FAVICON_TARGET_SIZE = 32,
  FAVICON_WEBP_QUALITY = 0.8,
  MAX_FAVICON_CACHE_ENTRIES = 2e3,
  FAVICON_SELECTION_POLICY_VERSION = "extension-first-valid-v4",
  pendingFaviconResolutions = new Map(),
  pendingFaviconDataFetches = new Map(),
  pendingLinkTagLookups = new Map(),
  pendingFaviconResolutionQueue = [],
  FAVICON_CANDIDATE_FETCH_TIMEOUT_MS = 5e3,
  FAVICON_LINK_TAG_LOOKUP_TIMEOUT_MS = 5500,
  FAVICON_RESOLUTION_MAX_MS = 15e3,
  FAVICON_RESOLUTION_CONCURRENCY = 4,
  FAVICON_PRESENTATION_MAX_LOADING_MS = 6e3;
let activeFaviconResolutionCount = 0;
function isRetryableFaviconHttpStatus(e) {
  return 408 === e || 425 === e || 429 === e || (e >= 500 && e <= 599);
}
function isTransientFaviconFailureMessage(e) {
  const t = String(e || "")
    .trim()
    .toLowerCase();
  if (!t) return !0;
  const r = t.match(/status\s+(\d{3})/);
  return r
    ? isRetryableFaviconHttpStatus(Number(r[1]))
    : [
        "timed out",
        "timeout",
        "failed to fetch",
        "networkerror",
        "network request failed",
        "message port closed",
        "receiving end does not exist",
        "could not establish connection",
        "extension context invalidated",
        "service worker",
        "aborterror",
        "aborted",
      ].some((e) => t.includes(e));
}
function shouldCacheMissingFaviconResult(e) {
  return !!e && !0 !== e.transientFailure;
}
function runWithFaviconResolutionSlot(e) {
  return new Promise((t, r) => {
    const startTask = () => {
      (activeFaviconResolutionCount++,
        Promise.resolve()
          .then(e)
          .then(t, r)
          .finally(() => {
            activeFaviconResolutionCount = Math.max(
              0,
              activeFaviconResolutionCount - 1,
            );
            const e = pendingFaviconResolutionQueue.shift();
            "function" == typeof e && e();
          }));
    };
    activeFaviconResolutionCount < 4
      ? startTask()
      : pendingFaviconResolutionQueue.push(startTask);
  });
}
async function fetchLinkTagIconCandidates(e, t, r, a = 5500) {
  if (!navigator.onLine) return { icons: [], transientFailure: !0 };
  if (!e || !t) return { icons: [], transientFailure: !1 };
  if (pendingLinkTagLookups.has(t)) return pendingLinkTagLookups.get(t);
  const o = (async () => {
    let o = !1;
    try {
      const t = await chrome.runtime.sendMessage({
        action: "fetchFaviconLinksFromPage",
        url: e,
        timeoutMs: a,
      });
      if (t?.success && Array.isArray(t.icons))
        return {
          icons: t.icons.filter(
            (e) => "string" == typeof e && /^https?:\/\//i.test(e),
          ),
          transientFailure: !1,
        };
      o = !t || !t.error || isTransientFaviconFailureMessage(t.error);
    } catch (e) {
      ((o = !0),
        console.warn(
          "[Favicon] Link-tag icon lookup failed for",
          r || t,
          e?.message,
        ));
    } finally {
      pendingLinkTagLookups.delete(t);
    }
    return { icons: [], transientFailure: o };
  })();
  return (pendingLinkTagLookups.set(t, o), o);
}
function compressFavicon(e) {
  return new Promise((t, r) => {
    const a = new Image();
    ((a.onload = () => {
      try {
        const e = document.createElement("canvas");
        ((e.width = 32),
          (e.height = 32),
          e.getContext("2d").drawImage(a, 0, 0, 32, 32));
        const r = e.toDataURL("image/webp", 0.8);
        t(r);
      } catch (e) {
        r(e);
      }
    }),
      (a.onerror = () => r(new Error("Failed to load image for compression"))),
      (a.src = e));
  });
}
async function getCachedFavicon(e) {
  try {
    const t = await db.favicons.get(e);
    if (t) {
      const r = Date.now() - (t.timestamp || 0),
        a = !0 === t.failed ? 9e5 : 6048e5;
      if (r >= 0 && r < a)
        return !0 === t.failed
          ? { missing: !0 }
          : FAVICON_SELECTION_POLICY_VERSION !== t.selectionPolicy
            ? (await db.favicons.delete(e), null)
            : t.data && !t.data.startsWith("data:image/")
              ? (console.warn(
                  `[Favicon] Corrupted cache data for ${e}, deleting`,
                ),
                await db.favicons.delete(e),
                null)
              : t.data || t.url
                ? { data: t.data || null, url: t.url || null }
                : null;
      await db.favicons.delete(e);
    }
  } catch (e) {
    console.error("Favicon cache read error:", e);
  }
  return null;
}
async function cacheFavicon(e, t, r = null) {
  const a = {
    id: e,
    url: t,
    timestamp: Date.now(),
    failed: !1,
    selectionPolicy: FAVICON_SELECTION_POLICY_VERSION,
  };
  try {
    if ((await db.favicons.count()) >= 2e3) {
      const e = Math.floor(200),
        t = await db.favicons.orderBy("timestamp").limit(e).toArray();
      t.length > 0 && (await db.favicons.bulkDelete(t.map((e) => e.id)));
    }
    if (r)
      if (r.length > 5e3)
        try {
          const e = await compressFavicon(r);
          a.data = e;
        } catch (e) {
          r.length <= 1e4 && (a.data = r);
        }
      else a.data = r;
    await db.favicons.put(a);
  } catch (e) {
    if ("QuotaExceededError" === e.name)
      try {
        const e = Math.floor(400),
          t = await db.favicons.orderBy("timestamp").limit(e).toArray();
        return (
          await db.favicons.bulkDelete(t.map((e) => e.id)),
          void (await db.favicons.put(a))
        );
      } catch (e) {
        console.error("Favicon cache write failed even after cleanup:", e);
      }
    else console.error("Favicon cache write error:", e);
  }
}
async function cacheMissingFavicon(e) {
  const t = { id: e, failed: !0, timestamp: Date.now() };
  try {
    if ((await db.favicons.count()) >= 2e3) {
      const e = Math.floor(200),
        t = await db.favicons.orderBy("timestamp").limit(e).toArray();
      t.length > 0 && (await db.favicons.bulkDelete(t.map((e) => e.id)));
    }
    await db.favicons.put(t);
  } catch (e) {
    if ("QuotaExceededError" === e.name)
      try {
        const e = Math.floor(400),
          r = await db.favicons.orderBy("timestamp").limit(e).toArray();
        return (
          await db.favicons.bulkDelete(r.map((e) => e.id)),
          void (await db.favicons.put(t))
        );
      } catch (e) {
        console.error("Favicon missing-cache write failed after cleanup:", e);
      }
    else console.error("Favicon missing-cache write error:", e);
  }
}
async function cleanupExpiredFavicons() {
  try {
    const e = Date.now(),
      t = await db.favicons
        .filter((t) => {
          const r = t.timestamp || 0,
            a = e - r,
            o = !0 === t.failed ? 9e5 : 6048e5;
          return r <= 0 || a < 0 || a >= o;
        })
        .toArray();
    t.length > 0 && (await db.favicons.bulkDelete(t.map((e) => e.id)));
  } catch (e) {
    console.error("Favicon cleanup error:", e);
  }
}
const MULTI_PART_TLDS = [
  "co.uk",
  "org.uk",
  "gov.uk",
  "ac.uk",
  "me.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.nz",
  "org.nz",
  "co.jp",
  "ne.jp",
  "or.jp",
  "com.br",
  "org.br",
  "co.in",
  "org.in",
  "net.in",
  "co.za",
  "com.mx",
  "co.kr",
];
function getRootDomain(e) {
  const t = e.split(".");
  if (t.length <= 2) return null;
  const r = t.slice(-2).join(".");
  return MULTI_PART_TLDS.includes(r)
    ? t.length <= 3
      ? null
      : t.slice(-3).join(".")
    : t.slice(-2).join(".");
}
function getFaviconCacheKey(e, t = null) {
  if (!e || !e.hostname) return null;
  const r = e.hostname.toLowerCase();
  if (t && t.includes("/")) {
    const e = t.split("/"),
      a = e[0],
      o = e.slice(1).join("/");
    if (o && (r === a || r.endsWith("." + a))) return `${r}/${o}`;
  }
  return r;
}
async function fetchFaviconDataUrlCandidate(e, t = 5e3) {
  if (!navigator.onLine)
    return { data: null, error: "Offline", transientFailure: !0 };
  if (!e || "string" != typeof e)
    return { data: null, error: "Invalid icon URL", transientFailure: !1 };
  if (!/^https?:\/\//i.test(e))
    return { data: null, error: "Invalid icon protocol", transientFailure: !1 };
  if (pendingFaviconDataFetches.has(e)) return pendingFaviconDataFetches.get(e);
  const r = (async () => {
    try {
      const r = await chrome.runtime.sendMessage({
        action: "fetchFaviconAsBase64",
        url: e,
        timeoutMs: t,
      });
      if (
        r?.success &&
        "string" == typeof r.data &&
        r.data.startsWith("data:image/")
      )
        return { data: r.data, error: null, transientFailure: !1 };
      const a = "string" == typeof r?.error ? r.error : "";
      return {
        data: null,
        error: a,
        transientFailure: !r || !a || isTransientFaviconFailureMessage(a),
      };
    } catch (e) {
      return {
        data: null,
        error: e?.message || String(e || ""),
        transientFailure: !0,
      };
    } finally {
      pendingFaviconDataFetches.delete(e);
    }
  })();
  return (pendingFaviconDataFetches.set(e, r), r);
}
async function resolveFaviconFromCandidateChain({
  pageUrl: e,
  faviconCacheKey: t,
  hostnameForLog: r,
  initialCandidates: a,
  directAttemptCount: o,
  maxDurationMs: n = FAVICON_RESOLUTION_MAX_MS,
}) {
  if (!navigator.onLine)
    return { data: null, sourceUrl: null, transientFailure: !0 };
  const i = Array.isArray(a)
    ? Array.from(
        new Set(
          a.filter((e) => "string" == typeof e && /^https?:\/\//i.test(e)),
        ),
      )
    : [];
  if (0 === i.length)
    return { data: null, sourceUrl: null, transientFailure: !1 };
  const s = Math.max(
      1500,
      Math.min(Number(n) || FAVICON_RESOLUTION_MAX_MS, 2e4),
    ),
    l = Date.now() + s;
  let c = 0,
    d = !1;
  const u = Math.max(0, Number(o) || 0);
  let p = !1;
  for (; c < i.length && Date.now() < l; ) {
    if (!d && c >= u) {
      d = !0;
      try {
        const a = l - Date.now();
        if (a <= 0) break;
        const o = Math.max(1e3, Math.min(5500, a)),
          n = await fetchLinkTagIconCandidates(e, t, r, o);
        n?.transientFailure && (p = !0);
        const s = (Array.isArray(n?.icons) ? n.icons : []).filter(
          (e) => !i.includes(e),
        );
        s.length > 0 && i.splice(c, 0, ...s);
      } catch (e) {}
    }
    const a = i[c],
      o = l - Date.now();
    if (o <= 0) break;
    const n = Math.max(1e3, Math.min(5e3, o)),
      s = await fetchFaviconDataUrlCandidate(a, n);
    if (s?.data) return { data: s.data, sourceUrl: a, transientFailure: !1 };
    (s?.transientFailure && (p = !0), c++);
  }
  const m = c < i.length && Date.now() >= l;
  return { data: null, sourceUrl: null, transientFailure: p || m };
}
function resolveFaviconForCacheKeyOnce(e, t) {
  if (!e || "function" != typeof t) return Promise.resolve(null);
  if (pendingFaviconResolutions.has(e)) return pendingFaviconResolutions.get(e);
  const r = (async () => {
    try {
      return await t();
    } finally {
      pendingFaviconResolutions.delete(e);
    }
  })();
  return (pendingFaviconResolutions.set(e, r), r);
}
function buildGooglePathVariants(e) {
  const t = String(e || "/")
    .split("/")
    .filter(Boolean);
  if (0 === t.length) return ["/"];
  const r = [],
    a = new Set(),
    o = [t];
  for (; o.length > 0; ) {
    const e = o.shift(),
      t = "/" + e.join("/");
    a.has(t) ||
      (a.add(t),
      r.push(t),
      e.length >= 2 && "u" === e[0] && /^\d+$/.test(e[1]) && o.push(e.slice(2)),
      e.length >= 2 && "a" === e[0] && e[1] && o.push(e.slice(2)),
      e.length >= 3 &&
        "u" === e[1] &&
        /^\d+$/.test(e[2]) &&
        o.push([e[0], ...e.slice(3)]),
      e.length >= 3 && "a" === e[1] && e[2] && o.push([e[0], ...e.slice(3)]));
  }
  return r;
}
function matchesGoogleProductPattern(e, t) {
  if (!e || !e.hostname || !t) return !1;
  const r = t.split("/"),
    a = r[0],
    o = r.slice(1).join("/"),
    n = e.hostname.toLowerCase();
  if (n !== a && !n.endsWith("." + a)) return !1;
  if (!o) return !0;
  const i = "/" + o;
  return buildGooglePathVariants(e.pathname).some(
    (e) => e === i || e.startsWith(i + "/"),
  );
}
function getGoogleProductFaviconMatch(e, t) {
  if (!e || !t || "object" != typeof t)
    return { googleFavicon: null, matchedGooglePattern: null };
  for (const [r, a] of Object.entries(t))
    if (matchesGoogleProductPattern(e, r))
      return { googleFavicon: a, matchedGooglePattern: r };
  return { googleFavicon: null, matchedGooglePattern: null };
}
async function createFaviconElement(e, t = "") {
  const r = document.createElement("div");
  let a, o, n;
  ((r.className = "favicon"), r.classList.add("favicon-loading"));
  try {
    ((a = new URL(e)), (o = a.hostname), (n = a.protocol));
  } catch (e) {
    return ((r.className = "favicon-fallback"), r);
  }
  if (
    [
      "chrome:",
      "chrome-extension:",
      "file:",
      "about:",
      "data:",
      "javascript:",
      "blob:",
    ].includes(n) ||
    ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(o) ||
    o.endsWith(".local") ||
    o.endsWith(".localhost") ||
    !o.includes(".")
  )
    return ((r.className = "favicon-fallback"), r);
  const i = document.createElement("img");
  ((i.alt = ""),
    i.addEventListener("load", () => {
      (clearTimeout(s), r.classList.remove("favicon-loading"));
    }),
    r.appendChild(i));
  const s = setTimeout(() => {
      r.classList.contains("favicon-loading") &&
        ((r.className = "favicon-fallback"), i.remove());
    }, FAVICON_PRESENTATION_MAX_LOADING_MS),
    { googleFavicon: l, matchedGooglePattern: c } =
      getGoogleProductFaviconMatch(a, {
        "docs.google.com/spreadsheets":
          "https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico",
        "docs.google.com/document":
          "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico",
        "docs.google.com/presentation":
          "https://ssl.gstatic.com/docs/presentations/images/favicon5.ico",
        "docs.google.com/forms":
          "https://ssl.gstatic.com/docs/forms/device_home/android_192.png",
        "docs.google.com":
          "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico",
        "sheets.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/sheets_48dp.png",
        "slides.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/slides_48dp.png",
        "forms.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/forms_48dp.png",
        "chromewebstore.google.com":
          "https://ssl.gstatic.com/chrome/webstore/images/icon_96px.png",
        "console.firebase.google.com":
          "https://www.gstatic.com/mobilesdk/240501_mobilesdk/firebase_96dp.png",
        "drive.google.com":
          "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
        "calendar.google.com":
          "https://ssl.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png",
        "meet.google.com":
          "https://ssl.gstatic.com/images/branding/product/2x/meet_2020q4_48dp.png",
        "chat.google.com":
          "https://ssl.gstatic.com/images/branding/product/2x/chat_2020q4_48dp.png",
        "keep.google.com":
          "https://ssl.gstatic.com/images/branding/product/2x/keep_2020q4_48dp.png",
        "photos.google.com":
          "https://ssl.gstatic.com/images/branding/product/2x/photos_48dp.png",
        "maps.google.com":
          "https://www.gstatic.com/images/branding/product/2x/maps_48dp.png",
        "translate.google.com":
          "https://ssl.gstatic.com/images/branding/product/2x/translate_48dp.png",
        "news.google.com":
          "https://www.gstatic.com/images/branding/product/2x/news_48dp.png",
        "finance.google.com":
          "https://www.gstatic.com/finance/favicon/finance_496x496.png",
        "mail.google.com":
          "https://ssl.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png",
        "books.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/play_books_48dp.png",
        "patents.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/patents_48dp.png",
        "music.youtube.com": "https://music.youtube.com/img/favicon_48.png",
        "youtube.com":
          "https://www.gstatic.com/youtube/img/branding/favicon/favicon_144x144.png",
        "store.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/gstore_48dp.png",
        "cloud.google.com":
          "https://www.gstatic.com/images/branding/product/1x/google_cloud_48dp.png",
        "mapsplatform.google.com":
          "https://mapsplatform.google.com/static/images/gmp_favicon_32px_2x.png",
        "play.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/play_prism_48dp.png",
        "colab.research.google.com":
          "https://colab.research.google.com/img/colab_favicon_256px.png",
        "ai.google.dev":
          "https://www.gstatic.com/devrel-devsite/prod/v5ecaab6967af5bdfffc1b93fe7d0ad58c271bf9f563243cec25f323a110134f0/googledevai/images/touchicon-180-new.png",
        "aistudio.google.com":
          "https://www.gstatic.com/aistudio/ai_studio_favicon_2_96x96.png",
        "gemini.google.com":
          "https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png",
        "notebooklm.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/notebooklm_48dp.png",
        "deepmind.google.com":
          "https://storage.googleapis.com/gdm-deepmind-com-prod-public/icons/google_deepmind_2x_96dp.png",
        "fonts.google.com":
          "https://www.gstatic.com/images/branding/product/1x/google_fonts_64dp.png",
        "artsandculture.google.com":
          "https://www.gstatic.com/culturalinstitute/stella/favicon-32x32-v1.png",
        "contacts.google.com":
          "https://www.gstatic.com/images/branding/product/1x/contacts_2022_48dp.png",
        "support.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/support_48dp.png",
        "passwords.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/password_manager_48dp.png",
        "myaccount.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/identity_48dp.png",
        "account.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/identity_48dp.png",
        "groups.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/groups_48dp.png",
        "sites.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/sites_48dp.png",
        "voice.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/voice_2020q4_48dp.png",
        "earth.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/earth_48dp.png",
        "one.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/one_48dp.png",
        "fi.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/fi_48dp.png",
        "ads.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/ads_48dp.png",
        "analytics.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/analytics_48dp.png",
        "podcasts.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/podcasts_48dp.png",
        "classroom.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/classroom_48dp.png",
        "tasks.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/tasks_48dp.png",
        "jamboard.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/jamboard_48dp.png",
        "assistant.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/assistant_48dp.png",
        "currents.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/currents_48dp.png",
        "blogger.com":
          "https://ssl.gstatic.com/images/branding/product/1x/blogger_48dp.png",
        "shopping.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/shopping_48dp.png",
        "trends.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/trends_48dp.png",
        "pay.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/pay_48dp.png",
        "admin.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/admin_48dp.png",
        "scholar.google.com": "https://scholar.google.com/favicon.ico",
        "search.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/search_console_48dp.png",
        "datastudio.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/data_studio_48dp.png",
        "lookerstudio.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/data_studio_48dp.png",
        "messages.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/messages_48dp.png",
        "youtubekids.com":
          "https://ssl.gstatic.com/images/branding/product/1x/youtube_kids_48dp.png",
        "travel.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/travel_48dp.png",
        "waze.com":
          "https://ssl.gstatic.com/images/branding/product/1x/waze_48dp.png",
        "tv.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/google_tv_48dp.png",
        "adsense.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/adsense_48dp.png",
        "lens.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/lens_48dp.png",
        "alerts.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/alerts_48dp.png",
        "play.google.com/store/books":
          "https://ssl.gstatic.com/images/branding/product/1x/play_books_48dp.png",
        "play.google.com/store/movies":
          "https://ssl.gstatic.com/images/branding/product/1x/play_movies_48dp.png",
        "home.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/google_home_48dp.png",
        "vids.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/vids_48dp.png",
        "recaptcha.net":
          "https://ssl.gstatic.com/images/branding/product/1x/recaptcha_48dp.png",
        "script.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/apps_script_48dp.png",
        "domains.google":
          "https://ssl.gstatic.com/images/branding/product/1x/domains_48dp.png",
        "domains.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/domains_48dp.png",
        "merchants.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/merchant_center_48dp.png",
        "wallet.google":
          "https://ssl.gstatic.com/images/branding/product/1x/wallet_48dp.png",
        "files.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/files_48dp.png",
        "admob.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/admob_48dp.png",
        "firebase.google.com":
          "https://www.gstatic.com/images/branding/product/1x/firebase_48dp.png",
        "flutter.dev":
          "https://ssl.gstatic.com/images/branding/product/1x/flutter_48dp.png",
        "wearos.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/wear_os_48dp.png",
        "developer.android.com":
          "https://ssl.gstatic.com/images/branding/product/1x/android_studio_48dp.png",
        "play.google.com/googleplaygames":
          "https://ssl.gstatic.com/images/branding/product/1x/play_games_48dp.png",
        "optimize.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/optimize_48dp.png",
        "marketingplatform.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/marketing_platform_48dp.png",
        "families.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/family_link_48dp.png",
        "hangouts.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/hangouts_48dp.png",
        "duo.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/duo_48dp.png",
        "fitbit.com":
          "https://ssl.gstatic.com/images/branding/product/1x/fitbit_48dp.png",
        "studio.youtube.com":
          "https://ssl.gstatic.com/images/branding/product/1x/youtube_studio_48dp.png",
        "developers.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/google_developers_48dp.png",
        "admanager.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/admanager_48dp.png",
        "www.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/googleg_48dp.png",
        "google.com/maps/streetview":
          "https://ssl.gstatic.com/images/branding/product/1x/streetview_48dp.png",
        "chrome.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/chrome_48dp.png",
        "vault.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/vault_48dp.png",
        "appsheet.com":
          "https://ssl.gstatic.com/images/branding/product/1x/appsheet_48dp.png",
        "cloudsearch.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/cloud_search_48dp.png",
        "idx.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/idx_48dp.png",
        "pagespeed.web.dev":
          "https://ssl.gstatic.com/images/branding/product/1x/pagespeed_48dp.png",
        "docs.google.com/drawings":
          "https://ssl.gstatic.com/images/branding/product/1x/drawings_48dp.png",
        "chromecast.com":
          "https://ssl.gstatic.com/images/branding/product/1x/chromecast_48dp.png",
        "android.com/tv":
          "https://ssl.gstatic.com/images/branding/product/1x/android_tv_48dp.png",
        "localguides.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/local_guides_48dp.png",
        "stadia.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/stadia_48dp.png",
        "authenticator.google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/authenticator_48dp.png",
        "gboard.app":
          "https://ssl.gstatic.com/images/branding/product/1x/gboard_48dp.png",
        "google.com":
          "https://ssl.gstatic.com/images/branding/product/1x/googleg_48dp.png",
        "leetcode.com":
          "https://assets.leetcode.com/static_assets/public/icons/favicon-32x32.png",
        "jecrcuniversity.edu.in":
          "https://www.google.com/s2/favicons?sz=64&domain=jecrcuniversity.edu.in",
        google:
          "https://ssl.gstatic.com/images/branding/product/1x/googleg_48dp.png",
      });
  let d, u;
  const p = getFaviconCacheKey(a, c) || o;
  if (l)
    ((d = [
      l,
      `https://icons.duckduckgo.com/ip3/${o}.ico`,
      `https://www.google.com/s2/favicons?sz=32&domain=${o}`,
    ]),
      (u = 1));
  else {
    const e = getRootDomain(o);
    e
      ? ((d = [
          `https://${o}/favicon.ico`,
          `https://${e}/favicon.ico`,
          `https://icons.duckduckgo.com/ip3/${e}.ico`,
          `https://icons.duckduckgo.com/ip3/${o}.ico`,
          `https://www.google.com/s2/favicons?sz=32&domain=${e}`,
          `https://www.google.com/s2/favicons?sz=32&domain=${o}`,
        ]),
        (u = 2))
      : ((d = [
          `https://${o}/favicon.ico`,
          `https://icons.duckduckgo.com/ip3/${o}.ico`,
          `https://www.google.com/s2/favicons?sz=32&domain=${o}`,
        ]),
        (u = 1));
  }
  let m = !1,
    g = !1,
    f = !1;
  const h = Array.from(d);
  async function resolveAndApplyFavicon() {
    if (g) return { applied: !1, transientFailure: !0 };
    if (!navigator.onLine) return { applied: !1, transientFailure: !0 };
    g = !0;
    try {
      const t = await resolveFaviconForCacheKeyOnce(p, async () =>
        runWithFaviconResolutionSlot(async () => {
          const t = Array.from(h),
            r =
              "string" == typeof i.dataset.cachedUrl
                ? i.dataset.cachedUrl.trim()
                : "";
          return (
            r &&
              /^https?:\/\//i.test(r) &&
              !f &&
              (t.includes(r) || t.unshift(r)),
            resolveFaviconFromCandidateChain({
              pageUrl: e,
              faviconCacheKey: p,
              hostnameForLog: o,
              initialCandidates: t,
              directAttemptCount: u,
              maxDurationMs: FAVICON_RESOLUTION_MAX_MS,
            })
          );
        }),
      );
      return t?.data
        ? ((r.className = "favicon favicon-loading"),
          i.parentNode || r.appendChild(i),
          (i.dataset.cachedData = t.data),
          t.sourceUrl &&
            ((i.dataset.cachedUrl = t.sourceUrl),
            cacheFavicon(p, t.sourceUrl, t.data)),
          (i.src = t.data),
          (f = !1),
          { applied: !0, transientFailure: !1 })
        : { applied: !1, transientFailure: !0 === t?.transientFailure };
    } finally {
      g = !1;
    }
  }
  async function applyFallbackState({ cacheMissing: e = !0 } = {}) {
    (clearTimeout(s),
      (r.className = "favicon-fallback"),
      i.parentNode && i.remove(),
      e && (await cacheMissingFavicon(p)));
  }
  i.onerror = async () => {
    if (m) return void (await applyFallbackState());
    ((m = !0), (f = !0));
    try {
      await db.favicons.delete(p);
    } catch (e) {
      console.error("Failed to delete stale favicon cache:", e);
    }
    const e = await resolveAndApplyFavicon();
    e?.applied ||
      (await applyFallbackState({
        cacheMissing: shouldCacheMissingFaviconResult(e),
      }));
  };
  let y = await getCachedFavicon(p);
  if (l && y && !y.missing) {
    const e = "string" == typeof y.url ? y.url : "";
    let t = !1;
    try {
      if (e) {
        const r = new URL(e),
          a = new URL(l);
        t = r.origin === a.origin && r.pathname === a.pathname;
      }
    } catch (r) {
      t = e === l;
    }
    if (!t) {
      try {
        await db.favicons.delete(p);
      } catch (e) {
        console.warn(
          "[Favicon] Failed to clear stale Google favicon cache for",
          p,
          e?.message,
        );
      }
      y = null;
    }
  }
  if (y) {
    if (y.missing)
      if (l) {
        try {
          await db.favicons.delete(p);
        } catch (e) {
          console.warn(
            "[Favicon] Failed to clear stale mapped favicon cache for",
            p,
            e?.message,
          );
        }
        y = null;
      } else return ((r.className = "favicon-fallback"), i.remove(), r);
  }
  if (y) {
    if (y.data)
      return (
        (i.dataset.cachedData = y.data),
        (i.dataset.cachedUrl = y.url || y.data),
        (i.src = y.data),
        r
      );
    y.url && (i.dataset.cachedUrl = y.url);
  }
  return (
    (async () => {
      const e = await resolveAndApplyFavicon();
      e?.applied ||
        (await applyFallbackState({
          cacheMissing: shouldCacheMissingFaviconResult(e),
        }));
    })(),
    r
  );
}
async function loadTruncateTitlesSetting(e = null) {
  try {
    const t =
      !1 !==
      (e && "object" == typeof e
        ? e
        : await chrome.storage.local.get(["truncateTitles"])
      ).truncateTitles;
    applyTruncateTitlesSetting(t);
    const r = document.getElementById("truncateTitlesToggle");
    r && (r.checked = t);
  } catch (e) {
    console.error("Failed to load truncate titles setting:", e);
  }
}
async function handleTruncateTitlesToggle(e) {
  if (!canMutateAccountScopedPreferences())
    return void (await loadTruncateTitlesSetting());
  const t = e.target.checked;
  try {
    (await chrome.storage.local.set({ truncateTitles: t }),
      applyTruncateTitlesSetting(t));
  } catch (e) {
    console.error("Failed to save truncate titles setting:", e);
  }
}
function applyTruncateTitlesSetting(e) {
  e
    ? document.body.classList.remove("full-title-mode")
    : document.body.classList.add("full-title-mode");
}
let openLinksInNewTab = !1;
async function loadOpenInNewTabSetting(e = null) {
  try {
    const t =
      e && "object" == typeof e
        ? e
        : await chrome.storage.local.get(["openInNewTab"]);
    ((openLinksInNewTab = !0 === t.openInNewTab),
      applyOpenInNewTabSetting(openLinksInNewTab));
    const r = document.getElementById("openInNewTabToggle");
    r && (r.checked = openLinksInNewTab);
  } catch (e) {
    console.error("Failed to load open in new tab setting:", e);
  }
}
async function handleOpenInNewTabToggle(e) {
  if (canMutateAccountScopedPreferences()) {
    openLinksInNewTab = e.target.checked;
    try {
      (await chrome.storage.local.set({ openInNewTab: openLinksInNewTab }),
        applyOpenInNewTabSetting(openLinksInNewTab),
        await refreshSearchIfOpen());
    } catch (e) {
      console.error("Failed to save open in new tab setting:", e);
    }
  } else await loadOpenInNewTabSetting();
}
function applyOpenInNewTabSetting(e) {
  document.querySelectorAll(".board-links a").forEach((t) => {
    e
      ? (t.setAttribute("target", "_blank"),
        t.setAttribute("rel", "noopener noreferrer"))
      : (t.removeAttribute("target"), t.removeAttribute("rel"));
  });
}
async function loadShowBookmarkNotesSetting(e = null) {
  try {
    const t =
      e && "object" == typeof e
        ? e
        : await chrome.storage.local.get(["showBookmarkNotes"]);
    ((showBookmarkNotes = !1 !== t.showBookmarkNotes),
      applyShowBookmarkNotesSetting(showBookmarkNotes));
    const r = document.getElementById("showBookmarkNotesToggle");
    r && (r.checked = showBookmarkNotes);
  } catch (e) {
    console.error("Failed to load bookmark notes visibility setting:", e);
  }
}
async function handleShowBookmarkNotesToggle(e) {
  if (canMutateAccountScopedPreferences()) {
    showBookmarkNotes = e.target.checked;
    try {
      (await chrome.storage.local.set({
        [SHOW_BOOKMARK_NOTES_STORAGE_KEY]: showBookmarkNotes,
      }),
        applyShowBookmarkNotesSetting(showBookmarkNotes));
    } catch (e) {
      console.error("Failed to save bookmark notes visibility setting:", e);
    }
  } else await loadShowBookmarkNotesSetting();
}
function applyShowBookmarkNotesSetting(e) {
  document.body.classList.toggle("show-bookmark-notes", !0 === e);
}
async function loadCloseTabsAfterSaveAllTabsSetting(e = null) {
  try {
    const t =
      e && "object" == typeof e
        ? e
        : await chrome.storage.local.get(["closeTabsAfterSaveAllTabs"]);
    closeTabsAfterSaveAllTabsEnabled = !0 === t.closeTabsAfterSaveAllTabs;
    const r = document.getElementById("closeTabsAfterSaveAllToggle");
    r && (r.checked = closeTabsAfterSaveAllTabsEnabled);
  } catch (e) {
    console.error("Failed to load close-tabs-after-save-all setting:", e);
  }
}
async function handleCloseTabsAfterSaveAllTabsToggle(e) {
  if (canMutateAccountScopedPreferences()) {
    closeTabsAfterSaveAllTabsEnabled = !0 === e.target.checked;
    try {
      await chrome.storage.local.set({
        [CLOSE_TABS_AFTER_SAVE_ALL_STORAGE_KEY]:
          closeTabsAfterSaveAllTabsEnabled,
      });
    } catch (e) {
      console.error("Failed to save close-tabs-after-save-all setting:", e);
    }
  } else await loadCloseTabsAfterSaveAllTabsSetting();
}
function hasTrustedStartupStoredUser(e, t) {
  const r = normalizeSupabaseUserId(e?.id);
  return !!r && (!t || (!!t.userId && t.userId !== r));
}
async function loadStartupStorageState() {
  if ("undefined" == typeof chrome || !chrome.storage?.local?.get)
    return {
      loaded: !1,
      storage: {},
      storedUser: null,
      sessionInvalidation: null,
      hasTrustedStoredUser: !1,
    };
  try {
    const e = await chrome.storage.local.get(STARTUP_STORAGE_KEYS),
      t = e?.lumilist_user || null,
      r = e?.lumilist_session_invalidated || null;
    return {
      loaded: !0,
      storage: e,
      storedUser: t,
      sessionInvalidation: r,
      hasTrustedStoredUser: hasTrustedStartupStoredUser(t, r),
    };
  } catch (e) {
    return (
      console.warn("Failed to load batched startup storage state:", e),
      {
        loaded: !1,
        storage: {},
        storedUser: null,
        sessionInvalidation: null,
        hasTrustedStoredUser: !1,
      }
    );
  }
}
function setupModalClickOutside(e, t) {
  if (!e) return;
  let r = !1;
  (e.addEventListener("mousedown", (t) => {
    r = t.target === e;
  }),
    e.addEventListener("mouseup", (a) => {
      (r && a.target === e && t(), (r = !1));
    }));
}
function restoreWallpaperSelectionFromStartupStorage(e) {
  const t = e?.[WALLPAPER_STORAGE_KEY];
  if (!t || "object" != typeof t) return null;
  const { selection: r } = reconcileWallpaperSelection(t, {
    preserveHostedSelections: !0,
  });
  wallpaperSelectionByTheme = r;
  cacheWallpaperSelectionLocally(r);
  return r;
}
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await initLumiListLocalization();
    const e = await loadStartupStorageState(),
      t = e.storedUser,
      r = e.loaded ? e.storage : null,
      a = !0,
      o = normalizeLoginSyncState(r?.lumilist_login_sync_state),
      n = normalizeSupabaseUserId(t?.id),
      i = isFreshPendingLoginSyncState(o, n),
      s = a && n && i ? n : null,
      l = a && n && o?.userId === n && "pending" === o.phase && !i ? o : null,
      c = document.getElementById("welcomeScreen");
    restoreWallpaperSelectionFromStartupStorage(r),
    (await loadFloatingControlsCollapseSetting(r),
      setActiveStoredUserId((a && t?.id) || null),
      writeThemeBootstrapAuthHint(a),
      l &&
        "undefined" != typeof SyncManager &&
        "function" == typeof SyncManager._clearLoginSyncState &&
        (await SyncManager._clearLoginSyncState(l.userId, l.generation)),
      a &&
        ((isColdWorkspaceHydrationPending = !0),
        document.body.classList.remove("not-authenticated"),
        beginWorkspaceStartupShell(),
        c && c.classList.add("hidden")),
      setWorkspaceOwnerUserId((a && t?.id) || null),
      await loadWallpaperCloudSyncStateFromStorage(
        t?.id || null,
        r?.wallpaperCloudSyncState,
      ),
      await loadThemeModeFromStorage(r, {
        allowStorageThemeMode: a,
        allowCachedThemeMode: a,
        persistMissingThemeMode: !1,
        persistResolvedMode: !1,
      }));
    const d = new URLSearchParams(window.location.search),
      u = window.location.hash || "",
      p =
        u.includes("access_token") ||
        u.includes("error=") ||
        u.includes("error_description=") ||
        d.has("code") ||
        d.has("error") ||
        d.has("error_description") ||
        "recovery" === d.get("type") ||
        u.includes("type=recovery"),
      m = d.get("import"),
      g = d.get("contextMenuImport"),
      f = Boolean(m || g);
    if (f) {
      const e = document.getElementById("loadingOverlay"),
        t = document.getElementById("loadingTitle"),
        r = document.getElementById("loadingMessage");
      e &&
        t &&
        r &&
        (m
          ? ((t.textContent = llT("startup.importing")),
            (r.textContent = llT("startup.fetchingSharedContent")))
          : ((t.textContent = llT("startup.preparingImport")),
            (r.textContent = llT("startup.loadingLinks"))),
        (e.style.display = ""),
        e.classList.remove("hidden"));
    }
    if (
      (setupModalEventListeners(),
      initReviewPromptVisitChecks(),
      initTrashFeature(),
      initSelectFeature(),
      initSearchFeature(),
      await initCaptureMode(),
      window.addEventListener("lumilist-auth-failure", async (e) => {
        await handleSessionInvalidation(
          e.detail?.reason || "Session expired. Please login again.",
          { expectedUserId: e.detail?.userId || null },
        );
      }),
      document.addEventListener("visibilitychange", async () => {
        "visible" === document.visibilityState &&
          (await checkSubscriptionOnReturn());
      }),
      initIncognitoLinkHandler(),
      initMorphActionHandler(),
      await showBannerFromCachedStatus(),
      window.addEventListener("lumilist-sync-status", (e) => {
        try {
          const t = e?.detail;
          if (!t) return;
          const { status: r, detail: a } = t;
          "error" === r &&
            (console.error("Sync error:", a),
            showGlassToast("Sync failed. Changes saved locally.", "warning"));
        } catch (e) {
          console.error("Error handling sync status event:", e);
        }
      }),
      f ||
        updateLoadingMessage(
          llLiteral("Loading LinkLabs..."),
          llT("startup.checkingAuth"),
        ),
      "recovery" === d.get("type") || u.includes("type=recovery"))
    ) {
      ((isRecoveryMode = !0), document.body.classList.add("recovery-mode"));
      const e = document.getElementById("recoveryOverlay");
      (e && e.classList.add("active"), hideLoadingOverlay());
    }
    let h = !0,
      y = !0,
      b = !0,
      S = !1,
      w = !1;
    const k = !1;
    (document.body.classList.remove("not-authenticated"),
      beginWorkspaceStartupShell(),
      c && c.classList.add("hidden"));
    try {
      const e = await initializeDatabase({
        shouldLoadBoards: h,
        isLoggedIn: h,
        startupStorage: r,
        deferBootstrap: p,
      });
      S = !0 === e?.success;
    } finally {
      if (h) {
        b = await hasUsableLocalWorkspaceData();
        const e =
          "undefined" != typeof SyncManager &&
          "function" == typeof SyncManager.getLastDeltaSyncState
            ? await SyncManager.getLastDeltaSyncState()
            : r?.lumilist_last_delta_sync;
        y = b && isWorkspaceCacheOwnerVerified(n, e);
        const t = getWorkspaceStartupCacheDecision({
          hasOwnerVerifiedCachedWorkspace: y,
          initialWorkspaceRenderSucceeded: S,
          hasPendingAuthRedirect: p,
          workspaceAwaitingLoginSync: k,
        });
        ((isColdWorkspaceHydrationPending = t.requiresGuard),
          t.canRevealCachedWorkspace && finishWorkspaceStartupShell());
      }
    }
    ((async () => {
      try {
        await ensureWallpaperPreferencesInitialized();
        const t =
          "light" === r?.themeMode || "dark" === r?.themeMode
            ? r.themeMode
            : null;
        if (t) {
          applyThemeMode(t, {
            applyWallpaper: !0,
            renderPopup: !0,
            hydrateSelection: !1,
          });
          try {
            localStorage.setItem("lumilist_theme_mode", t);
          } catch (e) {
            console.warn("Failed to restore theme mode locally:", e);
          }
        }
        const e = restoreWallpaperSelectionFromStartupStorage(r);
        e && (await setWallpaperSelection(e, { persist: !1 }));
        await applyWebsiteWallpaperHandoffFromUrl();
      } catch (e) {
        console.error("Deferred wallpaper startup initialization failed:", e);
      }
    })(),
      await initializeUndoRedoHistoryState(),
      await Promise.all([
        initPageCount(),
        initBoardCount(),
        initBookmarkCount(),
      ]));
    const I = await handleAuthRedirect(u),
      L = {
        hasCompletedInitialSync: !1,
        queue: Promise.resolve(),
        wasAuthRedirect: I,
        lastAuthUserId: (await SyncManager.getStoredUser())?.id || null,
      },
      T = SyncManager.getSupabase();
    if (
      (T &&
        T.auth.onAuthStateChange((e, t) => {
          handleSupabaseAuthNotification(L, e, t);
        }),
      h &&
        !0 !== I &&
        !k &&
        "recovery" !== I &&
        "undefined" != typeof SyncManager &&
        SyncManager.autoSyncOnLoad)
    )
      try {
        const e = await SyncManager.autoSyncOnLoad();
        (globalThis.LumiListModules?.extensionContext?.throwIfInvalidated(),
          await applyWallpaperCloudSyncState(
            (await chrome.storage.local.get("wallpaperCloudSyncState"))
              .wallpaperCloudSyncState,
            { source: "post-auto-sync" },
          ));
        const t = await db.pages.filter((e) => !e.deletedAt).sortBy("order"),
          r = t.length > 0,
          a = "account_changed" === e?.status,
          o =
            "function" == typeof SyncManager.getLastDeltaSyncState
              ? await SyncManager.getLastDeltaSyncState()
              : null,
          i = await getCurrentStoredUserId(),
          s = isWorkspaceCacheOwnerVerified(i, o);
        if (
          (e?.success ||
            a ||
            console.error(
              "Auto-sync did not complete:",
              e?.error || e?.reason || "Unknown sync failure",
            ),
          a)
        )
          ((isColdWorkspaceHydrationPending = !0),
            beginWorkspaceStartupShell(),
            setWorkspaceOwnerUserId(null),
            (w = !0),
            i && i !== n
              ? beginCrossTabLoginWait(i)
              : await showWorkspaceLoadFailure(
                  "We could not load your data. Please refresh and try again.",
                ));
        else if (!r && s && "access_required" === e?.reason)
          (await revealVerifiedLocalWorkspaceForUser(i)).success ||
            ((w = !0),
            await showWorkspaceLoadFailure(
              "We could not load your data. Please refresh and try again.",
            ));
        else if (r && (y || s)) {
          if (
            ((currentPageId ? t.find((e) => e.id === currentPageId) : null) ||
              ((currentPageId = t[0].id),
              await chrome.storage.local.set({ currentPageId: t[0].id })),
            e?.changed || !y || !S)
          ) {
            const e = await reconcileWorkspaceRenderFromLocalData({
                attempts: 2,
                scrollToActive: !1,
              }),
              t = !0 === e.deferred && y && S;
            e.success ||
              t ||
              ((w = !0),
              await showWorkspaceLoadFailure(
                "We could not load your data. Please refresh and try again.",
              ));
          }
          w ||
            (await recalculateBookmarkCount(),
            await checkSubscription(),
            setWorkspaceOwnerUserId(i),
            (isColdWorkspaceHydrationPending = !1),
            (y && S) || finishWorkspaceStartupShell());
        } else
          y && S
            ? await checkSubscription()
            : ((w = !0),
              await showWorkspaceLoadFailure(
                "We could not load your data. Please refresh and try again.",
              ));
      } catch (e) {
        if (globalThis.LumiListModules?.extensionContext?.handleError(e))
          throw e;
        console.error("Auto-sync error:", e);
        const t = await SyncManager.getStoredUser();
        t?.id
          ? (await hasUsableLocalWorkspaceData())
            ? y
              ? (console.error(
                  "Sync failed but an owner-verified workspace cache is available",
                ),
                S ||
                  (
                    await reconcileWorkspaceRenderFromLocalData({
                      attempts: 2,
                      scrollToActive: !1,
                    })
                  ).success ||
                  ((w = !0),
                  await showWorkspaceLoadFailure(
                    "We could not load your data. Please refresh and try again.",
                  )),
                w ||
                  (await checkSubscription(),
                  (isColdWorkspaceHydrationPending = !1),
                  finishWorkspaceStartupShell()))
              : (console.error(
                  "Sync failed and the local workspace owner could not be verified",
                ),
                (w = !0),
                await showWorkspaceLoadFailure(
                  "We could not load your data. Please refresh and try again.",
                ))
            : (console.error(
                "Sync failed and no local workspace cache is available - keeping welcome screen visible",
              ),
              (w = !0),
              await showWorkspaceLoadFailure(
                "We could not load your data. Please refresh and try again.",
              ))
          : (console.error(
              "No cached user - session expired, updating auth UI...",
            ),
            await updateAuthUI());
      }
    if (
      ((L.hasCompletedInitialSync = !0),
      !h ||
        w ||
        k ||
        _crossTabLoginInProgress ||
        (await cleanupExpiredTrash(), await cleanupExpiredFavicons()),
      !h ||
        w ||
        k ||
        _crossTabLoginInProgress ||
        (updateLoadingMessage(
          llT("startup.almostReady"),
          llT("startup.preparingWorkspace"),
        ),
        await ensureFirstTabSelected()),
      f || hideLoadingOverlay(),
      !h ||
        w ||
        k ||
        _crossTabLoginInProgress ||
        (window.LumiListPicks?.refreshForCurrentUser?.().catch((e) => {
          console.warn("[LumiListPicks] Failed to refresh after startup:", e);
        }),
        await checkShowOnboarding()),
      (initialAuthCompleted = !0),
      scheduleReviewPromptDisplay(),
      flushInitialSupabaseSignOut(L),
      _pendingLoginSyncSignal)
    ) {
      const e = _pendingLoginSyncSignal;
      if (await handleLoginSyncCompleteSignal(e))
        ((_pendingLoginSyncSignal = null), (_pendingAuthChange = null));
      else {
        const t = await getStoredLoginSyncState();
        beginCrossTabLoginWait(
          e.userId,
          t?.userId === e.userId ? t.generation : e.generation,
        );
      }
    } else if (s) {
      const e = await getStoredLoginSyncState();
      e?.userId === s && "completed" === e.phase
        ? await handleLoginSyncCompleteSignal({
            userId: s,
            timestamp: e.timestamp || Date.now(),
            action: e.action || null,
            generation: e.generation,
          })
        : e?.userId === s && "pending" === e.phase
          ? beginCrossTabLoginWait(s, e.generation)
          : beginCrossTabLoginWait(s, o?.generation || null);
    } else
      _pendingAuthChange?.newValue &&
        beginCrossTabLoginWait(_pendingAuthChange.newValue.id);
    try {
      if ("undefined" != typeof SyncManager) {
        const e = await SyncManager.getStoredUser(),
          t = document.getElementById("welcomeScreen"),
          r = t && !t.classList.contains("hidden");
        if (e?.id && r && !isLateAuthReconcileSuppressed()) {
          const t = await chrome.storage.local.get(
              "lumilist_login_sync_complete",
            ),
            r = t?.lumilist_login_sync_complete;
          if (r?.userId === e.id && (await handleLoginSyncCompleteSignal(r)))
            return;
          const a = await getStoredLoginSyncState();
          beginCrossTabLoginWait(
            e.id,
            a?.userId === e.id ? a.generation : null,
          );
        }
      }
    } catch (e) {
      console.error("Late auth reconcile failed:", e);
    }
  } catch (e) {
    (globalThis.LumiListModules?.extensionContext?.handleError(e) ||
      console.error("Critical initialization error:", e),
      finishWorkspaceStartupShell());
    const t = document.getElementById("loadingOverlay");
    t && t.classList.add("hidden");
    const r = document.createElement("div");
    r.className = "fatal-init-error";
    const a = document.createElement("h2");
    ((a.className = "fatal-init-error-title"),
      (a.textContent = llT("startup.errorTitle")));
    const o = document.createElement("p");
    ((o.className = "fatal-init-error-message"),
      (o.textContent = llT("startup.errorMessage")));
    const n = document.createElement("button");
    ((n.className = "fatal-init-error-button"),
      (n.textContent = llT("startup.refreshPage")),
      n.addEventListener("click", () => window.location.reload()));
    const i = document.createElement("p");
    i.className = "fatal-init-error-detail";
    const s = e && e.message ? e.message : llLiteral("Unknown error");
    ((i.textContent = llT("common.errorWithMessage", { message: s })),
      r.append(a, o, n, i),
      document.body.appendChild(r));
  }
});
let modalEventListenersInitialized = !1;
function setupModalEventListeners() {
  if (modalEventListenersInitialized) return;
  modalEventListenersInitialized = !0;
  const e = document.getElementById("addPageBtn");
  e && e.addEventListener("click", openAddPageModal);
  const t = document.getElementById("addPageBtnOverflow");
  t && t.addEventListener("click", openAddPageModal);
  const r = document.getElementById("floatingAddBtn");
  r && r.addEventListener("click", () => showInlineBoardInput(0));
  const a = document.getElementById("addBookmarkModal"),
    o = document.getElementById("addBookmarkForm"),
    n = document.getElementById("cancelBtn"),
    i = document.getElementById("bookmarkDescription"),
    s = document.getElementById("bookmarkDescriptionRemaining"),
    l = document.getElementById("addBoardModal"),
    c = document.getElementById("addBoardForm"),
    d = document.getElementById("cancelBoardBtn"),
    u = document.getElementById("addPageModal"),
    p = document.getElementById("addPageForm"),
    m = document.getElementById("cancelPageBtn"),
    g = document.getElementById("settingsModal"),
    f = document.getElementById("floatingSettingsBtn"),
    h = document.getElementById("cancelSettingsBtn"),
    y = document.getElementById("reviewPromptModal"),
    b = document.getElementById("reviewPromptSubmitRatingBtn"),
    S = document.getElementById("reviewPromptNotNowBtn"),
    w = document.querySelectorAll("#reviewPromptRating .review-prompt-star");
  (setupModalClickOutside(a, closeAddBookmarkModal),
    n.addEventListener("click", closeAddBookmarkModal),
    o.addEventListener("submit", async function (e) {
      e.preventDefault();
      const t = new FormData(o),
        r = t.get("title"),
        a = t.get("url"),
        n = t.get("description");
      r && a
        ? isValidUrl(a)
          ? (await addNewBookmark(r, a, n), closeAddBookmarkModal())
          : showGlassToast(
              llLiteral("Please enter a valid URL (e.g., https://example.com)"),
              "warning",
            )
        : showGlassToast(
            llLiteral("Please fill in both title and URL fields."),
            "warning",
          );
    }),
    y &&
      setupModalClickOutside(y, () => {
        closeReviewPromptModal({ recordDismiss: !0 }).catch((e) => {
          console.warn(
            "[ReviewPrompt] Failed to close modal on outside click:",
            e,
          );
        });
      }),
    w.forEach((e) => {
      (e.addEventListener("click", () => {
        setReviewPromptRating(e.dataset.rating);
      }),
        e.addEventListener("mouseenter", () => {
          previewReviewPromptRating(e.dataset.rating);
        }),
        e.addEventListener("keydown", handleReviewPromptRatingKeydown));
    }),
    document
      .getElementById("reviewPromptRating")
      ?.addEventListener("mouseleave", () => {
        previewReviewPromptRating(0);
      }),
    b &&
      b.addEventListener("click", () => {
        handleReviewPromptSubmitRating().catch((e) => {
          console.warn("[ReviewPrompt] Submit-rating handler failed:", e);
        });
      }),
    S &&
      S.addEventListener("click", () => {
        handleReviewPromptNotNow().catch((e) => {
          console.warn("[ReviewPrompt] Not-now handler failed:", e);
        });
      }),
    setupModalClickOutside(l, closeAddBoardModal),
    d.addEventListener("click", closeAddBoardModal),
    c.addEventListener("submit", async function (e) {
      e.preventDefault();
      const t = new FormData(c),
        r = t.get("name"),
        a = t.get("description");
      r && "" !== r.trim()
        ? (await createNewBoard(r, a), closeAddBoardModal())
        : showGlassToast(llLiteral("Please enter a board name."), "warning");
    }),
    setupModalClickOutside(u, closeAddPageModal),
    m.addEventListener("click", closeAddPageModal),
    p.addEventListener("submit", async function (e) {
      e.preventDefault();
      const t = new FormData(p).get("name");
      if (t && "" !== t.trim()) {
        closeAddPageModal();
        try {
          await createNewPage(t);
        } catch (e) {
          (showGlassToast(
            llLiteral("Failed to create page. Please try again."),
            "error",
          ),
            console.error("Page creation failed:", e));
        }
      } else showGlassToast(llLiteral("Please enter a page name."), "warning");
    }));
  const k = document.getElementById("editBookmarkModal"),
    I = document.getElementById("editBookmarkForm"),
    L = document.getElementById("cancelEditBookmarkBtn"),
    T = document.getElementById("editBookmarkDescription"),
    E = document.getElementById("editBookmarkDescriptionRemaining");
  (initializeDescriptionRemainingCounter(i, s),
    initializeDescriptionRemainingCounter(T, E),
    setupModalClickOutside(k, closeEditBookmarkModal),
    L.addEventListener("click", closeEditBookmarkModal),
    document
      .getElementById("fetchEditTitleBtn")
      .addEventListener("click", async function () {
        const e = document.getElementById("editBookmarkUrl"),
          t = document.getElementById("editBookmarkTitle"),
          r = document.getElementById("fetchTitleError"),
          a = e.value.trim();
        if (((r.textContent = ""), !a || !isValidUrl(a)))
          return void (r.textContent = llT("form.validUrlFirst"));
        const o = this.textContent;
        ((this.disabled = !0), (this.textContent = llT("common.fetching")));
        try {
          const e = await fetchPageTitleFromBackground(a),
            r = e?.success && "string" == typeof e.title ? e.title.trim() : "";
          ((t.value = r || getFallbackTitleFromUrl(a)), t.focus(), t.select());
        } catch (e) {
          (console.error("Error fetching title:", e),
            (t.value = getFallbackTitleFromUrl(a)),
            t.focus(),
            t.select());
        } finally {
          ((this.disabled = !1), (this.textContent = o));
        }
      }),
    I.addEventListener("submit", async function (e) {
      if ((e.preventDefault(), !currentBookmarkToEdit)) return;
      const t = currentBookmarkToEdit,
        r = new FormData(I),
        a = r.get("title"),
        o = r.get("url"),
        n = r.get("description");
      a && o
        ? isValidUrl(o)
          ? (closeEditBookmarkModal(), await saveBookmarkEdit(t, a, o, n))
          : showGlassToast(
              llLiteral("Please enter a valid URL (e.g., https://example.com)"),
              "warning",
            )
        : showGlassToast(
            llLiteral("Please fill in both title and URL fields."),
            "warning",
          );
    }));
  const C = document.getElementById("editBoardModal"),
    v = document.getElementById("editBoardForm"),
    A = document.getElementById("cancelEditBoardBtn");
  (setupModalClickOutside(C, closeEditBoardModal),
    A.addEventListener("click", closeEditBoardModal),
    v.addEventListener("submit", async function (e) {
      if ((e.preventDefault(), !currentBoardToEdit)) return;
      const t = currentBoardToEdit,
        r = new FormData(v).get("name");
      r && "" !== r.trim()
        ? (closeEditBoardModal(), await updateBoardName(t, r))
        : showGlassToast(llLiteral("Please enter a board name."), "warning");
    }));
  const _ = document.getElementById("renamePageModal"),
    B = document.getElementById("cancelRenamePageBtn"),
    P = document.getElementById("renamePageForm");
  (setupModalClickOutside(_, closeRenamePageModal),
    B.addEventListener("click", closeRenamePageModal),
    P.addEventListener("submit", async function (e) {
      if ((e.preventDefault(), !currentPageToRename))
        return (
          console.error("No page selected for rename"),
          void closeRenamePageModal()
        );
      const t = currentPageToRename.id;
      if (!t)
        return (
          console.error("Page ID is missing:", currentPageToRename),
          void closeRenamePageModal()
        );
      const r = document.getElementById("renamePageInput").value.trim();
      if (r) {
        closeRenamePageModal();
        try {
          (await updatePage(t, { name: r }), await loadPagesNavigation());
        } catch (e) {
          (console.error("Failed to rename page:", e),
            showGlassToast(
              llLiteral("Failed to rename page. Please try again."),
              "error",
            ));
        }
      } else showGlassToast(llLiteral("Please enter a page name."), "warning");
    }));
  const R = document.getElementById("deleteConfirmModal"),
    F = document.getElementById("cancelDeleteBtn"),
    x = document.getElementById("confirmDeleteBtn");
  (setupModalClickOutside(R, cancelDeletion),
    F.addEventListener("click", cancelDeletion),
    x.addEventListener("click", confirmDeletion),
    f
      ? f.addEventListener("click", openSettingsModal)
      : console.error("Settings button not found!"),
    g &&
      (setupModalClickOutside(g, closeSettingsModal),
      new MutationObserver(() => {
        g.classList.contains("active") ||
          settingsPopupMotion?.finish(g.querySelector(".settings-modal-glass"));
      }).observe(g, { attributes: !0, attributeFilter: ["class"] }),
      document.addEventListener("visibilitychange", () => {
        "visible" !== document.visibilityState &&
          settingsPopupMotion?.finishAll();
      })));
  const M = document.getElementById("truncateTitlesToggle");
  M && M.addEventListener("change", handleTruncateTitlesToggle);
  const O = document.getElementById("openInNewTabToggle");
  O && O.addEventListener("change", handleOpenInNewTabToggle);
  const W = document.getElementById("showBookmarkNotesToggle");
  W && W.addEventListener("change", handleShowBookmarkNotesToggle);
  const U = document.getElementById("closeTabsAfterSaveAllToggle");
  U && U.addEventListener("change", handleCloseTabsAfterSaveAllTabsToggle);
  const D = document.getElementById("compactModeToggle");
  D && D.addEventListener("change", toggleCompactMode);
  const N = document.getElementById("floatingControlsCollapsedToggle");
  N && N.addEventListener("change", toggleFloatingControlsCollapseSetting);
  const z = document.getElementById("largeBoardCollapseToggle");
  z && z.addEventListener("change", handleLargeBoardCollapseToggle);
  const q = document.getElementById("largeBoardVisibleLimitSelect");
  q && q.addEventListener("change", handleLargeBoardVisibleLimitChange);
  const G = document.getElementById("settingsLanguageOptions");
  G && G.addEventListener("click", handleSettingsLanguageOptionClick);
  const H = document.getElementById("settingsLanguageSearch");
  H && H.addEventListener("input", populateSettingsLanguageOptions);
  const $ = document.getElementById("settingsQuickSavePage");
  $ &&
    $.addEventListener("change", async () => {
      if (canMutateAccountScopedPreferences())
        try {
          await chrome.storage.local.set({
            quickSavePageId: $.value || "current",
          });
        } catch (e) {
          (console.error(
            "Failed to save quick save destination from settings:",
            e,
          ),
            showGlassToast(
              llLiteral(
                "Failed to save quick save destination. Please try again.",
              ),
              "error",
            ));
        }
      else await loadSettingsQuickSaveDestinationOptions();
    });
  const Y = document.getElementById("settingsChangeShortcutBtn");
  (Y &&
    Y.addEventListener("click", async () => {
      await openQuickSaveShortcutSettings();
    }),
    window.addEventListener("focus", () => {
      g &&
        g.classList.contains("active") &&
        loadSettingsQuickSaveShortcut().catch((e) => {
          console.error(
            "Failed to refresh quick save shortcut in settings:",
            e,
          );
        });
    }));
  const V = document.getElementById("privateLinksIncognitoToggle");
  (V &&
    (chrome.storage.local.get("privateLinksIncognito", (e) => {
      V.checked = !1 !== e.privateLinksIncognito;
    }),
    V.addEventListener("change", async function () {
      if (canMutateAccountScopedPreferences())
        chrome.storage.local.set({ privateLinksIncognito: this.checked });
      else
        try {
          const e = await chrome.storage.local.get("privateLinksIncognito");
          this.checked = !1 !== e.privateLinksIncognito;
        } catch (e) {
          console.error(
            "Failed to restore private-links incognito toggle after blocked change:",
            e,
          );
        }
    })),
    h && h.addEventListener("click", closeSettingsModal));
  const K = document.getElementById("closeSettingsBtn");
  (K && K.addEventListener("click", closeSettingsModal),
    g &&
      g.addEventListener("click", (e) => {
        const t = e.target.closest(".settings-nav-item");
        t && selectSettingsTab(t.dataset.tab);
      }));
  const j = document.getElementById("importChromeModal"),
    Q = document.getElementById("cancelChromeImportBtn"),
    X = document.getElementById("confirmChromeImportBtn");
  (Q && Q.addEventListener("click", closeChromeImportModal),
    X && X.addEventListener("click", importSelectedChromeBookmarks),
    j && setupModalClickOutside(j, closeChromeImportModal));
  const J = document.getElementById("onboardingModal"),
    Z = document.getElementById("skipOnboardingBtn"),
    ee = document.getElementById("importOnboardingBtn"),
    te = document.getElementById("startTrialOnboardingBtn"),
    re = document.getElementById("monthlyOnboardingBtn"),
    ae = document.getElementById("lifetimeOnboardingBtn"),
    oe = document.getElementById("yearlyOnboardingBtn");
  (Z &&
    Z.addEventListener("click", () => {
      (closeOnboardingModal(),
        startQuickTour({ source: "onboarding" }).catch((e) => {
          console.error("[QuickTour] Failed to start from onboarding:", e);
        }));
    }),
    ee &&
      ee.addEventListener("click", () => {
        (closeOnboardingModal(!0), showChromeImportModal());
      }),
    te &&
      te.addEventListener("click", async () => {
        if (
          onboardingTrialRequest ||
          te.disabled ||
          !isOnboardingPlanStepActive()
        )
          return;
        const e = {};
        ((onboardingTrialRequest = e), setOnboardingTrialLoading(!0));
        const t = captureSubscriptionRequestContext(),
          isCurrentRequest = () =>
            onboardingTrialRequest === e && isOnboardingPlanStepActive();
        try {
          const e = await getCurrentOnboardingUserId();
          if (!isCurrentRequest()) return;
          if (!e || !t)
            return void showGlassToast(
              "Please sign in again before starting a trial.",
              "warning",
            );
          if (e !== t.userId || !isSubscriptionRequestContextCurrent(t)) return;
          if (
            "undefined" != typeof SyncManager &&
            "function" == typeof SyncManager.fetchSubscriptionFromServer
          ) {
            const r = await SyncManager.fetchSubscriptionFromServer({
              startTrial: !0,
            });
            if (!isCurrentRequest() || !isSubscriptionRequestContextCurrent(t))
              return;
            if (r && "function" == typeof SyncManager.storeSubscriptionStatus) {
              if (
                (await getCurrentOnboardingUserId()) !== e ||
                !isCurrentRequest() ||
                !isSubscriptionRequestContextCurrent(t, r.subscription)
              )
                return void console.warn(
                  "[Onboarding] Ignoring trial response after account or modal changed.",
                );
              if (isOnboardingPlanSelectionRequired(r.status, r.subscription)) {
                if (
                  !1 ===
                    (await SyncManager.storeSubscriptionStatus(
                      r.status,
                      r.daysLeft,
                      r.subscription || null,
                      { expectedUserId: e },
                    )) ||
                  !isCurrentRequest() ||
                  !isSubscriptionRequestContextCurrent(t)
                )
                  return;
                ((window.subscriptionStatus = r.status),
                  (window.subscriptionDaysLeft = r.daysLeft),
                  (window.subscriptionData = r.subscription || null),
                  syncOnboardingTrialAvailability(r.subscription || null));
                const a = getOnboardingTrialUnavailableReason(
                  r.subscription || null,
                );
                return void showGlassToast(
                  getOnboardingTrialUnavailableMessage(a),
                  "warning",
                );
              }
              if (!hasOnboardingWorkspaceAccessStatus(r.status))
                throw new Error("Trial did not become active.");
              if (
                !1 ===
                  (await SyncManager.storeSubscriptionStatus(
                    r.status,
                    r.daysLeft,
                    r.subscription || null,
                    { expectedUserId: e },
                  )) ||
                !isCurrentRequest() ||
                !isSubscriptionRequestContextCurrent(t)
              )
                return;
              if (
                ((window.subscriptionStatus = r.status),
                (window.subscriptionDaysLeft = r.daysLeft),
                (window.subscriptionData = r.subscription || null),
                !1 ===
                  (await updateSubscriptionUI(
                    r.status,
                    r.daysLeft,
                    r.subscription || null,
                    t,
                  )) ||
                  !isCurrentRequest() ||
                  !isSubscriptionRequestContextCurrent(t))
              )
                return;
              const a = await maybeShowOnboardingWelcomeAfterCheckout(
                r.status,
                t,
              );
              if (!isSubscriptionRequestContextCurrent(t)) return;
              return (
                !a && isOnboardingPlanStepActive() && closeOnboardingModal(),
                void showGlassToast(
                  "Trial started. No card required.",
                  "success",
                )
              );
            }
          }
          throw new Error("Trial service unavailable.");
        } catch (e) {
          (console.warn("[Onboarding] Failed to start trial:", e),
            isCurrentRequest() &&
              isSubscriptionRequestContextCurrent(t) &&
              showGlassToast(
                "Could not start trial. Please try again.",
                "error",
              ));
        } finally {
          onboardingTrialRequest === e && resetOnboardingTrialRequest();
        }
      }),
    re &&
      re.addEventListener("click", () => {
        (rememberPendingOnboardingCheckoutForCurrentUser("monthly").catch(
          (e) => {
            console.warn(
              "[Onboarding] Failed to remember monthly checkout handoff:",
              e,
            );
          },
        ),
          openSubscribePage("monthly"));
      }),
    oe &&
      oe.addEventListener("click", () => {
        (rememberPendingOnboardingCheckoutForCurrentUser("yearly").catch(
          (e) => {
            console.warn(
              "[Onboarding] Failed to remember yearly checkout handoff:",
              e,
            );
          },
        ),
          openSubscribePage("yearly"));
      }),
    ae &&
      ae.addEventListener("click", () => {
        (rememberPendingOnboardingCheckoutForCurrentUser("lifetime").catch(
          (e) => {
            console.warn(
              "[Onboarding] Failed to remember lifetime checkout handoff:",
              e,
            );
          },
        ),
          openSubscribePage("lifetime"));
      }),
    J &&
      setupModalClickOutside(J, () => {
        isOnboardingPlanStepActive() || closeOnboardingModal(!0);
      }),
    document.addEventListener("keydown", handleUndoRedoShortcutKeydown, !0),
    document.addEventListener("keydown", function (e) {
      if ("Escape" === e.key) {
        if (document.getElementById("mobileDownloadDialog")?.open) return;
        if ("function" == typeof isSearchOverlayOpen && isSearchOverlayOpen())
          return void closeSearchOverlay();
        if (isFloatingToolsDockOpen()) return void closeFloatingToolsDock();
        if (y && y.classList.contains("active"))
          return void closeReviewPromptModal({ recordDismiss: !0 }).catch(
            (e) => {
              console.warn(
                "[ReviewPrompt] Failed to close modal on Escape:",
                e,
              );
            },
          );
        const e = document.getElementById("importLinksProgressModal");
        if (e && e.classList.contains("active"))
          return void requestCancelActiveImportLinksRun();
        (isSelectionMode && toggleSelectionMode(),
          selectedBookmarks.size > 0 && clearBookmarkSelection(),
          u.classList.contains("active") && closeAddPageModal(),
          a.classList.contains("active") && closeAddBookmarkModal(),
          l.classList.contains("active") && closeAddBoardModal(),
          k.classList.contains("active") && closeEditBookmarkModal(),
          C.classList.contains("active") && closeEditBoardModal(),
          _ && _.classList.contains("active") && closeRenamePageModal(),
          R.classList.contains("active") && cancelDeletion());
        const t = document.getElementById("trashModal");
        if (
          (t && t.classList.contains("active") && closeTrashModal(),
          g.classList.contains("active") && closeSettingsModal(),
          j && j.classList.contains("active") && closeChromeImportModal(),
          J && J.classList.contains("active"))
        ) {
          if (isOnboardingPlanStepActive()) return;
          closeOnboardingModal(!0);
        }
        const r = document.getElementById("shareModal");
        r && r.classList.contains("active") && closeShareModal();
        const o = document.getElementById("importShareModal");
        if (o && o.classList.contains("active")) {
          const e = document.getElementById("cancelImportShareBtn");
          e && e.click();
        }
        const n = document.getElementById("importLinksModal");
        n && n.classList.contains("active") && closeImportLinksModal();
        const i = document.getElementById("deleteAccountModal");
        i && i.classList.contains("active") && closeDeleteAccountModal();
        const s = document.getElementById("importPopup");
        s && s.classList.contains("active") && closeImportPopup();
        const c = document.getElementById("wallpaperStyleModal");
        if (c && c.classList.contains("active"))
          return void closeWallpaperStyleEditor();
        const d = document.getElementById("wallpaperPopup");
        (d && d.classList.contains("active") && closeWallpaperPopup(),
          closeTabContextMenu(),
          closeBoardMenus(),
          closeCompactControlsDock());
      }
    }),
    setupAuthEventListeners());
}
function setupAuthEventListeners() {
  (setupWelcomeLoginOptionExpansion(), setupWelcomeEmailForm());
  for (const e of ["apple"]) {
    const t = `welcome${e[0].toUpperCase()}${e.slice(1)}Btn`;
    document
      .getElementById(t)
      ?.addEventListener("click", () => handleWelcomeProviderLogin(e));
  }
  window.LumiListAccountPassword?.init({ translate: llT });
  const e = document.getElementById("settingsSignInBtn"),
    t = document.getElementById("settingsLogoutBtn"),
    r = document.getElementById("onboardingPlanSignOutBtn");
  (e &&
    e.addEventListener("click", () => {
      const e = document.getElementById("settingsModal");
      (e && e.classList.remove("active"), showWelcomeScreen());
    }),
    t &&
      t.addEventListener("click", async () => {
        const e = document.getElementById("settingsModal");
        (e && e.classList.remove("active"), await handleLogout());
      }),
    r &&
      r.addEventListener("click", async () => {
        if (r.disabled) return;
        const e = r.textContent;
        ((r.disabled = !0), (r.textContent = llLiteral("Signing out\u2026")));
        try {
          await handleLogout();
        } finally {
          ((r.disabled = !1), (r.textContent = e));
        }
      }));
  const a = document.getElementById("deleteAccountBtn"),
    o = document.getElementById("deleteAccountModal"),
    n = document.getElementById("cancelDeleteAccountBtn"),
    i = document.getElementById("confirmDeleteAccountBtn");
  (a &&
    a.addEventListener("click", () => {
      handleDeleteAccount();
    }),
    n &&
      n.addEventListener("click", () => {
        closeDeleteAccountModal();
      }),
    i &&
      i.addEventListener("click", () => {
        executeDeleteAccount();
      }));
  const s = document.getElementById("deleteConfirmInput");
  (s &&
    i &&
    (s.addEventListener("input", () => {
      i.disabled = !isDeleteAccountConfirmationValid(s.value);
    }),
    s.addEventListener("keydown", (e) => {
      "Enter" === e.key &&
        isDeleteAccountConfirmationValid(s.value) &&
        i.click();
    })),
    setupModalClickOutside(o, closeDeleteAccountModal));
  const l = document.getElementById("reportBugBtn");
  l &&
    l.addEventListener("click", () => {
      openBugReportPage();
    });
}
async function updateAuthUI(e = {}) {
  if ("undefined" == typeof SyncManager) return;
  const { skipOnboarding: t = !1, skipSubscriptionCheck: r = !1 } = e,
    a = !0,
    o = document.getElementById("welcomeScreen");
  if ((a && !r && (await checkSubscription()), a))
    (writeThemeBootstrapAuthHint(!0),
      document.body.classList.remove("not-authenticated"),
      o && o.classList.add("hidden"),
      applyActiveThemeWallpaper(),
      requestAnimationFrame(() => {
        "function" == typeof updateTabNavigation && updateTabNavigation();
      }));
  else {
    (writeThemeBootstrapAuthHint(!1),
      document.body.classList.add("not-authenticated"),
      resetSubscriptionUiForAccountBoundary());
    try {
      await loadWallpaperCatalog();
    } catch (e) {
      console.warn(
        "Failed to preload wallpaper catalog for welcome screen:",
        e,
      );
    }
    (await resetThemeForLoggedOutState(),
      o && o.classList.remove("hidden"),
      resetAccountBoundaryTransientUi({ quickTourReason: "signed_out" }));
    const e = document.getElementById("welcomeSyncing");
    (setWelcomeLoginButtonsState({ visible: !0, disabled: !1, loading: !1 }),
      e && e.classList.add("hidden"));
  }
  a
    ? (t || (await checkShowOnboarding()),
      window.LumiListPicks?.refreshForCurrentUser?.().catch((e) => {
        console.warn("[LumiListPicks] Failed to refresh after auth update:", e);
      }))
    : window.LumiListPicks?.resetForUser?.(null);
}
const LUMILIST_FREE_ACCESS_ENABLED = !0,
  FIRST_YEAR_OFFER_ENABLED = !1,
  SUBSCRIPTION_ENDING_WARNING_DAYS_THRESHOLD = 3,
  FIRST_YEAR_OFFER_PAGE_URL = "https://lumilist.in/subscribe/first-year/",
  FIRST_YEAR_OFFER_FUNCTIONS_URL =
    "https://xbccmcszhnybxzlirjgk.supabase.co/functions/v1",
  FIRST_YEAR_OFFER_POLL_INTERVAL_MS = 6e4,
  FIRST_YEAR_OFFER_BILLING_COUNTRY_CODE = "IN",
  FIRST_YEAR_OFFER_COUNTDOWN_INTERVAL_MS = 1e3,
  FIRST_YEAR_OFFER_RETRY_INTERVAL_MS = 1500,
  FIRST_YEAR_OFFER_MAX_RETRY_INTERVAL_MS = 6e4,
  FIRST_YEAR_OFFER_RATE_LIMIT_BACKOFF_MS = 6e5,
  FIRST_YEAR_OFFER_MAX_TRANSIENT_RETRIES = 8;
let firstYearOfferState = {
    requestId: 0,
    data: null,
    serverOffsetMs: 0,
    lastFetchAt: 0,
    countdownTimer: null,
    retryTimer: null,
    retryAttempts: 0,
    backoffUntil: 0,
    lastFailureReason: null,
  },
  trialWarningBannerMode = "trial";
function isWarningDismissedRecently(e) {
  if (!e) return !1;
  const t = new Date(e);
  return (Date.now() - t.getTime()) / 36e5 < 24;
}
function isPaymentFailureSubscriptionState(e) {
  const t = String(e?.status || "").toLowerCase();
  return "pending" === t || "past_due" === t || "halted" === t || "grace" === t;
}
function requiresPaymentRecovery(e) {
  if (!e || "object" != typeof e) return !1;
  if (!0 === e.payment_recovery_required) return !0;
  const t = String(e.status || "").toLowerCase();
  return (
    "past_due" === t ||
    "halted" === t ||
    ("grace" === t
      ? Boolean(
          e.razorpay_subscription_id ||
          e.subscription_ends_at ||
          e.billing_cycle_ends_at,
        )
      : "pending" === t && Boolean(e.billing_cycle_ends_at))
  );
}
function requiresCheckoutResume(e) {
  if (!e || "object" != typeof e) return !1;
  if (!0 !== e.checkout_resume_required) return !1;
  const t =
    "string" == typeof e.checkout_resume_subscription_id
      ? e.checkout_resume_subscription_id.trim()
      : "";
  return Boolean(t);
}
function configureExpiredOverlay(e = null) {
  const t = document.getElementById("expiredOverlayLabel"),
    r = document.getElementById("expiredOverlayTitle"),
    a = document.getElementById("expiredOverlaySubtitle"),
    o = document.getElementById("expiredPricingCards"),
    n = document.getElementById("expiredRecoveryPanel"),
    i = document.getElementById("expiredRecoveryCopy"),
    s = document.getElementById("expiredRecoveryBtn"),
    l = document.getElementById("expiredLifetimeCard"),
    c = document.getElementById("expiredLifetimePrice"),
    d = o?.querySelector('.pricing-card[data-plan="monthly"]'),
    u = o?.querySelector('.pricing-card[data-plan="yearly"]'),
    p = requiresCheckoutResume(e),
    m = requiresPaymentRecovery(e);
  if (p)
    return (
      t && (t.textContent = llT("subscription.checkout")),
      r && (r.textContent = llT("subscription.continueCheckout")),
      a && (a.textContent = llT("subscription.checkoutSubtitle")),
      i && (i.textContent = llT("subscription.checkoutCopy")),
      s && (s.textContent = llT("subscription.checkout")),
      o && o.classList.add("hidden"),
      n && n.classList.remove("hidden"),
      void hideFirstYearOfferCard()
    );
  if (m)
    return (
      t && (t.textContent = llT("subscription.paymentRecovery")),
      r && (r.textContent = llT("subscription.restorePremium")),
      a && (a.textContent = llT("subscription.recoverySubtitle")),
      i && (i.textContent = llT("subscription.recoveryCopy")),
      s && (s.textContent = llT("settings.billing.fixPayment")),
      o && o.classList.add("hidden"),
      n && n.classList.remove("hidden"),
      void hideFirstYearOfferCard()
    );
  (t && (t.textContent = llT("subscription.pricing")),
    r && (r.textContent = llT("subscription.unlockPremium")),
    a && (a.textContent = llT("subscription.subtitle")),
    o && o.classList.remove("hidden"),
    n && n.classList.add("hidden"));
  const g = !0 === e?.lifetime_offer?.assigned ? e.lifetime_offer : null;
  (t &&
    (t.textContent = llT(g ? "subscription.lifetime" : "subscription.pricing")),
    r &&
      (r.textContent = llT(
        g ? "subscription.getLifetime" : "subscription.unlockPremium",
      )),
    a &&
      (a.textContent = llT(
        g ? "subscription.noRenewal" : "subscription.subtitle",
      )),
    d?.classList.toggle("hidden", Boolean(g)),
    l && l.classList.toggle("hidden", !g),
    u && u.classList.toggle("hidden", Boolean(g)),
    o?.classList.toggle("lifetime-only", Boolean(g)),
    c && g && (c.textContent = formatLifetimeOfferAmount(g)),
    window.LumiListIndiaPricing?.renderExpired(e));
}
function formatLifetimeOfferAmount(e) {
  const t = String(e?.selected_currency || "USD")
      .trim()
      .toUpperCase(),
    r = Number(e?.selected_amount_minor);
  if (!Number.isFinite(r) || r <= 0) return t;
  try {
    return new Intl.NumberFormat(void 0, {
      style: "currency",
      currency: t,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(r / 100);
  } catch (e) {
    return `${t} ${(r / 100).toFixed(2)}`;
  }
}
function updateGraceBannerCopy(e, t) {
  const r = document.getElementById("graceBanner"),
    a = document.getElementById("graceDays"),
    o = r?.querySelector(".grace-text"),
    n = r?.querySelector(".grace-countdown"),
    i = document.getElementById("graceSubscribeBtn");
  if ((a && (a.textContent = t), isPaymentFailureSubscriptionState(e)))
    return (
      o && (o.textContent = llT("subscription.paymentFailedReadOnly")),
      n && (n.textContent = llT("subscription.readOnlyEnds", { days: t })),
      void (
        i &&
        (i.textContent = requiresPaymentRecovery(e)
          ? llT("settings.billing.fixPayment")
          : llT("common.subscribe"))
      )
    );
  (o && (o.textContent = llT("toast.accountActive")),
    n && (n.textContent = llT("subscription.graceLoseAccess", { days: t })),
    i && (i.textContent = llT("common.manageBilling")));
}
function getExpiredSubscriptionMessage(e) {
  const t =
    "function" == typeof llT
      ? llT
      : (e) =>
          ({
            "subscription.expiredCheckout":
              "Finish the checkout you already started to continue using LumiList.",
            "subscription.expiredBillingAttention":
              "Your billing needs attention. Update your payment method from Manage Billing.",
            "subscription.expiredExistingBilling":
              "Your billing needs attention. Manage your existing subscription.",
            "settings.billing.refreshToContinue":
              "Refresh LumiList to continue.",
          })[e] || e;
  return requiresCheckoutResume(e)
    ? t("subscription.expiredCheckout")
    : requiresPaymentRecovery(e)
      ? t("subscription.expiredBillingAttention")
      : isPaymentFailureSubscriptionState(e)
        ? t("subscription.expiredExistingBilling")
        : t("settings.billing.refreshToContinue");
}
function resetFirstYearOfferState() {
  (firstYearOfferState.countdownTimer &&
    clearInterval(firstYearOfferState.countdownTimer),
    firstYearOfferState.retryTimer &&
      clearTimeout(firstYearOfferState.retryTimer),
    (firstYearOfferState = {
      requestId: firstYearOfferState.requestId + 1,
      data: null,
      serverOffsetMs: 0,
      lastFetchAt: 0,
      countdownTimer: null,
      retryTimer: null,
      retryAttempts: 0,
      backoffUntil: 0,
      lastFailureReason: null,
    }),
    setExpiredOfferLoadingVisible(!1),
    hideFirstYearOfferCard());
}
function clearFirstYearOfferRetry() {
  (firstYearOfferState.retryTimer &&
    (clearTimeout(firstYearOfferState.retryTimer),
    (firstYearOfferState.retryTimer = null)),
    (firstYearOfferState.retryAttempts = 0));
}
function scheduleFirstYearOfferRetry(e = {}) {
  if (firstYearOfferState.retryTimer) return !0;
  if (firstYearOfferState.retryAttempts >= 8) return !1;
  firstYearOfferState.retryAttempts += 1;
  const t = Math.min(
    1500 * Math.pow(2, firstYearOfferState.retryAttempts - 1),
    6e4,
  );
  return (
    (firstYearOfferState.retryTimer = setTimeout(() => {
      ((firstYearOfferState.retryTimer = null),
        refreshFirstYearOfferUi({ ...e, force: !0 }).catch((e) => {
          console.warn("[FirstYearOffer] Retry failed:", e);
        }));
    }, t)),
    !0
  );
}
function isRetryableFirstYearOfferFailure(e) {
  if (!e) return !1;
  const t = String(e).toLowerCase();
  if ("request_failed" === t) return !0;
  const r = t.match(/^http_(\d{3})$/);
  if (!r) return !1;
  const a = Number.parseInt(r[1], 10);
  return 408 === a || 425 === a || (a >= 500 && a <= 599);
}
function getFirstYearOfferServerNowMs() {
  return (
    Date.now() +
    (Number.isFinite(firstYearOfferState.serverOffsetMs)
      ? firstYearOfferState.serverOffsetMs
      : 0)
  );
}
function getFirstYearOfferRemainingSeconds(e = firstYearOfferState.data) {
  const t = Date.parse(e?.expires_at || "");
  return Number.isFinite(t)
    ? Math.max(0, Math.floor((t - getFirstYearOfferServerNowMs()) / 1e3))
    : 0;
}
function formatFirstYearOfferCountdown(e) {
  const t = Math.max(0, Math.floor(Number(e) || 0));
  if (t <= 0) return "0s";
  const r = Math.floor(t / 3600),
    a = Math.floor((t % 3600) / 60),
    o = t % 60;
  return r > 0
    ? `${r}h ${String(a).padStart(2, "0")}m ${String(o).padStart(2, "0")}s`
    : a > 0
      ? `${a}m ${String(o).padStart(2, "0")}s`
      : `${o}s`;
}
function hideFirstYearOfferCard() {
  const e = document.getElementById("expiredFirstYearOfferCard");
  e && e.classList.add("hidden");
}
function canShowExpiredPlanPricing() {
  const e = window.subscriptionData || null;
  return !requiresPaymentRecovery(e) && !requiresCheckoutResume(e);
}
function setExpiredPlanPricingVisible(e) {
  const t = document.getElementById("expiredPricingCards");
  t && t.classList.toggle("hidden", !e);
}
function setExpiredOfferLoadingVisible(e) {
  const t = document.getElementById("expiredOfferLoading");
  t && t.classList.toggle("hidden", !e);
}
function updateFirstYearOfferCountdownDisplay() {
  const e = firstYearOfferState.data,
    t = document.getElementById("firstYearOfferBannerCountdown"),
    r = document.getElementById("expiredFirstYearOfferCountdown");
  if (!e?.eligible)
    return (
      setExpiredOfferLoadingVisible(!1),
      hideFirstYearOfferCard(),
      canShowExpiredPlanPricing() && setExpiredPlanPricingVisible(!0),
      void (t && (t.textContent = llT("firstYearOffer.defaultCountdown")))
    );
  const a = getFirstYearOfferRemainingSeconds(e);
  if (a <= 0)
    return (
      setExpiredOfferLoadingVisible(!1),
      hideFirstYearOfferCard(),
      canShowExpiredPlanPricing() && setExpiredPlanPricingVisible(!0),
      t && (t.textContent = llT("firstYearOffer.offerWindow")),
      r && (r.textContent = llT("firstYearOffer.offerEnded")),
      void (
        firstYearOfferState.countdownTimer &&
        (clearInterval(firstYearOfferState.countdownTimer),
        (firstYearOfferState.countdownTimer = null))
      )
    );
  const o = formatFirstYearOfferCountdown(a);
  (t && (t.textContent = o),
    r &&
      (r.textContent = llT("firstYearOffer.countdownRemaining", { time: o })));
}
function startFirstYearOfferCountdown() {
  (firstYearOfferState.countdownTimer &&
    clearInterval(firstYearOfferState.countdownTimer),
    updateFirstYearOfferCountdownDisplay(),
    (firstYearOfferState.countdownTimer = setInterval(
      updateFirstYearOfferCountdownDisplay,
      1e3,
    )));
}
async function fetchFirstYearOfferEligibility({ force: e = !1 } = {}) {
  if (!FIRST_YEAR_OFFER_ENABLED)
    return (
      (firstYearOfferState.data = null),
      (firstYearOfferState.lastFailureReason = null),
      setExpiredOfferLoadingVisible(!1),
      hideFirstYearOfferCard(),
      null
    );
  if (
    requiresPaymentRecovery(window.subscriptionData || null) ||
    requiresCheckoutResume(window.subscriptionData || null)
  )
    return ((firstYearOfferState.data = null), hideFirstYearOfferCard(), null);
  const t = Date.now();
  if (
    !e &&
    firstYearOfferState.backoffUntil &&
    t < firstYearOfferState.backoffUntil
  )
    return (
      (firstYearOfferState.lastFailureReason = "rate_limited"),
      firstYearOfferState.data
    );
  if (
    !e &&
    firstYearOfferState.data &&
    t - firstYearOfferState.lastFetchAt < 6e4
  )
    return firstYearOfferState.data;
  const r = firstYearOfferState.requestId + 1;
  firstYearOfferState.requestId = r;
  try {
    const e = getActiveStoredUserId(),
      t = await getSupabaseAccessToken(e);
    if (!t)
      return ((firstYearOfferState.lastFailureReason = "missing_token"), null);
    const a = await fetch(
        `${FIRST_YEAR_OFFER_FUNCTIONS_URL}/get-first-year-offer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${t}`,
            "Content-Type": "application/json",
            ...(globalThis.getLumiListDiagnosticHeaders?.({
              surface: "newtab",
            }) || {}),
          },
          body: JSON.stringify({ billing_country_code: "IN" }),
        },
      ),
      o = await a.json().catch(() => null);
    if (r !== firstYearOfferState.requestId) return firstYearOfferState.data;
    if (
      ((firstYearOfferState.lastFetchAt = Date.now()),
      (firstYearOfferState.data = a.ok ? o : null),
      (firstYearOfferState.lastFailureReason = a.ok
        ? null
        : o?.reason || o?.error || `http_${a.status}`),
      429 === a.status)
    ) {
      const e = Number.parseInt(a.headers.get("Retry-After") || "", 10),
        t = Number.isFinite(e) ? Math.max(1e3, 1e3 * e) : 6e5;
      ((firstYearOfferState.backoffUntil = Date.now() + t),
        (firstYearOfferState.lastFailureReason = "rate_limited"),
        clearFirstYearOfferRetry());
    } else a.ok && (firstYearOfferState.backoffUntil = 0);
    const n = Date.parse(o?.server_now || "");
    return (
      (firstYearOfferState.serverOffsetMs = Number.isFinite(n)
        ? n - Date.now()
        : 0),
      globalThis.logSubscriptionDebugEvent?.(
        "newtab.first_year_offer.fetch.result",
        {
          ok: a.ok,
          status: a.status,
          eligible: o?.eligible,
          reason: o?.reason || null,
          failureReason: firstYearOfferState.lastFailureReason,
          secondsRemaining: o?.seconds_remaining,
        },
      ),
      a.ok && clearFirstYearOfferRetry(),
      firstYearOfferState.data
    );
  } catch (e) {
    return (
      (firstYearOfferState.lastFailureReason = "request_failed"),
      globalThis.logSubscriptionDebugEvent?.(
        "newtab.first_year_offer.fetch.failed",
        { error: e?.message || String(e || "unknown") },
      ),
      null
    );
  }
}
function applyExpiredFirstYearOffer(e) {
  const t = document.getElementById("expiredFirstYearOfferCard");
  if (!t) return;
  if (null === e)
    return (
      t.classList.add("hidden"),
      canShowExpiredPlanPricing() && setExpiredPlanPricingVisible(!1),
      void setExpiredOfferLoadingVisible(!0)
    );
  if (
    (setExpiredOfferLoadingVisible(!1),
    !e?.eligible || getFirstYearOfferRemainingSeconds(e) <= 0)
  )
    return (
      t.classList.add("hidden"),
      void (canShowExpiredPlanPricing() && setExpiredPlanPricingVisible(!0))
    );
  const r = document.getElementById("expiredFirstYearOfferTitle"),
    a = document.getElementById("expiredFirstYearOfferCopy"),
    o = t.querySelector(".expired-first-year-eyebrow"),
    n = document.getElementById("expiredFirstYearOfferBtn"),
    i = e?.first_year_display || "limited",
    s = e?.renewal_display || "\u20b92,700";
  (o && (o.textContent = llLiteral("48-hour offer")),
    r && (r.textContent = llT("firstYearOffer.title", { price: i })),
    a && (a.textContent = llT("firstYearOffer.copy", { price: s })),
    n &&
      ((n.textContent = llT("firstYearOffer.claimOffer")), (n.disabled = !1)),
    t.classList.remove("hidden"),
    setExpiredPlanPricingVisible(!1),
    startFirstYearOfferCountdown());
}
async function refreshFirstYearOfferUi({
  showExpired: e = !1,
  showBanner: t = !1,
  force: r = !1,
} = {}) {
  if (!FIRST_YEAR_OFFER_ENABLED)
    return (
      clearFirstYearOfferRetry(),
      setExpiredOfferLoadingVisible(!1),
      hideFirstYearOfferCard(),
      e && canShowExpiredPlanPricing() && setExpiredPlanPricingVisible(!0),
      void (t && applyTrialWarningDefaultBanner())
    );
  const a = await fetchFirstYearOfferEligibility({ force: r });
  if (null === a && e)
    return (
      applyExpiredFirstYearOffer(null),
      void (
        (!!isRetryableFirstYearOfferFailure(
          firstYearOfferState.lastFailureReason,
        ) &&
          scheduleFirstYearOfferRetry({ showExpired: e, showBanner: t })) ||
        (setExpiredOfferLoadingVisible(!1),
        hideFirstYearOfferCard(),
        canShowExpiredPlanPricing() && setExpiredPlanPricingVisible(!0))
      )
    );
  (e && applyExpiredFirstYearOffer(a),
    t &&
      (a?.eligible && getFirstYearOfferRemainingSeconds(a) > 0
        ? (applyTrialWarningOfferBanner(a), startFirstYearOfferCountdown())
        : applyTrialWarningDefaultBanner()));
}
function logSubscriptionDebugEvent(e, t = {}) {
  try {
    "undefined" != typeof window &&
      "function" == typeof window.recordSubscriptionDebug &&
      window.recordSubscriptionDebug(e, t);
  } catch (e) {}
}
function hasAuthenticatedRuntimeSubscriptionContext() {
  return (
    !("function" != typeof getActiveStoredUserId || !getActiveStoredUserId()) ||
    Boolean(
      initialAuthCompleted &&
      "undefined" != typeof document &&
      !document.body?.classList?.contains("not-authenticated"),
    )
  );
}
function reconcileSignedInExpiredSnapshot(e, t, r) {
  if (
    (globalThis.logSubscriptionDebugEvent?.(
      "newtab.subscription.reconcile.start",
      {
        status: e,
        daysLeft: t,
        subscription: r,
        hasAuthenticatedRuntimeContext:
          hasAuthenticatedRuntimeSubscriptionContext(),
      },
    ),
    "expired" !== e || !hasAuthenticatedRuntimeSubscriptionContext())
  )
    return { status: e, daysLeft: t, subscription: r, needsFreshFetch: !1 };
  if (!r)
    return (
      globalThis.logSubscriptionDebugEvent?.(
        "newtab.subscription.reconcile.needs_fresh_fetch",
        { reason: "expired-without-subscription", status: e, daysLeft: t },
      ),
      { status: null, daysLeft: 0, subscription: null, needsFreshFetch: !0 }
    );
  if (
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager.getEffectiveStatus &&
    "function" == typeof SyncManager.getDaysRemaining
  ) {
    const a = SyncManager.getEffectiveStatus(r),
      o = SyncManager.getDaysRemaining(r, a);
    if ("expired" !== a)
      return (
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.reconcile.corrected",
          {
            originalStatus: e,
            originalDaysLeft: t,
            correctedStatus: a,
            correctedDaysLeft: o,
            subscription: r,
          },
        ),
        { status: a, daysLeft: o, subscription: r, needsFreshFetch: !1 }
      );
  }
  return (
    globalThis.logSubscriptionDebugEvent?.(
      "newtab.subscription.reconcile.kept_expired",
      { status: e, daysLeft: t, subscription: r },
    ),
    { status: e, daysLeft: t, subscription: r, needsFreshFetch: !1 }
  );
}
function shouldFetchFreshSubscriptionForAccessGate(e, t, r, a) {
  return (
    !!a?.needsFreshFetch ||
    (!!hasAuthenticatedRuntimeSubscriptionContext() &&
      (!0 === e?.isStale ||
        null == t ||
        "plan_required" === t ||
        (("trial" === t ||
          "active" === t ||
          "grace" === t ||
          "expired" === t) &&
          !r)))
  );
}
"undefined" != typeof globalThis &&
  (globalThis.logSubscriptionDebugEvent = logSubscriptionDebugEvent);
const SUBSCRIPTION_FINGERPRINT_FIELDS = [
  "status",
  "plan",
  "razorpay_subscription_id",
  "trial_started_at",
  "trial_ends_at",
  "subscription_started_at",
  "billing_cycle_ends_at",
  "subscription_ends_at",
  "grace_ends_at",
  "updated_at",
  "is_test_mode",
  "paid_count",
  "auth_attempts",
  "payment_recovery_required",
  "payment_recovery_url",
  "payment_recovery_status",
  "payment_recovery_subscription_id",
  "payment_recovery_checkout_key_id",
  "fresh_subscription_allowed",
  "checkout_resume_required",
  "checkout_resume_kind",
  "checkout_resume_status",
  "checkout_resume_subscription_id",
  "checkout_resume_checkout_key_id",
  "checkout_resume_plan",
  "checkout_resume_customer_id",
  "requires_plan_selection",
  "trial_available",
  "trial_unavailable_reason",
  "access_kind",
  "lifetime_access",
  "test_access_preview",
  "lifetime_entitlement",
  "lifetime_offer",
  "india_pricing",
];
function buildSubscriptionStateFingerprint(e) {
  return e && "object" == typeof e
    ? JSON.stringify(
        SUBSCRIPTION_FINGERPRINT_FIELDS.map((t) => [t, e[t] ?? null]),
      )
    : "null";
}
function getSubscriptionRequestGeneration() {
  return Number(window.__lumilistSubscriptionRequestGeneration) || 0;
}
function invalidateSubscriptionRequestContext() {
  window.__lumilistSubscriptionRequestGeneration =
    getSubscriptionRequestGeneration() + 1;
}
function captureSubscriptionRequestContext() {
  const e = getActiveStoredUserId();
  return e
    ? { userId: e, generation: getSubscriptionRequestGeneration() }
    : null;
}
function isSubscriptionRequestContextCurrent(e, t = null) {
  return !(
    !e?.userId ||
    e.generation !== getSubscriptionRequestGeneration() ||
    getActiveStoredUserId() !== e.userId ||
    (t && normalizeRuntimeUserId(t.user_id) !== e.userId)
  );
}
async function recoverPolicyFailedSyncAfterFreshEntitlement(
  e,
  t = null,
  r = null,
) {
  if (
    ("trial" === e || "active" === e) &&
    "undefined" != typeof chrome &&
    chrome.runtime?.sendMessage
  )
    try {
      const e = t || captureSubscriptionRequestContext();
      if (!isSubscriptionRequestContextCurrent(e, r)) return;
      const a = await chrome.runtime.sendMessage({
        action: "recoverEntitlementPolicyFailures",
        userId: e.userId,
      });
      isSubscriptionRequestContextCurrent(e, r) &&
        a?.recovered > 0 &&
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.policy_queue_recovered",
          { recovered: a.recovered, pushSucceeded: !1 !== a.success },
        );
    } catch (e) {
      console.warn(
        "[Subscription] Failed to recover entitlement-denied sync items:",
        e,
      );
    }
}
async function showBannerFromCachedStatus() {
  if (void 0 === LUMILIST_FREE_ACCESS_ENABLED || LUMILIST_FREE_ACCESS_ENABLED)
    return (
      (window.cachedSubscriptionStatus = "active"),
      (window.cachedSubscriptionDaysLeft = 0),
      (window.subscriptionStatus = "active"),
      (window.subscriptionDaysLeft = 0),
      (window.subscriptionData = null),
      resetSubscriptionUiForAccountBoundary(),
      (window.subscriptionStatus = "active"),
      void (window.subscriptionDaysLeft = 0)
    );
  const e = captureSubscriptionRequestContext();
  if (e)
    try {
      const [t, r] = await Promise.all([
        chrome.storage.local.get([
          "trialBannerDismissed",
          "trialWarningDismissedAt",
          "cancelledWarningDismissedAt",
        ]),
        "undefined" != typeof SyncManager &&
        "function" == typeof SyncManager.getStoredSubscriptionStatus
          ? SyncManager.getStoredSubscriptionStatus()
          : Promise.resolve(null),
      ]);
      if (!isSubscriptionRequestContextCurrent(e)) return;
      const a = r?.status ?? null,
        o = Number.isFinite(r?.daysLeft) ? r.daysLeft : 0,
        n = r?.subscription || null,
        i =
          "function" == typeof getActiveStoredUserId &&
          Boolean(getActiveStoredUserId());
      if (
        (globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.banner_cache.read",
          { status: a, daysLeft: o, subscription: n, hasRuntimeUserContext: i },
        ),
        (window.cachedSubscriptionStatus = a),
        (window.cachedSubscriptionDaysLeft = o),
        (window.cachedSubscriptionFingerprint =
          buildSubscriptionStateFingerprint(n)),
        !i ||
          (void 0 !== window.subscriptionStatus &&
            null !== window.subscriptionStatus) ||
          ("trial" !== a &&
            "active" !== a &&
            "grace" !== a &&
            "expired" !== a &&
            "plan_required" !== a) ||
          ((window.subscriptionStatus = a),
          (window.subscriptionDaysLeft = Number.isFinite(o) ? o : 0),
          (window.subscriptionData = n || null)),
        !a)
      )
        return;
      switch (a) {
        case "trial":
          (globalThis.logSubscriptionDebugEvent?.(
            "newtab.subscription.banner_cache.show_trial",
            { daysLeft: o, subscription: n },
          ),
            o <= SUBSCRIPTION_ENDING_WARNING_DAYS_THRESHOLD
              ? isWarningDismissedRecently(t.trialWarningDismissedAt) ||
                showTrialWarningBanner(o)
              : !0 !== t.trialBannerDismissed && showTrialBanner(o));
          break;
        case "grace":
          globalThis.logSubscriptionDebugEvent?.(
            "newtab.subscription.banner_cache.show_grace",
            { daysLeft: o, subscription: n },
          );
          const r = document.getElementById("graceBanner");
          (r && (r.classList.remove("hidden"), updateGraceBannerCopy(n, o)),
            document.body.classList.add("has-grace-banner"));
          break;
        case "expired":
          (globalThis.logSubscriptionDebugEvent?.(
            "newtab.subscription.banner_cache.expired",
            { hasRuntimeUserContext: i, subscription: n },
          ),
            (window.__deferredExpiredOverlayFromCache = !1),
            showExpiredOverlay());
          break;
        case "active":
          (globalThis.logSubscriptionDebugEvent?.(
            "newtab.subscription.banner_cache.active",
            { daysLeft: o, subscription: n },
          ),
            "cancelled" === n?.status &&
              o <= 3 &&
              (isWarningDismissedRecently(t.cancelledWarningDismissedAt) ||
                showCancelledWarningBanner(o)));
          break;
        case "plan_required":
          (globalThis.logSubscriptionDebugEvent?.(
            "newtab.subscription.banner_cache.plan_required",
            { subscription: n },
          ),
            await showRequiredPlanSelectionForCurrentUser(a, n, e));
      }
    } catch (e) {
      (console.error("[BannerCache] Error reading cached status:", e),
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.banner_cache.error",
          { error: e },
        ));
    }
}
async function checkSubscription() {
  if (void 0 === LUMILIST_FREE_ACCESS_ENABLED || LUMILIST_FREE_ACCESS_ENABLED)
    return (
      (window.subscriptionStatus = "active"),
      (window.subscriptionDaysLeft = 0),
      (window.subscriptionData = null),
      (window.cachedSubscriptionStatus = "active"),
      (window.cachedSubscriptionDaysLeft = 0),
      void (await updateSubscriptionUI("active", 0, null))
    );
  if (
    "undefined" == typeof SyncManager ||
    !SyncManager.getStoredSubscriptionStatus
  )
    return;
  const e = captureSubscriptionRequestContext();
  if (e)
    try {
      let t = await SyncManager.getStoredSubscriptionStatus();
      if (!isSubscriptionRequestContextCurrent(e)) return;
      let r = t?.status ?? null,
        a = Number.isFinite(t?.daysLeft) ? t.daysLeft : 0,
        o = t?.subscription || null;
      (o &&
        !isSubscriptionRequestContextCurrent(e, o) &&
        (globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.check.discarded_unowned_cache",
          { requestUserId: e.userId, responseUserId: o.user_id || null },
        ),
        (t = { status: null, daysLeft: 0, subscription: null, isStale: !0 }),
        (r = null),
        (a = 0),
        (o = null)),
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.check.start",
          {
            storedStatus: r,
            storedDaysLeft: a,
            storedSubscription: o,
            storedSource: t?.source || null,
            storedIsStale: t?.isStale ?? null,
          },
        ));
      let n = reconcileSignedInExpiredSnapshot(r, a, o);
      if (
        shouldFetchFreshSubscriptionForAccessGate(t, r, o, n) &&
        "function" == typeof SyncManager.fetchSubscriptionFromServer
      ) {
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.check.fetch_server.start",
          {
            reason: n.needsFreshFetch
              ? "reconciled-state-needs-fresh-fetch"
              : "access-gate-fresh-check",
          },
        );
        const i = await SyncManager.fetchSubscriptionFromServer();
        if (i) {
          if (!isSubscriptionRequestContextCurrent(e, i.subscription || null))
            return void globalThis.logSubscriptionDebugEvent?.(
              "newtab.subscription.check.discarded_stale_response",
              {
                requestUserId: e.userId,
                responseUserId: i.subscription?.user_id || null,
              },
            );
          if (
            ((r = i.status ?? null),
            (a = Number.isFinite(i.daysLeft) ? i.daysLeft : 0),
            (o = i.subscription || null),
            globalThis.logSubscriptionDebugEvent?.(
              "newtab.subscription.check.fetch_server.success",
              { status: r, daysLeft: a, subscription: o },
            ),
            (n = reconcileSignedInExpiredSnapshot(r, a, o)),
            "function" == typeof SyncManager.storeSubscriptionStatus &&
              (r !== t?.status ||
                a !== t?.daysLeft ||
                o !== (t?.subscription || null)) &&
              (await SyncManager.storeSubscriptionStatus(r, a, o, {
                expectedUserId: e.userId,
              }),
              !isSubscriptionRequestContextCurrent(e, o)))
          )
            return;
          if (
            (await recoverPolicyFailedSyncAfterFreshEntitlement(r, e, o),
            !isSubscriptionRequestContextCurrent(e, o))
          )
            return;
        }
      }
      if (
        ((r = n.status ?? null),
        (a = Number.isFinite(n.daysLeft) ? n.daysLeft : 0),
        (o = n.subscription || null),
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.check.final",
          {
            status: r,
            daysLeft: a,
            subscription: o,
            cachedStatus: window.cachedSubscriptionStatus,
            cachedDaysLeft: window.cachedSubscriptionDaysLeft,
          },
        ),
        !isSubscriptionRequestContextCurrent(e, o))
      )
        return;
      const i = buildSubscriptionStateFingerprint(o),
        s =
          window.cachedSubscriptionStatus !== r ||
          window.cachedSubscriptionDaysLeft !== a ||
          window.cachedSubscriptionFingerprint !== i,
        l = "expired" === r && !0 === window.__deferredExpiredOverlayFromCache;
      if (
        ((window.subscriptionStatus = r),
        (window.subscriptionDaysLeft = a),
        (window.subscriptionData = o),
        (window.cachedSubscriptionStatus = r),
        (window.cachedSubscriptionDaysLeft = a),
        (window.cachedSubscriptionFingerprint = i),
        s || void 0 === window.cachedSubscriptionStatus || l)
      ) {
        if (
          (globalThis.logSubscriptionDebugEvent?.(
            "newtab.subscription.check.update_ui",
            {
              statusChanged: s,
              replayingDeferredExpiredOverlay: l,
              status: r,
              daysLeft: a,
              subscription: o,
            },
          ),
          !1 === (await updateSubscriptionUI(r, a, o, e)))
        )
          return;
      } else
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.check.noop",
          { status: r, daysLeft: a, subscription: o },
        );
      if (!isSubscriptionRequestContextCurrent(e, o)) return;
      if (isOnboardingPlanSelectionRequired(r, o))
        return void (await showRequiredPlanSelectionForCurrentUser(r, o, e));
      maybeShowOnboardingWelcomeAfterCheckout(r, e).catch((e) => {
        console.warn("[Onboarding] Failed to show welcome after checkout:", e);
      });
    } catch (t) {
      if (!isSubscriptionRequestContextCurrent(e)) return;
      (console.error("Error checking subscription:", t),
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.check.error",
          {
            error: t,
            currentStatus: window.subscriptionStatus,
            cachedStatus: window.cachedSubscriptionStatus,
            currentSubscription: window.subscriptionData || null,
          },
        ));
      const r = window.subscriptionStatus ?? window.cachedSubscriptionStatus,
        a = Number.isFinite(window.subscriptionDaysLeft)
          ? window.subscriptionDaysLeft
          : Number.isFinite(window.cachedSubscriptionDaysLeft)
            ? window.cachedSubscriptionDaysLeft
            : 0,
        o = "trial" === r || "active" === r || "grace" === r || "expired" === r;
      if (isTransientSyncDegraded() && o)
        return (
          (window.subscriptionStatus = r),
          void (window.subscriptionDaysLeft = a)
        );
      void 0 === window.subscriptionStatus &&
        ((window.subscriptionStatus = null), (window.subscriptionDaysLeft = 0));
    }
}
let lastVisibilityCheck = 0,
  visibilitySubscriptionCheckPromise = null,
  forceNextVisibilitySubscriptionCheck = !1;
const VISIBILITY_CHECK_COOLDOWN = 15e3;
async function checkSubscriptionOnReturn() {
  if (void 0 === LUMILIST_FREE_ACCESS_ENABLED || LUMILIST_FREE_ACCESS_ENABLED)
    return;
  if (visibilitySubscriptionCheckPromise)
    return visibilitySubscriptionCheckPromise;
  const e = (async () => {
    let e = null;
    try {
      if (!initialAuthCompleted) return;
      if (!(await SyncManager.isLoggedIn())) return;
      if (((e = captureSubscriptionRequestContext()), !e)) return;
      const t =
        forceNextVisibilitySubscriptionCheck ||
        isOnboardingPlanStepActive() ||
        (await hasFreshPendingOnboardingCheckoutForCurrentUser());
      if (!isSubscriptionRequestContextCurrent(e)) return;
      const r = Date.now();
      if (!t && r - lastVisibilityCheck < VISIBILITY_CHECK_COOLDOWN) return;
      ((lastVisibilityCheck = r), (forceNextVisibilitySubscriptionCheck = !1));
      const a = await SyncManager.fetchSubscriptionFromServer();
      if (!a) return;
      const { status: o, daysLeft: n, subscription: i } = a;
      if (!isSubscriptionRequestContextCurrent(e, i || null))
        return void globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.return.discarded_stale_response",
          { requestUserId: e.userId, responseUserId: i?.user_id || null },
        );
      const s = window.subscriptionStatus,
        l = window.subscriptionDaysLeft;
      if (
        o !== s ||
        n !== l ||
        buildSubscriptionStateFingerprint(i) !==
          buildSubscriptionStateFingerprint(window.subscriptionData || null)
      ) {
        if (
          ((window.subscriptionStatus = o),
          (window.subscriptionDaysLeft = n),
          (window.subscriptionData = i),
          await SyncManager.storeSubscriptionStatus(o, n, i, {
            expectedUserId: e.userId,
          }),
          !isSubscriptionRequestContextCurrent(e, i || null))
        )
          return;
        if (
          ((window.cachedSubscriptionStatus = o),
          (window.cachedSubscriptionDaysLeft = n),
          (window.cachedSubscriptionFingerprint =
            buildSubscriptionStateFingerprint(i)),
          !1 === (await updateSubscriptionUI(o, n, i, e)))
        )
          return;
      }
      if (!isSubscriptionRequestContextCurrent(e, i || null)) return;
      if (
        (await recoverPolicyFailedSyncAfterFreshEntitlement(o, e, i || null),
        !isSubscriptionRequestContextCurrent(e, i || null))
      )
        return;
      if (isOnboardingPlanSelectionRequired(o, i))
        return void (await showRequiredPlanSelectionForCurrentUser(o, i, e));
      await maybeShowOnboardingWelcomeAfterCheckout(o, e);
    } catch (t) {
      (e && !isSubscriptionRequestContextCurrent(e)) ||
        console.error("[Subscription] Error checking on tab return:", t);
    }
  })();
  visibilitySubscriptionCheckPromise = e;
  const clearCompletedVisibilityCheck = () => {
    visibilitySubscriptionCheckPromise === e &&
      (visibilitySubscriptionCheckPromise = null);
  };
  return (
    e.then(clearCompletedVisibilityCheck, clearCompletedVisibilityCheck),
    visibilitySubscriptionCheckPromise
  );
}
const TRIAL_BANNER_AUTO_HIDE_MS = 3e4;
let trialBannerTimeoutId = null;
async function isTrialBannerDismissed() {
  return (
    !0 ===
    (await chrome.storage.local.get("trialBannerDismissed"))
      .trialBannerDismissed
  );
}
async function dismissTrialBanner(e = {}) {
  const t = !0 === e?.suppressGuardToast,
    r = getWorkspaceMutationBlockedReason();
  return r
    ? (t || showWorkspaceMutationBlockedToast(r), hideTrialBanner(), !1)
    : (await chrome.storage.local.set({ trialBannerDismissed: !0 }),
      hideTrialBanner(),
      !0);
}
function showTrialBanner(e) {
  const t = document.getElementById("trialBanner"),
    r = document.getElementById("trialBannerDays");
  t &&
    r &&
    ((r.textContent = e),
    t.classList.remove("hidden"),
    document.body.classList.add("has-trial-banner"),
    trialBannerTimeoutId && clearTimeout(trialBannerTimeoutId),
    (trialBannerTimeoutId = setTimeout(() => {
      dismissTrialBanner({ suppressGuardToast: !0 });
    }, TRIAL_BANNER_AUTO_HIDE_MS)));
}
function hideTrialBanner() {
  const e = document.getElementById("trialBanner");
  (e && e.classList.add("hidden"),
    document.body.classList.remove("has-trial-banner"),
    trialBannerTimeoutId &&
      (clearTimeout(trialBannerTimeoutId), (trialBannerTimeoutId = null)));
}
function initTrialBanner() {
  const e = document.getElementById("trialBannerDismiss");
  e && e.addEventListener("click", dismissTrialBanner);
}
async function isTrialWarningDismissedToday() {
  const e = await chrome.storage.local.get("trialWarningDismissedAt");
  if (!e.trialWarningDismissedAt) return !1;
  const t = new Date(e.trialWarningDismissedAt);
  return (new Date() - t) / 36e5 < 24;
}
async function dismissTrialWarningForToday() {
  return canMutateAccountScopedPreferences()
    ? (await chrome.storage.local.set({
        trialWarningDismissedAt: new Date().toISOString(),
      }),
      hideTrialWarningBanner(),
      !0)
    : (hideTrialWarningBanner(), !1);
}
function showTrialWarningBanner(e) {
  const t = document.getElementById("trialWarningBanner");
  ((trialWarningBannerMode = "trial"),
    applyTrialWarningDefaultBanner(e),
    t &&
      (t.classList.remove("hidden"),
      document.body.classList.add("has-trial-warning-banner"),
      window.LumiListIndiaPricing?.renderBanner(window.subscriptionData),
      hideTrialBanner(),
      FIRST_YEAR_OFFER_ENABLED &&
        !0 !== window.subscriptionData?.lifetime_offer?.assigned &&
        refreshFirstYearOfferUi({ showBanner: !0 }).catch((e) => {
          console.warn("[FirstYearOffer] Failed to refresh warning banner:", e);
        })));
}
function hideTrialWarningBanner() {
  const e = document.getElementById("trialWarningBanner");
  (e && e.classList.add("hidden"),
    document.body.classList.remove("has-trial-warning-banner"));
}
function initTrialWarningBanner() {
  const e = document.getElementById("trialWarningDismiss"),
    t = document.getElementById("trialWarningManageBtn");
  (e &&
    e.addEventListener("click", () => {
      "cancelled" !== trialWarningBannerMode
        ? dismissTrialWarningForToday()
        : dismissCancelledWarningForToday();
    }),
    t &&
      t.addEventListener("click", () => {
        "cancelled" !== trialWarningBannerMode
          ? "trial_offer" !== trialWarningBannerMode
            ? openSubscribePage(
                !0 === window.subscriptionData?.lifetime_offer?.assigned
                  ? "lifetime"
                  : "yearly",
              )
            : !0 === window.subscriptionData?.lifetime_offer?.assigned
              ? openSubscribePage("lifetime")
              : FIRST_YEAR_OFFER_ENABLED
                ? openFirstYearOfferPage()
                : openSubscribePage("yearly")
          : openSubscribePage(
              !0 === window.subscriptionData?.lifetime_offer?.assigned
                ? "lifetime"
                : "yearly",
            );
      }));
}
function getTrialWarningDaysLeft() {
  const e = document.getElementById("trialWarningDays"),
    t = Number.parseInt(e?.textContent || "1", 10);
  return Number.isFinite(t) && t > 0 ? t : 1;
}
function applyTrialWarningDefaultBanner(e = getTrialWarningDaysLeft()) {
  const t = document.getElementById("trialWarningBanner"),
    r = t?.querySelector(".trial-warning-text"),
    a = document.getElementById("trialWarningManageBtn"),
    o = Number.isFinite(e) && e > 0 ? Math.ceil(e) : 1,
    n = !0 === window.subscriptionData?.lifetime_offer?.assigned;
  ((trialWarningBannerMode = "trial"),
    r &&
      (r.textContent = llT(
        n
          ? "subscription.trialBanner"
          : 1 === o
            ? "subscription.trialEndsInOne"
            : "subscription.trialEndsInMany",
        { days: o },
      )),
    a &&
      (a.textContent = llT(
        n ? "subscription.getLifetime" : "common.subscribe",
      )),
    window.LumiListIndiaPricing?.renderBanner(window.subscriptionData));
}
function applyTrialWarningOfferBanner(e) {
  const t = document.getElementById("trialWarningBanner"),
    r = t?.querySelector(".trial-warning-text"),
    a = document.getElementById("trialWarningManageBtn");
  ((trialWarningBannerMode = "trial_offer"),
    r && (r.textContent = llT("subscription.trialEndingSubscribe")),
    a && (a.textContent = llT("common.subscribe")));
}
async function isCancelledWarningDismissedToday() {
  const e = await chrome.storage.local.get("cancelledWarningDismissedAt");
  if (!e.cancelledWarningDismissedAt) return !1;
  const t = new Date(e.cancelledWarningDismissedAt);
  return (new Date() - t) / 36e5 < 24;
}
async function dismissCancelledWarningForToday() {
  return canMutateAccountScopedPreferences()
    ? (await chrome.storage.local.set({
        cancelledWarningDismissedAt: new Date().toISOString(),
      }),
      hideTrialWarningBanner(),
      !0)
    : (hideTrialWarningBanner(), !1);
}
function showCancelledWarningBanner(e) {
  const t = document.getElementById("trialWarningBanner");
  if (!t) return;
  trialWarningBannerMode = "cancelled";
  const r = t.querySelector(".trial-warning-text");
  r &&
    (r.textContent = llT(
      1 === e
        ? "subscription.cancelledWarningOne"
        : "subscription.cancelledWarningMany",
      { days: e },
    ));
  const a = t.querySelector(".trial-warning-btn");
  (a && (a.textContent = llT("subscription.resubscribeNow")),
    t.classList.remove("hidden"),
    document.body.classList.add("has-trial-warning-banner"));
}
function resetSubscriptionUiForAccountBoundary() {
  invalidateSubscriptionRequestContext();
  const e = document.getElementById("graceBanner"),
    t = document.getElementById("expiredOverlay");
  (hideTrialBanner(),
    hideTrialWarningBanner(),
    resetFirstYearOfferState(),
    e && e.classList.add("hidden"),
    t && t.classList.add("hidden"),
    clearExpiredOverlayTheme(),
    document.body.classList.remove("has-grace-banner"),
    document.body.classList.remove("subscription-expired"),
    (window.__deferredExpiredOverlayFromCache = !1),
    (window.subscriptionStatus = null),
    (window.subscriptionDaysLeft = null),
    (window.subscriptionData = null),
    (window.cachedSubscriptionStatus = null),
    (window.cachedSubscriptionDaysLeft = null),
    (window.cachedSubscriptionFingerprint = "null"),
    (lastVisibilityCheck = 0),
    (visibilitySubscriptionCheckPromise = null),
    (forceNextVisibilitySubscriptionCheck = !1));
}
async function updateSubscriptionUI(e, t, r = null, a = null) {
  if (
    (!a &&
      window.pendingWorkspaceAccessUserId &&
      (a = captureSubscriptionRequestContext()),
    a && !isSubscriptionRequestContextCurrent(a, r))
  )
    return !1;
  if (void 0 === LUMILIST_FREE_ACCESS_ENABLED || LUMILIST_FREE_ACCESS_ENABLED) {
    const e = document.getElementById("trialBadge"),
      t = document.getElementById("graceBanner"),
      r = document.getElementById("expiredOverlay");
    return (
      e && e.classList.add("hidden"),
      t && t.classList.add("hidden"),
      r && r.classList.add("hidden"),
      clearExpiredOverlayTheme(),
      hideTrialBanner(),
      hideTrialWarningBanner(),
      hideFirstYearOfferCard(),
      resetFirstYearOfferState(),
      document.body.classList.remove("has-grace-banner"),
      document.body.classList.remove("subscription-expired"),
      (window.__deferredExpiredOverlayFromCache = !1),
      void (
        "function" == typeof updateSettingsSubscriptionDisplay &&
        updateSettingsSubscriptionDisplay().catch((e) => {
          console.error("Failed to sync settings subscription display:", e);
        })
      )
    );
  }
  const o = reconcileSignedInExpiredSnapshot(e, t, r);
  if (
    ((e = o.status ?? null),
    (t = Number.isFinite(o.daysLeft) ? o.daysLeft : 0),
    (r = o.subscription || null),
    a && !isSubscriptionRequestContextCurrent(a, r))
  )
    return !1;
  if (
    window.pendingWorkspaceAccessUserId &&
    ("trial" === e || "active" === e) &&
    !(await resumeWorkspaceAfterAccessGranted(e))
  )
    return !1;
  if (a && !isSubscriptionRequestContextCurrent(a, r)) return !1;
  globalThis.logSubscriptionDebugEvent?.("newtab.subscription.ui.update", {
    status: e,
    daysLeft: t,
    subscription: r,
    needsFreshFetch: o.needsFreshFetch ?? !1,
    stack: new Error("subscription-ui-update").stack,
  });
  const n = document.getElementById("trialBadge"),
    i = document.getElementById("graceBanner"),
    s = document.getElementById("expiredOverlay");
  switch (
    (n && n.classList.add("hidden"),
    i && i.classList.add("hidden"),
    s && s.classList.add("hidden"),
    clearExpiredOverlayTheme(),
    hideTrialBanner(),
    hideTrialWarningBanner(),
    hideFirstYearOfferCard(),
    document.body.classList.remove("has-grace-banner"),
    document.body.classList.remove("subscription-expired"),
    "expired" !== e && (window.__deferredExpiredOverlayFromCache = !1),
    e)
  ) {
    case "trial":
      if (t <= SUBSCRIPTION_ENDING_WARNING_DAYS_THRESHOLD) {
        const e = await isTrialWarningDismissedToday();
        if (a && !isSubscriptionRequestContextCurrent(a, r)) return !1;
        e || showTrialWarningBanner(t);
      } else {
        const e = await isTrialBannerDismissed();
        if (a && !isSubscriptionRequestContextCurrent(a, r)) return !1;
        e || showTrialBanner(t);
      }
      break;
    case "grace":
      (i && (i.classList.remove("hidden"), updateGraceBannerCopy(r, t)),
        document.body.classList.add("has-grace-banner"));
      break;
    case "expired":
      showExpiredOverlay();
      break;
    case "active":
      if ("cancelled" === r?.status && t <= 3) {
        const e = await isCancelledWarningDismissedToday();
        if (a && !isSubscriptionRequestContextCurrent(a, r)) return !1;
        e || showCancelledWarningBanner(t);
      }
  }
  return (
    "function" == typeof updateSettingsSubscriptionDisplay &&
      updateSettingsSubscriptionDisplay().catch((e) => {
        console.error("Failed to sync settings subscription display:", e);
      }),
    !0
  );
}
function showExpiredOverlay() {
  (globalThis.logSubscriptionDebugEvent?.("newtab.subscription.overlay.show", {
    status: window.subscriptionStatus,
    daysLeft: window.subscriptionDaysLeft,
    cachedStatus: window.cachedSubscriptionStatus,
    cachedDaysLeft: window.cachedSubscriptionDaysLeft,
    subscription: window.subscriptionData || null,
    stack: new Error("showExpiredOverlay").stack,
  }),
    clearPendingOnboardingOpen(),
    closeOnboardingModal());
  const e = document.getElementById("expiredOverlay");
  (applyExpiredOverlayTheme(),
    configureExpiredOverlay(window.subscriptionData || null),
    e && e.classList.remove("hidden"),
    window.LumiListIndiaPricing?.presentedExpired(window.subscriptionData),
    (window.__deferredExpiredOverlayFromCache = !1),
    document.body.classList.add("subscription-expired"));
  const t = !0 === window.subscriptionData?.lifetime_offer?.assigned;
  (canShowExpiredPlanPricing() &&
    (setExpiredPlanPricingVisible(t || !FIRST_YEAR_OFFER_ENABLED),
    hideFirstYearOfferCard(),
    setExpiredOfferLoadingVisible(!t && FIRST_YEAR_OFFER_ENABLED)),
    FIRST_YEAR_OFFER_ENABLED &&
      !t &&
      refreshFirstYearOfferUi({ showExpired: !0 }).catch((e) => {
        (console.warn("[FirstYearOffer] Failed to refresh expired overlay:", e),
          setExpiredOfferLoadingVisible(!1),
          hideFirstYearOfferCard(),
          canShowExpiredPlanPricing() && setExpiredPlanPricingVisible(!0));
      }));
}
function captureDevSubscriptionPreviewState() {
  if (window.__devSubscriptionPreviewState?.snapshot)
    return window.__devSubscriptionPreviewState.snapshot;
  const e = {
    status: window.subscriptionStatus,
    daysLeft: window.subscriptionDaysLeft,
    subscription: window.subscriptionData,
    cachedStatus: window.cachedSubscriptionStatus,
    cachedDaysLeft: window.cachedSubscriptionDaysLeft,
  };
  return (
    (window.__devSubscriptionPreviewState = { mode: null, snapshot: e }),
    e
  );
}
function buildDevPaymentRecoveryPreviewSubscription({ expired: e = !1 } = {}) {
  const t = Date.now(),
    r = e ? new Date(t - 6912e5) : new Date(t),
    a = new Date(r.getTime() - 6048e5);
  return {
    status: "halted",
    plan: "monthly",
    payment_recovery_required: !0,
    razorpay_subscription_id: "sub_DEV_PAYMENT_RECOVERY",
    subscription_started_at: new Date(a.getTime() - 2592e6).toISOString(),
    billing_cycle_ends_at: a.toISOString(),
    subscription_ends_at: r.toISOString(),
    paid_count: 1,
  };
}
async function restoreDevSubscriptionPreviewState() {
  const e = window.__devSubscriptionPreviewState,
    t = e?.snapshot;
  if (!t) return;
  ((window.subscriptionStatus = t.status),
    (window.subscriptionDaysLeft = t.daysLeft),
    (window.subscriptionData = t.subscription),
    (window.cachedSubscriptionStatus = t.cachedStatus),
    (window.cachedSubscriptionDaysLeft = t.cachedDaysLeft),
    (window.__devSubscriptionPreviewState = null));
  const r = t.status,
    a = Number.isFinite(t.daysLeft) ? t.daysLeft : 0;
  (await updateSubscriptionUI(r, a, t.subscription || null),
    showGlassToast("Restored live subscription UI.", "success"));
}
async function showDevSubscriptionPreview(e = "payment_grace") {
  if ((window.__devSubscriptionPreviewState?.mode || null) === e)
    return void (await restoreDevSubscriptionPreviewState());
  let t, r, a;
  (captureDevSubscriptionPreviewState(),
    "payment_expired" === e
      ? ((t = buildDevPaymentRecoveryPreviewSubscription({ expired: !0 })),
        (r = "expired"),
        (a = 0))
      : ((t = buildDevPaymentRecoveryPreviewSubscription({ expired: !1 })),
        (r =
          "function" == typeof SyncManager?.getEffectiveStatus
            ? SyncManager.getEffectiveStatus(t)
            : "grace"),
        (a =
          "function" == typeof SyncManager?.getDaysRemaining
            ? SyncManager.getDaysRemaining(t, r)
            : 7)),
    (window.subscriptionStatus = r),
    (window.subscriptionDaysLeft = a),
    (window.subscriptionData = t),
    (window.cachedSubscriptionStatus = r),
    (window.cachedSubscriptionDaysLeft = a),
    (window.__devSubscriptionPreviewState.mode = e),
    await updateSubscriptionUI(r, a, t),
    showGlassToast(
      "payment_expired" !== e
        ? "Dev preview: post-retry failed-payment banner. Shift-click the test button to preview the final recovery overlay."
        : "Dev preview: final failed-payment recovery overlay. Click the test button again to restore.",
      "warning",
    ));
}
function isTransientSyncDegraded() {
  if ("undefined" == typeof SyncManager) return !1;
  try {
    const e =
        ("undefined" != typeof navigator && !1 === navigator.onLine) ||
        !0 === SyncManager._isOffline,
      t =
        "function" == typeof SyncManager._getTransientPullBackoffRemainingMs &&
        SyncManager._getTransientPullBackoffRemainingMs() > 0,
      r =
        "function" == typeof SyncManager._isRecentlyTransientNetworkDegraded &&
        SyncManager._isRecentlyTransientNetworkDegraded();
    return e || t || r;
  } catch (e) {
    return !1;
  }
}
function canModify() {
  if (void 0 === LUMILIST_FREE_ACCESS_ENABLED || LUMILIST_FREE_ACCESS_ENABLED)
    return canMutateAccountScopedPreferences();
  if (
    (window._lastUnknownStatusToastAt || (window._lastUnknownStatusToastAt = 0),
    window._lastDegradedStatusToastAt ||
      (window._lastDegradedStatusToastAt = 0),
    !canMutateAccountScopedPreferences())
  )
    return !1;
  const e =
    "undefined" == typeof document ||
    (initialAuthCompleted &&
      !document.body?.classList?.contains("not-authenticated"));
  let t =
    "trial" === window.subscriptionStatus ||
    "active" === window.subscriptionStatus ||
    "grace" === window.subscriptionStatus ||
    "expired" === window.subscriptionStatus ||
    "plan_required" === window.subscriptionStatus ||
    !e ||
    ("trial" !== window.cachedSubscriptionStatus &&
      "active" !== window.cachedSubscriptionStatus &&
      "grace" !== window.cachedSubscriptionStatus &&
      "expired" !== window.cachedSubscriptionStatus &&
      "plan_required" !== window.cachedSubscriptionStatus)
      ? window.subscriptionStatus
      : window.cachedSubscriptionStatus;
  if (
    e &&
    window.subscriptionData &&
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager.getEffectiveStatus
  ) {
    const e = SyncManager.getEffectiveStatus(window.subscriptionData);
    ("trial" === e ||
      "active" === e ||
      "grace" === e ||
      "expired" === e ||
      "plan_required" === e) &&
      e !== t &&
      (globalThis.logSubscriptionDebugEvent?.(
        "newtab.subscription.can_modify.correct_stale_status",
        {
          originalStatus: t,
          correctedStatus: e,
          subscription: window.subscriptionData || null,
        },
      ),
      (t = e),
      (window.subscriptionStatus = e),
      "function" == typeof SyncManager.getDaysRemaining &&
        (window.subscriptionDaysLeft = SyncManager.getDaysRemaining(
          window.subscriptionData,
          e,
        )));
  }
  if ("trial" === t || "active" === t) return !0;
  if ("grace" === t)
    return (
      globalThis.logSubscriptionDebugEvent?.(
        "newtab.subscription.can_modify.block_grace",
        { status: t, subscription: window.subscriptionData || null },
      ),
      showGlassToast("Refresh account status before editing.", "warning"),
      !1
    );
  if ("expired" === t) {
    if (e && !window.subscriptionData)
      return (
        globalThis.logSubscriptionDebugEvent?.(
          "newtab.subscription.can_modify.defer_expired_without_subscription",
          { status: t, cachedStatus: window.cachedSubscriptionStatus },
        ),
        showGlassToast(
          "Refreshing subscription status. Please wait a moment.",
          "warning",
        ),
        !1
      );
    if (
      e &&
      window.subscriptionData &&
      "undefined" != typeof SyncManager &&
      "function" == typeof SyncManager.getEffectiveStatus
    ) {
      const e = SyncManager.getEffectiveStatus(window.subscriptionData);
      if ("trial" === e || "active" === e)
        return (
          globalThis.logSubscriptionDebugEvent?.(
            "newtab.subscription.can_modify.corrected",
            {
              originalStatus: t,
              correctedStatus: e,
              subscription: window.subscriptionData || null,
            },
          ),
          (window.subscriptionStatus = e),
          "function" == typeof SyncManager.getDaysRemaining &&
            (window.subscriptionDaysLeft = SyncManager.getDaysRemaining(
              window.subscriptionData,
              e,
            )),
          !0
        );
      if ("grace" === e)
        return (
          globalThis.logSubscriptionDebugEvent?.(
            "newtab.subscription.can_modify.corrected_to_grace",
            {
              originalStatus: t,
              correctedStatus: e,
              subscription: window.subscriptionData || null,
            },
          ),
          (window.subscriptionStatus = "grace"),
          "function" == typeof SyncManager.getDaysRemaining &&
            (window.subscriptionDaysLeft = SyncManager.getDaysRemaining(
              window.subscriptionData,
              "grace",
            )),
          showGlassToast("Refresh account status before editing.", "warning"),
          !1
        );
    }
    return (
      globalThis.logSubscriptionDebugEvent?.(
        "newtab.subscription.can_modify.block_expired",
        { status: t, subscription: window.subscriptionData || null },
      ),
      showGlassToast(
        getExpiredSubscriptionMessage(window.subscriptionData),
        "error",
      ),
      showExpiredOverlay(),
      !1
    );
  }
  if ("plan_required" === t)
    return (
      globalThis.logSubscriptionDebugEvent?.(
        "newtab.subscription.can_modify.block_plan_required",
        { status: t, subscription: window.subscriptionData || null },
      ),
      showRequiredPlanSelectionForCurrentUser(
        t,
        window.subscriptionData || null,
      ).catch((e) => {
        console.warn(
          "[Onboarding] Failed to reopen plan selection from mutation guard:",
          e,
        );
      }),
      showGlassToast("Choose a LumiList plan before editing.", "warning"),
      !1
    );
  if (null == t) {
    const t = window.cachedSubscriptionStatus;
    if (e && ("trial" === t || "active" === t) && isTransientSyncDegraded()) {
      const e = Date.now();
      return (
        e - window._lastDegradedStatusToastAt > 15e3 &&
          ((window._lastDegradedStatusToastAt = e),
          showGlassToast(
            llLiteral(
              "Network issue detected. Changes will be saved locally and synced when connection recovers.",
            ),
            "warning",
          )),
        !0
      );
    }
    const r = Date.now();
    return (
      r - window._lastUnknownStatusToastAt > 5e3 &&
        ((window._lastUnknownStatusToastAt = r),
        showGlassToast(
          "Refreshing account status. Please wait a moment and try again.",
          "warning",
        )),
      !1
    );
  }
  return (console.warn("canModify: Unknown status:", t), !1);
}
function createWebsiteAuthHandoff(e) {
  const t =
      "undefined" != typeof crypto && "function" == typeof crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    r = new URL(e);
  r.searchParams.set("handoff", t);
  const a = r.toString(),
    o = r.origin,
    n = r.pathname.replace(/\/+$/, "") || "/";
  let i = !1,
    s = null;
  const delay = (e) =>
      new Promise((t) => {
        window.setTimeout(t, e);
      }),
    closeTab = (e) => {
      if (Number.isInteger(e) && chrome.tabs?.remove)
        try {
          chrome.tabs.remove(e, () => {
            chrome.runtime;
          });
        } catch {}
    },
    l = new Promise((e, t) => {
      if (chrome.tabs?.create)
        try {
          chrome.tabs.create({ url: a, active: !0 }, (r) => {
            const a = chrome.runtime?.lastError;
            if (a)
              t(new Error(a.message || "Could not open the billing page."));
            else if (Number.isInteger(r?.id)) {
              if (((s = r.id), i))
                return (
                  closeTab(r.id),
                  void t(new Error("Billing handoff was cancelled."))
                );
              e(r);
            } else t(new Error("Billing tab did not return a valid tab ID."));
          });
        } catch (e) {
          t(e);
        }
      else t(new Error("Browser tab API is unavailable."));
    });
  l.catch(() => {});
  const injectToken = (e, r) =>
    new Promise((a, i) => {
      chrome.scripting?.executeScript
        ? chrome.scripting.executeScript(
            {
              target: { tabId: e },
              func: (e, t, r, a, o, n) => {
                try {
                  const i = new URL(window.location.href),
                    s = i.pathname.replace(/\/+$/, "") || "/";
                  return i.origin !== e
                    ? { stored: !1, reason: "origin" }
                    : s !== t
                      ? { stored: !1, reason: "path" }
                      : i.searchParams.get("handoff") !== r
                        ? { stored: !1, reason: "nonce" }
                        : (window.sessionStorage.setItem(
                            a,
                            JSON.stringify({ nonce: r, token: o, issuedAt: n }),
                          ),
                          { stored: !0 });
                } catch (e) {
                  return { stored: !1, reason: e?.message || "storage" };
                }
              },
              args: [o, n, t, "lumilist_extension_auth_handoff", r, Date.now()],
            },
            (e) => {
              const t = chrome.runtime?.lastError;
              t
                ? i(
                    new Error(
                      t.message || "Could not inject the billing session.",
                    ),
                  )
                : a(!0 === e?.some((e) => !0 === e?.result?.stored));
            },
          )
        : i(new Error("Browser scripting API is unavailable."));
    });
  return {
    tabPromise: l,
    handoffUrl: a,
    deliver: async (e) => {
      const t = await l,
        r = Date.now() + 15e3;
      let a = null;
      for (; !i && Date.now() < r; ) {
        try {
          if (await injectToken(t.id, e)) return;
        } catch (e) {
          a = e;
        }
        await delay(125);
      }
      if (i) throw new Error("Billing handoff was cancelled.");
      throw (
        a || new Error("Billing page did not accept the authenticated session.")
      );
    },
    cancel: () => {
      ((i = !0), null !== s && closeTab(s), l.catch(() => {}));
    },
  };
}
async function openSubscribePage(e = null) {
  if (
    requiresPaymentRecovery(window.subscriptionData || null) ||
    requiresCheckoutResume(window.subscriptionData || null)
  )
    return void (await openManageSubscriptionPage());
  if (void 0 === LUMILIST_FREE_ACCESS_ENABLED || LUMILIST_FREE_ACCESS_ENABLED)
    return void showGlassToast(llT("toast.accountActive"), "success");
  !0 === window.subscriptionData?.lifetime_offer?.assigned && (e = "lifetime");
  const t = new URL("https://lumilist.in/subscribe");
  (addLanguageParamToWebsiteUrl(t),
    ("monthly" !== e && "yearly" !== e && "lifetime" !== e) ||
      t.searchParams.set("plan", e),
    window.LumiListIndiaPricing?.addCheckoutContext(
      t,
      window.subscriptionData,
      e,
    ));
  const r = createWebsiteAuthHandoff(t.toString());
  if (r)
    try {
      const e = await SyncManager.getUser();
      if (!e || !e.id)
        return (
          console.error("openSubscribePage: No user or user.id", { user: e }),
          r.cancel(),
          void showGlassToast(llT("toast.signInFirst"), "error")
        );
      if (!(await SyncManager._isUserContextCurrent(e.id)))
        return (
          r.cancel(),
          void showGlassToast(llT("toast.authFailed"), "error")
        );
      const t = await getSupabaseAccessToken(e.id, { minValidityMs: 3e6 });
      if (!t)
        return (
          r.cancel(),
          void showGlassToast(llT("toast.authFailed"), "error")
        );
      if (!(await SyncManager._isUserContextCurrent(e.id)))
        return (
          r.cancel(),
          void showGlassToast(llT("toast.authFailed"), "error")
        );
      await r.deliver(t);
    } catch (e) {
      (console.error("openSubscribePage: Error:", e),
        r.cancel(),
        showGlassToast(llT("toast.openSubscribeFailed"), "error"));
    }
  else showGlassToast(llT("toast.popupBlocked"), "warning");
}
async function openFirstYearOfferPage() {
  if (!FIRST_YEAR_OFFER_ENABLED)
    return void (await openSubscribePage("yearly"));
  const e = new URL(FIRST_YEAR_OFFER_PAGE_URL);
  (addLanguageParamToWebsiteUrl(e),
    e.searchParams.set("source", "extension"),
    window.open(e.toString(), "_blank") ||
      showGlassToast(llT("toast.popupBlocked"), "warning"));
}
function initSubscriptionListeners() {
  const e = document.getElementById("graceSubscribeBtn");
  e &&
    e.addEventListener("click", () =>
      openSubscribePage(
        !0 === window.subscriptionData?.lifetime_offer?.assigned
          ? "lifetime"
          : "yearly",
      ),
    );
  const t = document.getElementById("expiredOverlay");
  t &&
    t.addEventListener("click", (e) => {
      const t = e.target.closest(".subscribe-btn");
      t && openSubscribePage(t.dataset.plan || "yearly");
    });
  const r = document.getElementById("expiredRecoveryBtn");
  r && r.addEventListener("click", () => openManageSubscriptionPage());
  const a = document.getElementById("expiredFirstYearOfferBtn");
  a && a.addEventListener("click", () => openFirstYearOfferPage());
  const o = document.getElementById("expiredSettingsBtn");
  o &&
    o.addEventListener("click", (e) => {
      (e.preventDefault(), openSettingsModal({ initialTab: "account" }));
    });
  const n = document.getElementById("settingsSubscribeBtn");
  n &&
    n.addEventListener("click", () => {
      if (
        void 0 === LUMILIST_FREE_ACCESS_ENABLED ||
        LUMILIST_FREE_ACCESS_ENABLED
      )
        return void openManageSubscriptionPage();
      const e = "cancelled" === window.subscriptionData?.status,
        t = "active" === window.subscriptionStatus;
      requiresPaymentRecovery(window.subscriptionData) || (e && t)
        ? openManageSubscriptionPage()
        : openSubscribePage(
            !0 === window.subscriptionData?.lifetime_offer?.assigned
              ? "lifetime"
              : "yearly",
          );
    });
  const i = document.getElementById("settingsManageSubBtn");
  i && i.addEventListener("click", openManageSubscriptionPage);
  const s = document.getElementById("settingsDownloadBookmarkDataBtn");
  (s &&
    s.addEventListener("click", () => {
      handleDownloadBookmarkData(s);
    }),
    initTrialBanner(),
    initTrialWarningBanner());
}
async function resolveSettingsSubscriptionSnapshot() {
  let e = isKnownSettingsSubscriptionStatus(window.subscriptionStatus)
      ? window.subscriptionStatus
      : null,
    t = Number.isFinite(window.subscriptionDaysLeft)
      ? window.subscriptionDaysLeft
      : 0,
    r = window.subscriptionData || null;
  if (
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager.getStoredSubscriptionStatus
  )
    try {
      const a = await SyncManager.getStoredSubscriptionStatus();
      a &&
        (isKnownSettingsSubscriptionStatus(a.status) && (e = a.status),
        Number.isFinite(a.daysLeft) && (t = a.daysLeft),
        a.subscription && (r = a.subscription));
    } catch (e) {
      console.warn("Failed to read stored subscription state for settings:", e);
    }
  if (
    (null === e || "expired" === e) &&
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager.fetchSubscriptionFromServer
  )
    try {
      const a = await SyncManager.fetchSubscriptionFromServer();
      a &&
        (isKnownSettingsSubscriptionStatus(a.status) && (e = a.status),
        Number.isFinite(a.daysLeft) && (t = a.daysLeft),
        a.subscription && (r = a.subscription),
        isKnownSettingsSubscriptionStatus(a.status) &&
          "function" == typeof SyncManager.storeSubscriptionStatus &&
          (await SyncManager.storeSubscriptionStatus(
            a.status,
            Number.isFinite(a.daysLeft) ? a.daysLeft : 0,
            a.subscription || null,
          )));
    } catch (e) {
      console.warn("Failed to refresh subscription state for settings:", e);
    }
  return (
    (null !== e || r) &&
      ((window.subscriptionStatus = e),
      (window.subscriptionDaysLeft = Number.isFinite(t) ? t : 0),
      (window.subscriptionData = r || null)),
    { status: e, daysLeft: Number.isFinite(t) ? t : 0, subscription: r }
  );
}
function hasHistoricalBillingForSettings(e) {
  return (
    !(!e || "object" != typeof e) &&
    !0 !== e.free_workspace_access &&
    "free" !==
      String(e.plan || "")
        .trim()
        .toLowerCase() &&
    Boolean(
      e.razorpay_subscription_id ||
      e.subscription_started_at ||
      e.subscription_ends_at ||
      e.billing_cycle_ends_at ||
      e.grace_ends_at,
    )
  );
}
function setSettingsSubscriptionSectionVisible(e) {
  const t = document.getElementById("settingsSubscriptionSection");
  t && (t.style.display = "none");
}
function hasGrandfatheredBillingVisibilityForSettings() {
  return Boolean(
    window.LumiListPicks &&
    "function" == typeof window.LumiListPicks.isAdFreeUser &&
    window.LumiListPicks.isAdFreeUser(),
  );
}
async function updateSettingsSubscriptionDisplay() {
  const e = document.getElementById("settingsSubscriptionStatus"),
    t = document.getElementById("settingsSubscriptionInfo"),
    r = document.getElementById("settingsSubscribeBtn"),
    a = document.getElementById("settingsManageSubBtn"),
    o = document.getElementById("settingsSubscriptionSection"),
    n = {
      "settings.billing.existing": "Existing billing is available to manage.",
      "settings.billing.checking": "Checking",
      "settings.billing.fetching": "Fetching billing information\u2026",
      "settings.billing.active": "Active",
      "settings.billing.trial": "Trial",
      "settings.billing.premium": "Premium",
      "settings.billing.cancelled": "Cancelled",
      "settings.billing.grace": "Grace Period",
      "settings.billing.paymentFailed": "Payment Failed",
      "settings.billing.checkout": "Checkout",
      "settings.billing.expired": "Expired",
      "settings.billing.daysRemaining": "{days} days remaining",
      "settings.billing.renewsIn": "Renews in {days} days",
      "settings.billing.endsIn": "Ends in {days} days",
      "settings.billing.cancelledInfo":
        "Access until end of period ({days} days)",
      "settings.billing.cancelledDone": "Subscription cancelled",
      "settings.billing.readOnlyEnds": "Read-only access ends in {days} days",
      "settings.billing.subscribeWithin": "Subscribe within {days} days",
      "settings.billing.finishCheckout":
        "Finish the checkout you already started to continue using LumiList",
      "settings.billing.updatePayment":
        "Update your payment method to continue using LumiList",
      "settings.billing.refreshToContinue": "Refresh LumiList to continue",
      "settings.billing.refreshing":
        "Refreshing account status. Please try again in a moment.",
      "common.subscribe": "Subscribe",
      "settings.billing.resubscribe": "Resubscribe",
      "settings.billing.fixPayment": "Fix Payment Method",
      "settings.billing.continueCheckout": "Continue Checkout",
      "settings.billing.lifetime": "Lifetime Access",
      "settings.billing.testLifetime": "Test Lifetime Access",
      "settings.billing.premiumActive":
        "Your LumiList Premium access is active.",
      "settings.billing.getLifetime": "Get Lifetime Access",
      "settings.billing.manageExisting": "View Billing Details",
      "common.manageBilling": "Manage Billing",
      "common.refresh": "Refresh",
    },
    i =
      "function" == typeof llT
        ? llT
        : (e, t = {}) =>
            String(n[e] || e).replace(/\{(\w+)\}/g, (e, r) =>
              Object.prototype.hasOwnProperty.call(t, r) ? t[r] : "",
            );
  if (!(e && t && r && a)) return;
  const s = (updateSettingsSubscriptionDisplay.requestId || 0) + 1;
  updateSettingsSubscriptionDisplay.requestId = s;
  const l =
    "function" == typeof getActiveStoredUserId ? getActiveStoredUserId() : null;
  (setSettingsSubscriptionSectionVisible(!0),
    o?.setAttribute && o.setAttribute("aria-busy", "true"),
    e.classList.remove(
      "is-trial",
      "is-active",
      "is-cancelled",
      "is-grace",
      "is-expired",
    ),
    e.classList.add("is-loading"),
    (e.textContent = i("settings.billing.checking")),
    t.classList.remove("is-warning", "is-danger"),
    t.classList.add("is-loading"),
    (t.textContent = i("settings.billing.fetching")),
    (t.style.display = "inline-flex"),
    (r.style.display = "none"),
    (a.style.display = "none"));
  const c = await resolveSettingsSubscriptionSnapshot(),
    d =
      l &&
      ("function" != typeof getActiveStoredUserId ||
        getActiveStoredUserId() !== l);
  if (updateSettingsSubscriptionDisplay.requestId !== s || d) return;
  const u = c.status ?? null,
    p = Number.isFinite(c.daysLeft) ? c.daysLeft : 0,
    m = c.subscription || null,
    g = hasHistoricalBillingForSettings(m),
    f = hasGrandfatheredBillingVisibilityForSettings(),
    h =
      !(
        void 0 === LUMILIST_FREE_ACCESS_ENABLED || LUMILIST_FREE_ACCESS_ENABLED
      ) &&
      (null !== u || Boolean(m));
  if (!g && !f && !h)
    return (
      o?.setAttribute && o.setAttribute("aria-busy", "false"),
      void setSettingsSubscriptionSectionVisible(!1)
    );
  if (
    (setSettingsSubscriptionSectionVisible(!0),
    o?.setAttribute && o.setAttribute("aria-busy", "false"),
    e.classList.remove(
      "is-loading",
      "is-trial",
      "is-active",
      "is-cancelled",
      "is-grace",
      "is-expired",
    ),
    t.classList.remove("is-loading", "is-warning", "is-danger"),
    (a.style.display = "none"),
    !g && f)
  )
    return (
      (e.textContent = i("settings.billing.active")),
      e.classList.add("is-active"),
      (t.textContent = i("settings.billing.existing")),
      (t.style.display = "block"),
      (r.style.display = "none"),
      void (a.style.display = "block")
    );
  if ("trial" === u)
    ((e.textContent = i("settings.billing.trial")),
      e.classList.add("is-trial"),
      (t.textContent = i("settings.billing.daysRemaining", { days: p })),
      (t.style.display = "block"),
      (r.textContent = i("common.subscribe")),
      (r.style.display = "block"));
  else if ("active" === u) {
    const o = "cancelled" === m?.status,
      n = !0 === m?.lifetime_access || "lifetime" === m?.plan;
    ((e.textContent = i(
      n
        ? !0 === m?.test_access_preview
          ? "settings.billing.testLifetime"
          : "settings.billing.lifetime"
        : o
          ? "settings.billing.cancelled"
          : "settings.billing.premium",
    )),
      e.classList.add(o ? "is-cancelled" : "is-active"),
      n
        ? ((t.textContent = i("settings.billing.premiumActive")),
          (t.style.display = "block"))
        : p > 0
          ? ((t.textContent = i(
              o ? "settings.billing.endsIn" : "settings.billing.renewsIn",
              { days: p },
            )),
            o && t.classList.add("is-warning"),
            (t.style.display = "block"))
          : (t.style.display = "none"),
      (r.style.display = "none"),
      (a.style.display = "block"));
  } else if ("cancelled" === u)
    ((e.textContent = i("settings.billing.cancelled")),
      e.classList.add("is-cancelled"),
      t.classList.add("is-warning"),
      (t.textContent =
        p > 0
          ? i("settings.billing.cancelledInfo", { days: p })
          : i("settings.billing.cancelledDone")),
      (t.style.display = "block"),
      (r.textContent = i("settings.billing.resubscribe")),
      (r.style.display = "block"));
  else if ("grace" === u) {
    const a = isPaymentFailureSubscriptionState(m);
    ((e.textContent = i(
      a ? "settings.billing.paymentFailed" : "settings.billing.grace",
    )),
      e.classList.add("is-grace"),
      t.classList.add("is-warning"),
      (t.textContent = i(
        a
          ? "settings.billing.readOnlyEnds"
          : "settings.billing.subscribeWithin",
        { days: p },
      )),
      (t.style.display = "block"),
      (r.textContent = i(
        a ? "settings.billing.fixPayment" : "common.manageBilling",
      )),
      (r.style.display = "block"));
  } else if ("expired" === u) {
    const a = requiresPaymentRecovery(m),
      o = requiresCheckoutResume(m);
    ((e.textContent = i(
      o ? "settings.billing.checkout" : "settings.billing.expired",
    )),
      e.classList.add(o ? "is-grace" : "is-expired"),
      t.classList.add(o ? "is-warning" : "is-danger"),
      (t.textContent = i(
        o
          ? "settings.billing.finishCheckout"
          : a
            ? "settings.billing.updatePayment"
            : "settings.billing.refreshToContinue",
      )),
      (t.style.display = "block"),
      (r.textContent = i(
        o
          ? "settings.billing.continueCheckout"
          : a
            ? "settings.billing.fixPayment"
            : "common.refresh",
      )),
      (r.style.display = "block"));
  } else
    ((e.textContent = i("settings.billing.checking")),
      t.classList.add("is-warning"),
      (t.textContent = i("settings.billing.refreshing")),
      (t.style.display = "block"),
      (r.textContent = i("common.refresh")),
      (r.style.display = "block"));
}
async function openManageSubscriptionPage() {
  forceNextVisibilitySubscriptionCheck = !0;
  const e = createWebsiteAuthHandoff(
    addLanguageParamToWebsiteUrl(
      new URL("https://lumilist.in/manage"),
    ).toString(),
  );
  if (e)
    try {
      const t = await SyncManager.getUser();
      if (!t || !t.id)
        return (
          console.error("openManageSubscriptionPage: No user or user.id", {
            user: t,
          }),
          e.cancel(),
          void showGlassToast(llT("toast.signInManage"), "error")
        );
      if (!(await SyncManager._isUserContextCurrent(t.id)))
        return (
          e.cancel(),
          void showGlassToast(llT("toast.authFailed"), "error")
        );
      const r = await getSupabaseAccessToken(t.id, { minValidityMs: 3e6 });
      if (!r)
        return (
          e.cancel(),
          void showGlassToast(llT("toast.authFailed"), "error")
        );
      if (!(await SyncManager._isUserContextCurrent(t.id)))
        return (
          e.cancel(),
          void showGlassToast(llT("toast.authFailed"), "error")
        );
      await e.deliver(r);
    } catch (t) {
      (e.cancel(),
        console.error("Error opening manage subscription page:", t),
        showGlassToast(llT("toast.openSubscribeFailed"), "error"));
    }
  else showGlassToast(llT("toast.popupBlocked"), "warning");
}
function showAuthError(e) {
  const t = document.getElementById("authError"),
    r = document.getElementById("authSuccess");
  (t && ((t.textContent = llLiteral(e)), t.classList.add("visible")),
    r && r.classList.remove("visible"));
}
function showAuthSuccess(e) {
  const t = document.getElementById("authError"),
    r = document.getElementById("authSuccess");
  (r && ((r.textContent = llLiteral(e)), r.classList.add("visible")),
    t && t.classList.remove("visible"));
}
async function handleSessionInvalidation(
  e = "Session expired. Please login again.",
  t = {},
) {
  const r = normalizeRuntimeUserId(t.expectedUserId);
  if (
    r &&
    "undefined" != typeof SyncManager &&
    "function" == typeof SyncManager._isUserContextCurrent &&
    !(await SyncManager._isUserContextCurrent(r, { allowInvalidated: !0 }))
  )
    return (
      console.warn("Ignored stale session invalidation for a replaced account"),
      !1
    );
  if (r && !(await SyncManager.isSessionInvalidatedForUser(r))) {
    const e = await SyncManager._readStoredSupabaseSessionRecord({
      throwOnError: !0,
    });
    if (e?.rawValue || e?.session) return !1;
  }
  if ((showAuthError(e), _isHandlingSessionInvalidation)) return !1;
  _isHandlingSessionInvalidation = !0;
  try {
    return (
      (isCurrentTabAuthenticating = !1),
      (window.isCurrentTabAuthenticating = !1),
      clearLateAuthReconcileSuppression(),
      resetCrossTabLoginWaitState({
        clearPendingAuthChange: !0,
        clearPendingSignal: !0,
      }),
      resetSubscriptionUiForAccountBoundary(),
      (window.subscriptionStatus = null),
      (window.subscriptionDaysLeft = null),
      (window.subscriptionData = null),
      setWorkspaceOwnerUserId(null),
      setActiveStoredUserId(null),
      showWelcomeScreen(),
      resetAccountBoundaryTransientUi({ quickTourReason: "session_expired" }),
      history.replaceState(null, "", window.location.pathname),
      !0
    );
  } catch (e) {
    return (console.error("Error handling session invalidation:", e), !1);
  } finally {
    _isHandlingSessionInvalidation = !1;
  }
}
async function handleLogout() {
  if (isLogoutInProgress) return !1;
  let e = !1,
    t = !1,
    r = null;
  ((isLogoutInProgress = !0),
    (window.isLumiListLogoutInProgress = !0),
    (isCurrentTabAuthenticating = !0),
    (window.isCurrentTabAuthenticating = !0));
  try {
    (resetAccountBoundaryTransientUi({ quickTourReason: "logout" }),
      resetSubscriptionUiForAccountBoundary(),
      writeThemeBootstrapAuthHint(!1));
    const a = document.getElementById("welcomeScreen");
    (a && a.classList.remove("hidden"),
      document.body.classList.add("not-authenticated"),
      applyLoggedOutDefaultThemeUi());
    const o = document.getElementById("welcomeSyncing");
    if (
      (setWelcomeLoginButtonsState({ visible: !1, disabled: !1, loading: !1 }),
      o)
    ) {
      o.classList.remove("hidden");
      const e = o.querySelector("span");
      e && (e.textContent = llLiteral("Signing out..."));
    }
    let n = null;
    try {
      const e = await SyncManager.getStoredUser();
      n = e?.id || null;
    } catch (e) {
      console.warn("Failed to read stored user during logout:", e);
    }
    if (
      ((r = await SyncManager.logout({
        expectedUserId: n,
        preserveWorkspaceCheckpoint: !0,
      })),
      !0 !== r?.success)
    )
      throw ((t = !0), new Error("Account changed during logout"));
    (setWorkspaceOwnerUserId(null), setActiveStoredUserId(null));
    let i = await SyncManager.clearAccountWorkspaceSnapshot(n, () =>
      shouldProcessSharedStoredUserLogout(n),
    );
    if (
      (i ||
        (i = await SyncManager.clearAccountWorkspaceSnapshot(
          n,
          () => shouldProcessSharedStoredUserLogout(n),
          { requireEmpty: !0 },
        )),
      !i)
    )
      throw ((t = !0), new Error("Account workspace changed during logout"));
    if (
      (await clearPersistedThemeWallpaperState(),
      !(await SyncManager.clearAuth({
        expectedUserId: n,
        expectedSessionSnapshot: r.expectedSessionSnapshot,
        explicitLogout: !0,
      })) || !(await shouldProcessSharedStoredUserLogout(n)))
    )
      throw ((t = !0), new Error("Account changed before logout completed"));
    if (n && "undefined" != typeof chrome && chrome.storage?.local) {
      const e = `lumilist_onboarding_owner_${n}`;
      await chrome.storage.local.remove(e);
    }
    return (
      history.replaceState(null, "", window.location.pathname),
      showAuthSuccess("Signed out. Reloading..."),
      (e = !0),
      window.location.reload(),
      !0
    );
  } catch (e) {
    return (
      console.error("Logout error:", e),
      (t = !0),
      showAuthError("Logout failed"),
      !1
    );
  } finally {
    if (!e) {
      ((isLogoutInProgress = !1),
        (window.isLumiListLogoutInProgress = !1),
        (isCurrentTabAuthenticating = !1),
        (window.isCurrentTabAuthenticating = !1));
      const e = document.getElementById("welcomeSyncing");
      if (e) {
        e.classList.add("hidden");
        const t = e.querySelector("span");
        t && (t.textContent = llT("welcome.syncing"));
      }
      if (
        (setWelcomeLoginButtonsState({
          visible: !0,
          disabled: !1,
          loading: !1,
        }),
        setPendingWelcomeNotice({
          message: llLiteral("Logout failed"),
          variant: "error",
        }),
        t)
      ) {
        try {
          r?.logoutTransition &&
            (await SyncManager.clearLogoutTransition({
              expectedTransition: r.logoutTransition,
            }));
        } catch (e) {
          console.warn(
            "Failed to release the originating logout transition:",
            e,
          );
        }
        try {
          isLogoutInProgress ||
            isCurrentTabAuthenticating ||
            (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
              "explicit_logout_superseded",
            ));
        } catch (e) {
          console.warn(
            "Failed to recover replacement account after logout was superseded:",
            e,
          );
        }
      }
    }
  }
}
function openBugReportPage() {
  const e = chrome.runtime.getManifest().version,
    t = navigator.userAgent,
    r = navigator.platform,
    a = `https://github.com/sat008sat/lumilist-feedback/issues/new?title=${encodeURIComponent("Bug: [Brief description]")}&body=${encodeURIComponent(`## Description\n[Please describe the bug]\n\n## Steps to Reproduce\n1.\n2.\n3.\n\n## Expected Behavior\n[What should happen]\n\n## Actual Behavior\n[What actually happens]\n\n## Environment\n- Extension Version: ${e}\n- Browser: ${t}\n- OS: ${r}\n\n## Screenshots\n[Attach any relevant screenshots]\n`)}&labels[]=bug&labels[]=user-reported`;
  chrome.tabs.create({ url: a });
}
document.addEventListener("DOMContentLoaded", initSubscriptionListeners);
let isDeleteAccountInProgress = !1;
function closeDeleteAccountModal() {
  const e = document.getElementById("deleteAccountModal");
  e &&
    !isDeleteAccountInProgress &&
    ((activeDeleteAccountModalUserId = null), e.classList.remove("active"));
}
function getAccountDeletionContextUserId() {
  const e = getActiveStoredUserId(),
    t = normalizeRuntimeUserId(window.__lumilistWorkspaceOwnerUserId);
  return !e ||
    _crossTabLoginInProgress ||
    isCurrentTabAuthenticating ||
    (t && t !== e)
    ? null
    : e;
}
async function handleDeleteAccount() {
  if (isDeleteAccountInProgress) return;
  const e = getAccountDeletionContextUserId();
  if (!e)
    return void showGlassToast(llT("deleteAccount.signInAgain"), "warning");
  if (
    !(await SyncManager._isUserContextCurrent(e)) ||
    getAccountDeletionContextUserId() !== e ||
    isDeleteAccountInProgress
  )
    return void showGlassToast(llT("deleteAccount.staleRequest"), "warning");
  const t = document.getElementById("deleteAccountModal"),
    r = document.getElementById("deleteConfirmInput"),
    a = document.getElementById("confirmDeleteAccountBtn"),
    o = document.getElementById("deleteAccountError");
  if (!t || !r || !a) return;
  ((activeDeleteAccountModalUserId = e),
    (isDeleteAccountInProgress = !1),
    (r.value = ""),
    (a.disabled = !0),
    o && ((o.style.display = "none"), (o.textContent = "")));
  const n = document.getElementById("cancelDeleteAccountBtn");
  (n && ((n.disabled = !1), (n.style.display = "")),
    (r.disabled = !1),
    document.getElementById("settingsModal")?.classList.remove("active"),
    t.classList.add("active"),
    r.focus());
}
async function executeDeleteAccount() {
  const e = document.getElementById("deleteAccountModal"),
    t = document.getElementById("confirmDeleteAccountBtn"),
    r = document.getElementById("deleteAccountError"),
    a = document.getElementById("deleteConfirmInput"),
    o = document.getElementById("cancelDeleteAccountBtn");
  if (t.disabled) return;
  if (((t.disabled = !0), !isDeleteAccountConfirmationValid(a.value)))
    return (
      r &&
        ((r.textContent = llT("deleteAccount.confirmError")),
        (r.style.display = "block")),
      void (t.disabled = !1)
    );
  const n = normalizeRuntimeUserId(activeDeleteAccountModalUserId),
    i = getAccountDeletionContextUserId();
  if (!n || !i || n !== i)
    return (
      (t.disabled = !1),
      closeDeleteAccountModal(),
      void showGlassToast(llT("deleteAccount.staleRequest"), "warning")
    );
  ((isDeleteAccountInProgress = !0),
    o && ((o.disabled = !0), (o.style.display = "none")),
    a && (a.disabled = !0));
  const s = t.textContent;
  t.textContent = llT("common.deleting");
  const abortStaleAccountDeletion = () => {
    ((isDeleteAccountInProgress = !1),
      (t.disabled = !1),
      (t.textContent = s),
      o && ((o.disabled = !1), (o.style.display = "")),
      a && (a.disabled = !1),
      closeDeleteAccountModal(),
      showGlassToast(llT("deleteAccount.staleRequest"), "warning"));
  };
  try {
    const t = await getSupabaseAccessToken(n);
    if (!t)
      throw new Error("Authentication failed. Please try signing in again.");
    if (
      !(await SyncManager._isUserContextCurrent(n)) ||
      getAccountDeletionContextUserId() !== n ||
      activeDeleteAccountModalUserId !== n
    )
      return void abortStaleAccountDeletion();
    const r = new AbortController(),
      a = setTimeout(() => r.abort(), 15e3);
    let o;
    try {
      o = await fetch(`${SUPABASE_FUNCTIONS_URL}/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
          ...(globalThis.getLumiListDiagnosticHeaders?.({
            surface: "newtab",
          }) || {}),
        },
        body: JSON.stringify({}),
        signal: r.signal,
      });
    } finally {
      clearTimeout(a);
    }
    const i = await o.json();
    if (
      !(await SyncManager._isUserContextCurrent(n)) ||
      getAccountDeletionContextUserId() !== n ||
      activeDeleteAccountModalUserId !== n
    )
      return void abortStaleAccountDeletion();
    if (!o.ok) throw new Error(i.error || llT("deleteAccount.edgeFailed"));
    (e && e.classList.remove("active"),
      (activeDeleteAccountModalUserId = null),
      (isCurrentTabAuthenticating = !0),
      (window.isCurrentTabAuthenticating = !0));
    const s = await SyncManager.logout({ expectedUserId: n });
    if (!0 !== s?.success)
      return (
        abortStaleAccountDeletion(),
        void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
          "account_deletion_logout_superseded",
        ))
      );
    if (
      (setWorkspaceOwnerUserId(null),
      setActiveStoredUserId(null),
      !(await SyncManager.clearAccountWorkspaceSnapshot(n, () =>
        shouldProcessSharedStoredUserLogout(n),
      )))
    )
      return (
        abortStaleAccountDeletion(),
        void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
          "account_deletion_cleanup_changed",
        ))
      );
    if (
      !(await SyncManager.clearAuth({
        expectedUserId: n,
        expectedSessionSnapshot: s.expectedSessionSnapshot,
        explicitLogout: !0,
        accountDeletion: !0,
      })) ||
      !(await shouldProcessSharedStoredUserLogout(n))
    )
      return (
        abortStaleAccountDeletion(),
        void (await recoverCurrentAccountAfterSupersededWorkspaceMutation(
          "account_deletion_auth_cleanup_changed",
        ))
      );
    try {
      (localStorage.removeItem("lumilist_theme_mode"),
        localStorage.removeItem(WALLPAPER_LOCAL_CACHE_KEY),
        localStorage.removeItem(WALLPAPER_STYLE_LOCAL_CACHE_KEY),
        localStorage.removeItem(WALLPAPER_BINARY_CACHE_LOCAL_KEY));
    } catch (e) {}
    (history.replaceState(null, "", window.location.pathname),
      setPendingWelcomeNotice({
        message: llT("deleteAccount.deletedNotice"),
        variant: "error",
        durationMs: 6e4,
      }),
      clearAllColumns(),
      document.querySelectorAll(".board-menu").forEach((e) => e.remove()),
      showWelcomeScreen(),
      (isDeleteAccountInProgress = !1));
  } catch (e) {
    (console.error("Delete account error:", e),
      (t.textContent = s),
      (t.disabled = !1),
      o && ((o.disabled = !1), (o.style.display = "")),
      a && (a.disabled = !1),
      (isDeleteAccountInProgress = !1));
    const n =
      "AbortError" === e.name
        ? llT("deleteAccount.timeout")
        : e.message || llT("deleteAccount.failed");
    r && ((r.textContent = n), (r.style.display = "block"));
  } finally {
    ((isCurrentTabAuthenticating = !1),
      (window.isCurrentTabAuthenticating = !1),
      isDeleteAccountInProgress ||
        (t.textContent =
          t.textContent === llT("common.deleting") ? s : t.textContent));
  }
}
async function handleAuthRedirect(e = null, t = null) {
  const r = e || window.location.hash,
    a = new URLSearchParams(window.location.search),
    o = r.startsWith("#")
      ? new URLSearchParams(r.substring(1))
      : new URLSearchParams(),
    n = a.get("code"),
    i = "string" == typeof n && n.length > 0,
    s = o.has("access_token") || o.has("refresh_token"),
    l =
      o.has("error") ||
      o.has("error_description") ||
      a.has("error") ||
      a.has("error_description"),
    c = s || i || l,
    d = a.get("lumilist_oauth_nonce");
  let u = null;
  const clearAuthParamsFromUrl = () => {
    try {
      const e = new URL(window.location.href);
      ([
        "code",
        "state",
        "error",
        "error_code",
        "error_description",
        "type",
        "lumilist_oauth",
        "lumilist_oauth_nonce",
      ].forEach((t) => {
        e.searchParams.delete(t);
      }),
        (e.hash = ""),
        history.replaceState(null, "", `${e.pathname}${e.search}`));
    } catch (e) {
      history.replaceState(null, "", window.location.pathname);
    }
  };
  if (c) {
    const e =
      "undefined" != typeof SyncManager &&
      "function" == typeof SyncManager.consumePendingOAuthAttempt
        ? await SyncManager.consumePendingOAuthAttempt(d)
        : { valid: !1, reason: "oauth-attempt-validator-unavailable" };
    if (!e?.valid)
      return (
        console.warn(
          "Rejected OAuth callback without a matching fresh login attempt:",
          e?.reason || "unknown",
        ),
        clearAuthParamsFromUrl(),
        showWelcomeScreen(),
        showGlassToast(llLiteral("Login failed. Please try again."), "error"),
        !0
      );
    u = e.provider;
  }
  const isLikelyTransientAuthNetworkError = (e) => {
    const t = String(e?.message || e || "").toLowerCase();
    return (
      t.includes("timeout") ||
      t.includes("timed out") ||
      t.includes("failed to fetch") ||
      t.includes("network") ||
      t.includes("fetch failed")
    );
  };
  if (s || i || t) {
    ((isCurrentTabAuthenticating = !0),
      (window.isCurrentTabAuthenticating = !0));
    try {
      const e = t ? null : await readLumiListSessionMutationSnapshot(),
        a = document.getElementById("welcomeScreen"),
        o = document.getElementById("welcomeSyncing");
      (a && a.classList.remove("hidden"),
        setWelcomeLoginButtonsState({ visible: !1, disabled: !1, loading: !1 }),
        o && o.classList.remove("hidden"));
      const s = o ? o.querySelector("span") : null;
      let l = null,
        c = null;
      const d = SyncManager.getSupabase();
      if (!d)
        return (
          setWelcomeLoginButtonsState({
            visible: !0,
            disabled: !1,
            loading: !1,
          }),
          o && o.classList.add("hidden"),
          s && (s.textContent = llT("welcome.syncing")),
          showAuthError(
            "Login failed. Auth client is not initialized. Please refresh and try again.",
          ),
          clearAuthParamsFromUrl(),
          !0
        );
      if (t) {
        if (!(await SyncManager.adoptEmailSession(t.session, t.signal)))
          throw new Error("email_auth_context_changed");
        l = t.session.user;
      }
      if (d && r)
        try {
          const t = new URLSearchParams(r.substring(1)),
            a = t.get("access_token"),
            o = t.get("refresh_token");
          if (a && o) {
            const t = `${a.substring(0, 32)}.${o.substring(0, 32)}`,
              r = await chrome.storage.local.get("_lastProcessedToken");
            let n = !0;
            if (r._lastProcessedToken === t) {
              clearAuthParamsFromUrl();
              const { data: e } = await d.auth.getSession();
              e?.session?.user
                ? ((l = e.session.user), (n = !1))
                : await chrome.storage.local.remove("_lastProcessedToken");
            }
            if (n) {
              (s && (s.textContent = llLiteral("Authenticating...")),
                await chrome.storage.local.set({ _lastProcessedToken: t }));
              try {
                const t = withLumiListSessionCommitIntent(
                    e,
                    () =>
                      d.auth.setSession({ access_token: a, refresh_token: o }),
                    { timeoutMs: window.AUTH_TIMEOUTS?.SET_SESSION || 1e4 },
                  ),
                  { data: r, error: n } = await t;
                n
                  ? (console.error(
                      "Failed to set session from tokens:",
                      n.message,
                    ),
                    (c = n.message || c))
                  : r?.user && ((l = r.user), clearAuthParamsFromUrl());
              } catch (e) {
                if (e?.isSessionDeferred)
                  return (
                    clearAuthParamsFromUrl(),
                    await recoverCurrentAccountAfterSupersededWorkspaceMutation(
                      "oauth_token_commit_superseded",
                    ),
                    !0
                  );
                (console.error("setSession error:", e.message),
                  (c = e.message || c));
              }
            }
          }
        } catch (e) {
          console.error("Error parsing OAuth tokens:", e);
        }
      if (!l && i) {
        s && (s.textContent = llLiteral("Authenticating..."));
        const exchangeCode = async () =>
          withLumiListSessionCommitIntent(
            e,
            () => d.auth.exchangeCodeForSession(n),
            { timeoutMs: window.AUTH_TIMEOUTS?.SET_SESSION || 1e4 },
          );
        for (let e = 0; e < 3 && !l; e++)
          try {
            const { data: e, error: t } = await exchangeCode();
            if (t)
              throw (
                (c = t.message || c),
                new Error(t.message || "exchangeCodeForSession failed")
              );
            if (((l = e?.user || e?.session?.user || null), l)) {
              clearAuthParamsFromUrl();
              break;
            }
          } catch (t) {
            if (t?.isSessionDeferred)
              return (
                clearAuthParamsFromUrl(),
                await recoverCurrentAccountAfterSupersededWorkspaceMutation(
                  "oauth_code_commit_superseded",
                ),
                !0
              );
            if (
              ((c = t.message || c),
              console.error("OAuth code exchange failed:", t.message || t),
              e < 2 && isLikelyTransientAuthNetworkError(t))
            ) {
              await new Promise((t) => setTimeout(t, 500 * (e + 1)));
              continue;
            }
            break;
          }
      }
      if (!l) {
        (s && (s.textContent = llLiteral("Connecting...")),
          await new Promise((e) => setTimeout(e, 1e3)));
        for (let e = 0; e < 5; e++) {
          s &&
            e > 0 &&
            (s.textContent = llT("auth.connectingAttempt", {
              attempt: e + 1,
              total: 5,
            }));
          try {
            const e = d.auth.getSession(),
              t = new Promise((e, t) =>
                setTimeout(
                  () => t(new Error("getSession timeout")),
                  window.AUTH_TIMEOUTS?.GET_SESSION || 5e3,
                ),
              ),
              { data: r } = await Promise.race([e, t]);
            if (r?.session?.user) {
              l = r.session.user;
              break;
            }
          } catch (t) {
            console.warn("getSession attempt", e + 1, "failed:", t.message);
          }
          await new Promise((t) => setTimeout(t, 500 * (e + 1)));
        }
      }
      if (!l)
        return (
          console.error("OAuth login failed - could not retrieve user"),
          setWelcomeLoginButtonsState({
            visible: !0,
            disabled: !1,
            loading: !1,
          }),
          o && o.classList.add("hidden"),
          s && (s.textContent = llT("welcome.syncing")),
          showAuthError(c || "Login failed. Please try again."),
          clearAuthParamsFromUrl(),
          !0
        );
      const u = normalizeSupabaseUserId(l.id);
      if (!u)
        return (
          console.error(
            "OAuth login failed - Supabase returned an invalid user identifier",
          ),
          setWelcomeLoginButtonsState({
            visible: !0,
            disabled: !1,
            loading: !1,
          }),
          o && o.classList.add("hidden"),
          s && (s.textContent = llT("welcome.syncing")),
          showAuthError(c || "Login failed. Please try again."),
          clearAuthParamsFromUrl(),
          !0
        );
      if (
        (l.id !== u && (l = { ...l, id: u }),
        !(await shouldProcessSupabaseAuthStateChange("SIGNED_IN", { user: l })))
      )
        return (clearAuthParamsFromUrl(), !0);
      if (l?.id && "undefined" != typeof chrome && chrome.storage?.local) {
        const e = `lumilist_onboarding_owner_${l.id}`;
        await chrome.storage.local.set({
          [e]: {
            userId: l.id,
            tabId: TAB_INSTANCE_ID,
            timestamp: Date.now(),
            reason: "login-tab",
          },
        });
      }
      const p = await SyncManager.getStoredUser();
      if (p?.id && p.id !== l.id) {
        if (
          !(await shouldProcessSupabaseAuthStateChange("SIGNED_IN", {
            user: l,
          }))
        )
          return (clearAuthParamsFromUrl(), !0);
        try {
          await chrome.runtime.sendMessage({
            action: "clearSyncQueue",
            sourceUserId: p.id,
          });
        } catch (e) {
          console.warn(
            "Failed to stop background sync during OAuth account switch:",
            e,
          );
        }
        if (
          !(await SyncManager.clearAccountWorkspaceSnapshot(p.id, () =>
            shouldProcessSupabaseAuthStateChange("SIGNED_IN", { user: l }),
          ))
        )
          return (
            await recoverCurrentAccountAfterSupersededWorkspaceMutation(
              "oauth_account_switch_changed",
            ),
            clearAuthParamsFromUrl(),
            !0
          );
        if (
          !(await shouldProcessSupabaseAuthStateChange("SIGNED_IN", {
            user: l,
          }))
        )
          return (
            await recoverCurrentAccountAfterSupersededWorkspaceMutation(
              "oauth_account_switch_superseded",
            ),
            clearAuthParamsFromUrl(),
            !0
          );
        (setWorkspaceOwnerUserId(l.id),
          await resetWallpaperStateForAccountBoundary({
            clearPersistedState: !0,
          }));
      }
      if (
        !1 ===
        (await SyncManager.setStoredUser({
          id: l.id,
          email: l.email,
          createdAt: l.created_at || l.createdAt || null,
        }))
      )
        return (clearAuthParamsFromUrl(), !0);
      (setActiveStoredUserId(l.id),
        setWallpaperAccountScopeUserId(l.id),
        await loadWallpaperCloudSyncStateFromStorage(l.id));
      try {
        s && (s.textContent = llLiteral("Syncing data..."));
        const e = await SyncManager.syncOnLogin();
        if (!e.success)
          return e.isAccountChange
            ? (clearAuthParamsFromUrl(), !0)
            : (console.error("Login sync failed:", e.error),
              clearAuthParamsFromUrl(),
              await showWorkspaceLoadFailure(
                "Login succeeded, but we could not load your data. Please refresh and try again.",
              ),
              !0);
        if (!(await SyncManager._isUserContextCurrent(l.id)))
          return (clearAuthParamsFromUrl(), !0);
        if ((clearLateAuthReconcileSuppression(), "imported" === e.action));
        else if ("created_home" === e.action)
          try {
            await chrome.storage.local.set({
              [WALLPAPER_NEW_USER_DEFAULT_SEED_STORAGE_KEY]: {
                userId: l.id,
                createdAt: Date.now(),
              },
            });
          } catch (e) {
            console.warn(
              "Failed to queue pending new-user wallpaper default seed:",
              e,
            );
          }
        if (!(await SyncManager._isUserContextCurrent(l.id)))
          return (clearAuthParamsFromUrl(), !0);
        if (
          (await refreshRuntimeSubscriptionStateFromStorage(),
          !(
            await revealVerifiedLocalWorkspaceForUser(l.id, {
              source: "post-login-sync",
              skipOnboarding: "created_home" === e.action,
            })
          ).success)
        )
          return (
            clearAuthParamsFromUrl(),
            await showWorkspaceLoadFailure(
              "Login succeeded, but we could not load your data. Please refresh and try again.",
            ),
            !0
          );
        "created_home" === e.action && (await checkShowOnboarding(!0));
      } catch (e) {
        return (await SyncManager._isUserContextCurrent(l.id))
          ? (console.error("Post-auth sync error:", e),
            clearAuthParamsFromUrl(),
            await showWorkspaceLoadFailure(
              "Login succeeded, but we could not load your data. Please refresh and try again.",
            ),
            !0)
          : (clearAuthParamsFromUrl(), !0);
      }
      return (clearAuthParamsFromUrl(), !0);
    } finally {
      ((isCurrentTabAuthenticating = !1),
        (window.isCurrentTabAuthenticating = !1));
    }
  }
  if (l) {
    const e =
      o.get("error_description") ||
      a.get("error_description") ||
      o.get("error") ||
      a.get("error");
    return (
      showWelcomeScreen(),
      showWelcomeLoginFailure(
        {
          error: e,
          code:
            o.get("error_code") ||
            a.get("error_code") ||
            o.get("error") ||
            a.get("error"),
        },
        u,
      ),
      clearAuthParamsFromUrl(),
      !0
    );
  }
  return !1;
}
let welcomeLoginProvider = null;
function resetWelcomeEmailForm({ enabled: e = !1 } = {}) {
  const t = document.getElementById("welcomeLoginArea"),
    r = document.getElementById("welcomeEmailPanel");
  t &&
    r &&
    (window.LumiListEmailAuth?.close({
      authenticating: isCurrentTabAuthenticating,
    }),
    (r.inert = !e),
    e && window.LumiListEmailAuth?.open({ focus: !1 }));
}
function setupWelcomeEmailForm() {
  const e = document.getElementById("welcomeLoginArea"),
    t = document.getElementById("welcomeEmailBtn");
  e &&
    t &&
    (t.addEventListener("click", () => {
      window.LumiListEmailAuth?.submit();
    }),
    window.LumiListEmailAuth?.init({
      translate: llT,
      authenticate: (e, t) =>
        handleAuthRedirect(null, { session: e, signal: t }),
    }),
    resetWelcomeEmailForm({ enabled: !e.hidden && !welcomeLoginProvider }),
    e.addEventListener("keydown", (e) => {
      "Enter" === e.key &&
        e.target.matches("input") &&
        !e.isComposing &&
        (e.preventDefault(), window.LumiListEmailAuth?.submit());
    }),
    window.addEventListener("pagehide", () => resetWelcomeEmailForm()),
    window.addEventListener("pageshow", (t) => {
      !t.persisted ||
        e.hidden ||
        welcomeLoginProvider ||
        resetWelcomeEmailForm({ enabled: !0 });
    }));
}
function expandWelcomeLoginOption(e = "google") {
  if (!welcomeLoginProvider || e === welcomeLoginProvider)
    for (const t of ["google", "apple", "email"]) {
      const r = t[0].toUpperCase() + t.slice(1);
      document
        .getElementById(`welcome${r}Btn`)
        ?.classList.toggle("is-expanded", t === e);
    }
}
function setupWelcomeLoginOptionExpansion() {
  const e = document.getElementById("welcomeLoginOptions");
  if (!e) return;
  const expandTarget = (t) => {
    const r = t.target.closest(".welcome-login-btn");
    r &&
      e.contains(r) &&
      !r.disabled &&
      expandWelcomeLoginOption(r.dataset.loginOption);
  };
  (e.addEventListener("pointerover", (t) => {
    (e.contains(document.activeElement) &&
      document.activeElement.matches(":focus-visible")) ||
      expandTarget(t);
  }),
    e.addEventListener("pointermove", (e) => {
      (e.movementX || e.movementY) && expandTarget(e);
    }),
    e.addEventListener("focusin", expandTarget),
    e.addEventListener("pointerleave", () => {
      const t = e.contains(document.activeElement)
        ? document.activeElement
        : null;
      expandWelcomeLoginOption(t?.dataset.loginOption || "google");
    }),
    e.addEventListener("focusout", (t) => {
      e.contains(t.relatedTarget) || expandWelcomeLoginOption();
    }));
}
function setWelcomeLoginButtonsState({
  visible: e = !0,
  disabled: t = !1,
  loading: r = !1,
  provider: a = null,
} = {}) {
  t || (welcomeLoginProvider = null);
  const o = document.getElementById("welcomeLoginArea");
  (o && (o.hidden = !e), resetWelcomeEmailForm({ enabled: e && !t }));
  const n = document.getElementById("welcomeLoginOptions");
  n && (n.hidden = !e);
  for (const o of ["google", "apple", "email"]) {
    const n = o[0].toUpperCase() + o.slice(1),
      i = "email" === o ? "common.signIn" : `welcome.signIn${n}`,
      s = document.getElementById(`welcome${n}Btn`);
    if (!s) continue;
    const l = r && a === o;
    ((s.style.display = e ? "" : "none"),
      (s.disabled = !!t),
      s.classList.toggle("is-loading", l),
      l ? s.setAttribute("aria-busy", "true") : s.removeAttribute("aria-busy"));
    const c = s.querySelector(".btn-text");
    c &&
      (l ? c.removeAttribute("data-i18n") : c.setAttribute("data-i18n", i),
      (c.textContent = l
        ? llT("welcome.openingProvider", { provider: n })
        : llT(i)),
      s.setAttribute("aria-label", c.textContent),
      l
        ? s.removeAttribute("data-i18n-aria-label")
        : s.setAttribute("data-i18n-aria-label", i));
  }
  expandWelcomeLoginOption(r && a ? a : "google");
}
function showWelcomeSyncingState(e = "") {
  const t = document.getElementById("welcomeScreen"),
    r = document.getElementById("welcomeSyncing");
  if (
    (t && t.classList.remove("hidden"),
    document.body.classList.add("not-authenticated"),
    setWelcomeLoginButtonsState({ visible: !1, disabled: !1, loading: !1 }),
    r)
  ) {
    r.classList.remove("hidden");
    const t = r.querySelector("span");
    t &&
      (t.textContent =
        "string" == typeof e && e.trim()
          ? llLiteral(e)
          : llLiteral("Syncing data..."));
  }
}
function scheduleCrossTabLoginWaitCheck(e = 5e3) {
  (_crossTabLoginTimeoutId && clearTimeout(_crossTabLoginTimeoutId),
    (_crossTabLoginTimeoutId = setTimeout(
      () => {
        ((_crossTabLoginTimeoutId = null),
          monitorCrossTabLoginWait().catch(async (e) => {
            console.error("Cross-tab login sync monitor failed:", e);
            const t = _pendingCrossTabLoginUserId;
            t &&
              (await SyncManager._isUserContextCurrent(t)) &&
              (await showWorkspaceLoadFailure(
                "We could not finish loading your data. Please refresh and try again.",
              ));
          }));
      },
      Math.max(0, Number(e) || 0),
    )));
}
async function recoverInterruptedCrossTabLogin(e) {
  if (!(await SyncManager._isUserContextCurrent(e)))
    return (resetCrossTabLoginWaitState(), !1);
  const t = await getStoredLoginSyncState();
  if (t?.userId === e && "pending" === t.phase) {
    if (
      ((_pendingCrossTabLoginGeneration = t.generation),
      isFreshPendingLoginSyncState(t, e))
    )
      return (scheduleCrossTabLoginWaitCheck(), !1);
    "function" == typeof SyncManager._clearLoginSyncState &&
      (await SyncManager._clearLoginSyncState(e, t.generation));
  }
  let r = await revealVerifiedLocalWorkspaceForUser(e, {
    source: "cross-tab-login-recovery",
  });
  if (!r.success && "account_changed" !== r.reason) {
    const t = await SyncManager.autoSyncOnLoad();
    if ("sync_in_progress" === t?.reason)
      return (scheduleCrossTabLoginWaitCheck(1e3), !1);
    if ("account_changed" === t?.status)
      return (resetCrossTabLoginWaitState(), !1);
    r = await revealVerifiedLocalWorkspaceForUser(e, {
      source: "cross-tab-login-recovery-after-sync",
    });
  }
  return r.success
    ? (clearLateAuthReconcileSuppression(),
      resetCrossTabLoginWaitState({
        clearPendingAuthChange: !0,
        clearPendingSignal: !0,
      }),
      !0)
    : ((await SyncManager._isUserContextCurrent(e)) &&
        (await showWorkspaceLoadFailure(
          "We could not finish loading your data. Please refresh and try again.",
        )),
      !1);
}
async function monitorCrossTabLoginWait() {
  const e = _pendingCrossTabLoginUserId;
  if (!e) return;
  if (!(await SyncManager._isUserContextCurrent(e)))
    return void resetCrossTabLoginWaitState();
  const t = await getStoredLoginSyncState();
  if (t?.userId !== e || "completed" !== t.phase)
    if (t?.userId !== e || "pending" !== t.phase)
      Date.now() - _crossTabLoginWaitStartedAt < 2e3
        ? scheduleCrossTabLoginWaitCheck(250)
        : await recoverInterruptedCrossTabLogin(e);
    else {
      if (
        ((_pendingCrossTabLoginGeneration = t.generation),
        isFreshPendingLoginSyncState(t, e))
      ) {
        const e = 45e3 - (Date.now() - t.timestamp);
        return void scheduleCrossTabLoginWaitCheck(
          Math.min(5e3, Math.max(100, e + 25)),
        );
      }
      await recoverInterruptedCrossTabLogin(e);
    }
  else
    await handleLoginSyncCompleteSignal({
      userId: e,
      timestamp: t.timestamp || Date.now(),
      action: t.action || null,
      generation: t.generation,
    });
}
function beginCrossTabLoginWait(e, t = null) {
  const r = normalizeSupabaseUserId(e);
  if (!r) return;
  const a = "string" == typeof t && t.trim() ? t.trim() : null,
    o = !_crossTabLoginInProgress || _pendingCrossTabLoginUserId !== r;
  ((_crossTabLoginInProgress = !0),
    (isColdWorkspaceHydrationPending = !0),
    (_pendingCrossTabLoginUserId = r),
    a && (_pendingCrossTabLoginGeneration = a),
    (!o && _crossTabLoginWaitStartedAt) ||
      (_crossTabLoginWaitStartedAt = Date.now()),
    setWorkspaceOwnerUserId(null),
    resetWallpaperStateForAccountBoundary({ clearPersistedState: !0 }).catch(
      (e) => {
        console.error(
          "Failed to reset wallpaper state while waiting for cross-tab login:",
          e,
        );
      },
    ),
    resetSubscriptionUiForAccountBoundary(),
    resetAccountBoundaryTransientUi({ quickTourReason: "account_boundary" }),
    showWelcomeSyncingState(),
    clearAllColumns(),
    scheduleCrossTabLoginWaitCheck(250));
}
async function handleLoginSyncCompleteSignal(e) {
  try {
    const t = normalizeSupabaseUserId(e?.userId);
    if (!t || isCurrentTabAuthenticating) return !1;
    const r = await SyncManager.getStoredUser(),
      a = normalizeSupabaseUserId(r?.id);
    if (!a || a !== t)
      return (
        _pendingCrossTabLoginUserId === t && resetCrossTabLoginWaitState(),
        !1
      );
    if (!(await SyncManager._isUserContextCurrent(t))) return !1;
    const o = await getStoredLoginSyncState();
    if (!isMatchingCompletedLoginSync(o, e))
      return (
        isFreshPendingLoginSyncState(o, t) &&
          beginCrossTabLoginWait(t, o.generation),
        !1
      );
    const n = Number(e.timestamp) || o.timestamp || 0;
    if (
      _lastLoginSyncSignal.userId === t &&
      _lastLoginSyncSignal.generation === o.generation &&
      _lastLoginSyncSignal.timestamp >= n
    )
      return !0;
    const i = await revealVerifiedLocalWorkspaceForUser(t, {
      source: "cross-tab-login-complete",
    });
    return i.success
      ? ((_lastLoginSyncSignal = {
          userId: t,
          generation: o.generation,
          timestamp: n,
          action: e.action || o.action || null,
        }),
        clearLateAuthReconcileSuppression(),
        _pendingCrossTabLoginUserId === t && resetCrossTabLoginWaitState(),
        _pendingAuthChange?.newValue?.id === t && (_pendingAuthChange = null),
        !0)
      : "account_changed" !== i.reason && recoverInterruptedCrossTabLogin(t);
  } catch (t) {
    console.error("Error handling login sync complete signal:", t);
    const r = normalizeSupabaseUserId(e?.userId);
    return (
      r &&
        (await SyncManager._isUserContextCurrent(r)) &&
        (await showWorkspaceLoadFailure(
          "We could not finish loading your data. Please refresh and try again.",
        )),
      !1
    );
  }
}
function normalizePendingWelcomeNotice(e) {
  if (!e || "object" != typeof e) return null;
  const t = "string" == typeof e.message ? e.message.trim() : "";
  if (!t) return null;
  const r =
      "string" == typeof e.variant ? e.variant.trim().toLowerCase() : "info",
    a = new Set(["success", "warning", "info", "error"]),
    o = Number(e.durationMs),
    n = Number.isFinite(o) && o > 0 ? o : null;
  return { message: t, variant: a.has(r) ? r : "info", durationMs: n };
}
function clearPendingWelcomeNoticeTimer() {
  pendingWelcomeNoticeTimeoutId &&
    (clearTimeout(pendingWelcomeNoticeTimeoutId),
    (pendingWelcomeNoticeTimeoutId = null));
}
function renderPendingWelcomeNotice() {
  const e = document.getElementById("welcomeNotice");
  if (e) {
    if (
      (e.classList.remove("success", "warning", "info", "error"),
      !pendingWelcomeNotice)
    )
      return ((e.textContent = ""), void e.classList.add("hidden"));
    ((e.textContent = pendingWelcomeNotice.message),
      e.classList.add(pendingWelcomeNotice.variant),
      e.classList.remove("hidden"));
  }
}
function setPendingWelcomeNotice(e) {
  (clearPendingWelcomeNoticeTimer(),
    (pendingWelcomeNotice = normalizePendingWelcomeNotice(e)),
    renderPendingWelcomeNotice(),
    pendingWelcomeNotice?.durationMs &&
      (pendingWelcomeNoticeTimeoutId = setTimeout(() => {
        ((pendingWelcomeNoticeTimeoutId = null), clearPendingWelcomeNotice());
      }, pendingWelcomeNotice.durationMs)));
}
function clearPendingWelcomeNotice() {
  (clearPendingWelcomeNoticeTimer(),
    (pendingWelcomeNotice = null),
    renderPendingWelcomeNotice());
}
function showWelcomeScreen(e = {}) {
  ((isColdWorkspaceHydrationPending = !1),
    resetSubscriptionUiForAccountBoundary());
  const t = document.getElementById("welcomeSyncing");
  if (
    (setWelcomeLoginButtonsState({ visible: !0, disabled: !1, loading: !1 }), t)
  ) {
    t.classList.add("hidden");
    const e = t.querySelector("span");
    e && (e.textContent = llT("welcome.syncing"));
  }
  renderPendingWelcomeNotice();
  const r = document.getElementById("welcomeScreen");
  (r && r.classList.remove("hidden"),
    document.body.classList.add("not-authenticated"),
    writeThemeBootstrapAuthHint(!1),
    applyLoggedOutDefaultThemeUi(),
    loadWallpaperCatalog()
      .then(() => {
        document.body?.classList?.contains("not-authenticated") &&
          applyLoggedOutDefaultThemeUi();
      })
      .catch((e) => {
        console.warn(
          "Failed to refresh welcome screen with packaged wallpaper default:",
          e,
        );
      }),
    !1 !== e.clearPersistedState && queueLoggedOutThemeReset());
}
function hideWelcomeScreen() {
  const e = document.getElementById("welcomeScreen");
  (e && e.classList.add("hidden"),
    document.body.classList.remove("not-authenticated"),
    writeThemeBootstrapAuthHint(!0));
  const t = document.getElementById("welcomeSyncing");
  (setWelcomeLoginButtonsState({ visible: !0, disabled: !1, loading: !1 }),
    t && t.classList.add("hidden"),
    clearPendingWelcomeNotice());
}
function isUserCancelledLoginError(e) {
  const t = String(e || "").toLowerCase();
  return (
    t.includes("login was cancelled before completion") ||
    t.includes("did not approve access") ||
    t.includes("login was canceled before completion")
  );
}
function showWelcomeLoginFailure(e, t) {
  "apple" === t && "provider_unavailable" === e.code
    ? showGlassToast(llT("welcome.appleUnavailable"), "info")
    : isUserCancelledLoginError(e.error) || "access_denied" === e.code
      ? showGlassToast(llT("welcome.loginCancelled"), "info")
      : "login_in_progress" === e.code
        ? showGlassToast(llT("welcome.loginInProgress"), "info")
        : showGlassToast(
            "offline" === e.code
              ? llT("welcome.offline")
              : llLiteral("Login failed. Please try again."),
            "error",
          );
}
async function handleWelcomeProviderLogin(e) {
  if (["apple"].includes(e) && !welcomeLoginProvider) {
    ((welcomeLoginProvider = e),
      clearPendingWelcomeNotice(),
      setWelcomeLoginButtonsState({
        visible: !0,
        disabled: !0,
        loading: !0,
        provider: e,
      }));
    try {
      pendingLoggedOutThemeResetPromise &&
        (await pendingLoggedOutThemeResetPromise);
      const t = await SyncManager.loginWithProvider(e);
      t.success ||
        t.redirecting ||
        (setWelcomeLoginButtonsState(), showWelcomeLoginFailure(t, e));
    } catch (t) {
      (setWelcomeLoginButtonsState(), showWelcomeLoginFailure({}, e));
    }
  }
}
const SUPABASE_FUNCTIONS_URL =
  "https://xbccmcszhnybxzlirjgk.supabase.co/functions/v1";
let currentShareModalData = null,
  shareModalInProgress = !1,
  isStopShareInProgress = !1;
async function createShare(e, t) {
  try {
    const r = await getCurrentStoredUserId();
    if (!r || !(await SyncManager._isUserContextCurrent(r)))
      return (showGlassToast("Please sign in to share content", "error"), null);
    const a = await getSupabaseAccessToken(r);
    if (!a)
      return (showGlassToast("Please sign in to share content", "error"), null);
    const o = new AbortController(),
      n = setTimeout(() => o.abort(), 15e3),
      i = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${a}`,
          ...(globalThis.getLumiListDiagnosticHeaders?.({
            surface: "newtab",
          }) || {}),
        },
        body: JSON.stringify({ share_type: e, item_id: t }),
        signal: o.signal,
      });
    clearTimeout(n);
    const s = await i.json();
    if (!(await SyncManager._isUserContextCurrent(r))) return null;
    if (!i.ok)
      return (
        showGlassToast(s.error || "Failed to create share", "error"),
        null
      );
    let l;
    try {
      l =
        "board" === e
          ? await updateBoard(t, { shareId: s.share_id }, { skipHistory: !0 })
          : await updatePage(t, { shareId: s.share_id }, { skipHistory: !0 });
    } catch (r) {
      return (
        console.warn(
          `Local ${e} ${t} failed to persist after share creation:`,
          r,
        ),
        showGlassToast(
          "Share created but local update failed. Refresh to sync.",
          "warning",
        ),
        s
      );
    }
    return (
      0 === l &&
        (console.warn(`Local ${e} ${t} not found during share creation`),
        showGlassToast(
          "Share created but local update failed. Refresh to sync.",
          "warning",
        )),
      s
    );
  } catch (e) {
    return (
      console.error("Error creating share:", e),
      "AbortError" === e.name
        ? showGlassToast("Request timed out. Please try again.", "error")
        : showGlassToast("Failed to create share", "error"),
      null
    );
  }
}
async function stopShare(e, t, r = {}) {
  try {
    const a = await getCurrentStoredUserId();
    if (!a || !(await SyncManager._isUserContextCurrent(a)))
      return (
        showGlassToast("Please sign in to manage sharing", "warning"),
        !1
      );
    const o = await getSupabaseAccessToken(a);
    if (!o)
      return (
        showGlassToast("Please sign in to manage sharing", "warning"),
        !1
      );
    const n = new AbortController(),
      i = setTimeout(() => n.abort(), 15e3),
      s = await fetch(`${SUPABASE_FUNCTIONS_URL}/stop-share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${o}`,
          ...(globalThis.getLumiListDiagnosticHeaders?.({
            surface: "newtab",
          }) || {}),
        },
        body: JSON.stringify({ share_type: e, item_id: t }),
        signal: n.signal,
      });
    if ((clearTimeout(i), !(await SyncManager._isUserContextCurrent(a))))
      return !1;
    if (!s.ok) {
      let e = "Failed to stop sharing";
      try {
        e = (await s.json()).error || e;
      } catch (e) {}
      return (showGlassToast(e, "error"), !1);
    }
    if (r.skipLocalUpdate) return !0;
    let l;
    try {
      l =
        "board" === e
          ? await updateBoard(t, { shareId: null }, { skipHistory: !0 })
          : await updatePage(t, { shareId: null }, { skipHistory: !0 });
    } catch (r) {
      return (
        console.warn(`Local ${e} ${t} failed to persist after stop-share:`, r),
        showGlassToast(
          "Share stopped but local update failed. Refresh to sync.",
          "warning",
        ),
        !0
      );
    }
    return (
      0 === l &&
        (console.warn(`Local ${e} ${t} not found during stop share`),
        showGlassToast(
          "Share stopped but local update failed. Refresh to sync.",
          "warning",
        )),
      !0
    );
  } catch (e) {
    return (
      console.error("Error stopping share:", e),
      "AbortError" === e.name
        ? showGlassToast("Request timed out. Please try again.", "error")
        : showGlassToast("Failed to stop sharing. Please try again.", "error"),
      !1
    );
  }
}
async function openShareModal(e, t) {
  if (!shareModalInProgress) {
    currentShareModalData = null;
    try {
      if (((shareModalInProgress = !0), !(await SyncManager.isLoggedIn())))
        return void showGlassToast(
          "Please sign in to share content",
          "warning",
        );
      const r = document.getElementById("shareModal"),
        a = document.getElementById("shareModalTitle"),
        o = document.getElementById("shareLinkInput"),
        n = document.getElementById("copyShareLinkBtn"),
        i = document.getElementById("stopShareBtn");
      ((a.textContent = llT("share.loading")),
        (o.value = llT("share.generatingLink")),
        n && (n.disabled = !0),
        i && (i.disabled = !0),
        r.classList.add("active"));
      let s = null;
      if (
        ((s = "board" === e ? await db.boards.get(t) : await db.pages.get(t)),
        !s)
      )
        return (
          showGlassToast(llT("share.itemNotFound"), "error"),
          void r.classList.remove("active")
        );
      const l =
        s.name || llT("board" === e ? "common.untitledBoard" : "page.untitled");
      let c = s.shareId;
      if (!c) {
        showGlassToast(llT("share.creatingLink"), "info");
        const a = await createShare(e, t);
        if (!a) return void r.classList.remove("active");
        c = a.share_id;
      }
      ((currentShareModalData = { type: e, itemId: t, shareId: c }),
        (a.textContent = llT("share.modalTitle", { itemName: l })),
        (o.value = `https://lumilist.in/share/?id=${c}`),
        n && (n.disabled = !1),
        i && (i.disabled = !1),
        await loadBoardsFromDatabase(),
        await loadPagesNavigation());
    } finally {
      shareModalInProgress = !1;
    }
  }
}
function closeShareModal() {
  (document.getElementById("shareModal").classList.remove("active"),
    (currentShareModalData = null));
}
async function copyShareLink() {
  const e = document.getElementById("shareLinkInput"),
    t = document.getElementById("copyShareLinkBtn");
  try {
    (await navigator.clipboard.writeText(e.value),
      t.classList.add("copied"),
      showGlassToast(llT("share.copySuccess"), "success"),
      setTimeout(() => {
        t.classList.remove("copied");
      }, 2e3));
  } catch (t) {
    (e.select(),
      document.execCommand("copy"),
      showGlassToast(llT("share.copySuccess"), "success"));
  }
}
async function handleStopShare() {
  if (!currentShareModalData || isStopShareInProgress) return;
  const e = document.getElementById("stopShareBtn");
  ((isStopShareInProgress = !0), e && (e.disabled = !0));
  try {
    if (
      !(await showGlassConfirm(
        llT("share.stopConfirmTitle"),
        llT("share.stopConfirmMessage"),
        { confirmText: llT("share.stopButton"), confirmClass: "btn-danger" },
      ))
    )
      return;
    (e && (e.textContent = llT("share.stopping")),
      (await stopShare(
        currentShareModalData.type,
        currentShareModalData.itemId,
      ))
        ? (showGlassToast(llT("share.stopped"), "success"),
          closeShareModal(),
          await loadBoardsFromDatabase(),
          await loadPagesNavigation())
        : closeShareModal());
  } finally {
    (e && ((e.textContent = llT("share.stopButton")), (e.disabled = !1)),
      (isStopShareInProgress = !1));
  }
}
function normalizeUrlForDuplicateCheck(e) {
  try {
    const t = new URL(e);
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
      "fbclid",
      "gclid",
    ].forEach((e) => t.searchParams.delete(e));
    let r = t.origin + t.pathname.replace(/\/$/, "");
    const a = t.searchParams.toString();
    return (a && (r += `?${a}`), t.hash && (r += t.hash), r.toLowerCase());
  } catch {
    return e.toLowerCase();
  }
}
function extractUrlsFromText(e) {
  if (!e || "string" != typeof e) return [];
  const t = [],
    r = new Set(),
    a = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi;
  let o;
  for (; null !== (o = a.exec(e)); ) {
    const e = o[1].replace(/\\([\[\]()])/g, "$1"),
      a = o[2],
      n = normalizeUrlForDuplicateCheck(a);
    r.has(n) ||
      isUnsafeUrl(a) ||
      (r.add(n), t.push({ url: a, title: e, context: "" }));
  }
  const n = /(https?:\/\/[^\s<>"')\]]+)/gi;
  for (; null !== (o = n.exec(e)); ) {
    const a = o[1],
      n = a.replace(/[.,;:!?)]+$/, ""),
      i = normalizeUrlForDuplicateCheck(n);
    if (r.has(i)) continue;
    if (isUnsafeUrl(n)) continue;
    r.add(i);
    const s = o.index,
      l = e.substring(Math.max(0, s - 150), s),
      c = e.substring(s + a.length, s + a.length + 150),
      d =
        `${l.split(/\s+/).slice(-10).join(" ").trim()} ${c.split(/\s+/).slice(0, 10).join(" ").trim()}`.trim();
    t.push({ url: n, title: null, context: d });
  }
  return t;
}
function findNearestHeading(e) {
  let t = e;
  for (; t && "BODY" !== t.tagName; ) {
    let e = t.previousElementSibling;
    for (; e; ) {
      if (/^H[1-6]$/.test(e.tagName))
        return e.textContent.trim().substring(0, 50);
      e = e.previousElementSibling;
    }
    t = t.parentElement;
  }
  return null;
}
function areProximateSiblings(e, t) {
  return !(
    !e ||
    !t ||
    (e !== t &&
      e.parentElement !== t.parentElement &&
      e.parentElement?.parentElement !== t.parentElement?.parentElement)
  );
}
function normalizePapalyText(e) {
  return "string" != typeof e ? "" : e.replace(/\s+/g, " ").trim();
}
function isPapalyTextTruncated(e) {
  return /(\.\.\.|\u2026)$/.test(e);
}
function decodeHtmlEntities(e) {
  if ("string" != typeof e || !e) return "";
  const t = document.createElement("textarea");
  return ((t.innerHTML = e), t.value);
}
function extractPapalyTooltipTitle(e) {
  if ("string" != typeof e || !e) return "";
  const t = e.match(/<b[^>]*>([\s\S]*?)<\/b>/i);
  return normalizePapalyText(
    decodeHtmlEntities(
      (t ? t[1] : e.split(/<br\s*\/?>/i)[0]).replace(/<[^>]*>/g, " "),
    ),
  );
}
function resolvePapalyLinkTitle(e, t, r) {
  const a = e?.querySelector(".item-name") || t?.querySelector(".item-name"),
    o =
      extractPapalyTooltipTitle(a?.getAttribute("tooltip")) ||
      extractPapalyTooltipTitle(e?.getAttribute("tooltip")) ||
      extractPapalyTooltipTitle(t?.getAttribute("tooltip")),
    n = [
      a?.getAttribute("title"),
      a?.getAttribute("aria-label"),
      e?.getAttribute("title"),
      e?.getAttribute("aria-label"),
      t?.getAttribute("title"),
      t?.getAttribute("aria-label"),
      t?.getAttribute("data-title"),
      t?.getAttribute("data-name"),
      o,
      a?.textContent,
      e?.textContent,
      t?.textContent,
    ]
      .map(normalizePapalyText)
      .filter(Boolean);
  if (0 === n.length) return r;
  const i = n[0];
  if (!isPapalyTextTruncated(i)) return i;
  const s = i
    .replace(/(\.\.\.|\u2026)+$/, "")
    .trim()
    .toLowerCase();
  return (
    n.find((e) => {
      if (!e || isPapalyTextTruncated(e)) return !1;
      const t = e.toLowerCase();
      return (
        !!(s && t.startsWith(s) && e.length > i.length) ||
        e.length >= i.length + 5
      );
    }) || i
  );
}
function extractPapalyGroupsFromHtmlDoc(e) {
  const t = e.querySelectorAll(".board");
  let r = null;
  t &&
    t.length > 0 &&
    (r =
      Array.from(t).find(
        (e) =>
          "function" == typeof e.getAttribute &&
          (e.getAttribute("style") || "")
            .toLowerCase()
            .includes("display: block"),
      ) || t[t.length - 1]);
  const a = r
      ? r.querySelectorAll(".cards-container.theme-card")
      : e.querySelectorAll(".cards-container.theme-card"),
    o = a.length > 0 ? a[a.length - 1] : null;
  if (!o) return null;
  const n = o.querySelectorAll(".category-slot");
  if (!n || 0 === n.length) return null;
  const i = [];
  return (
    n.forEach((e) => {
      const t = Array.from(e.classList || []).find((e) =>
          e.startsWith("slot-"),
        ),
        r = t ? parseInt(t.replace("slot-", ""), 10) : 0,
        a = e.querySelectorAll(
          ".card[category-index], .card[childcategory-index], .card[child-category-index]",
        );
      let o = 0;
      a.forEach((e) => {
        const t = e.querySelector(".card-title"),
          a =
            (
              t?.textContent ||
              e.getAttribute("category-name") ||
              e.getAttribute("childcategory-name") ||
              e.getAttribute("child-category-name") ||
              ""
            ).trim() || `Papaly Category ${o + 1}`,
          n = o,
          s = Array.from(
            e.querySelectorAll("ol.item-container li.item-bookmark"),
          ),
          l = [];
        (s.forEach((e, t) => {
          const r = e.querySelector("a[href]"),
            a = r?.getAttribute("href") || e.getAttribute("url");
          if (!a) return;
          if (a.toLowerCase().trim().startsWith("javascript:")) return;
          if (isUnsafeUrl(a)) return;
          if (!a.startsWith("http")) return;
          const o = resolvePapalyLinkTitle(r, e, a),
            n = normalizePapalyText(
              e.querySelector(".item-bookmark-note")?.textContent || "",
            ),
            i = parseFloat(e.getAttribute("item-position")),
            s = Number.isFinite(i) ? i : t;
          l.push({ url: a, title: o || a, context: n, _order: s });
        }),
          l.length > 0 &&
            (l.sort((e, t) => (e._order || 0) - (t._order || 0)),
            l.forEach((e) => {
              delete e._order;
            }),
            i.push({ name: a, links: l, columnIndex: r, orderKey: n })),
          o++);
      });
    }),
    0 === i.length
      ? null
      : (i.sort((e, t) => {
          const r = Number.isFinite(e.columnIndex) ? e.columnIndex : 0,
            a = Number.isFinite(t.columnIndex) ? t.columnIndex : 0;
          return r !== a
            ? r - a
            : (Number.isFinite(e.orderKey) ? e.orderKey : 0) -
                (Number.isFinite(t.orderKey) ? t.orderKey : 0);
        }),
        i)
  );
}
function extractLinksFromHtml(e) {
  const t = new DOMParser().parseFromString(e, "text/html"),
    r = extractPapalyGroupsFromHtmlDoc(t);
  if (r && r.length > 0) return r;
  const a = t.querySelectorAll("a[href]"),
    o = [];
  let n = { name: null, links: [] },
    i = null;
  return (
    a.forEach((e) => {
      const t = e.getAttribute("href");
      if (!t) return;
      if (t.toLowerCase().trim().startsWith("javascript:"))
        return void console.warn(
          "[Security] Blocked javascript: URL in HTML import:",
          t.substring(0, 50),
        );
      if (isUnsafeUrl(t))
        return void console.warn(
          "[Security] Blocked unsafe URL in HTML import:",
          t.substring(0, 50),
        );
      if (!t.startsWith("http")) return;
      const r = e.textContent.trim() || t,
        a = findNearestHeading(e),
        s = e.parentElement;
      (((a && a !== n.name) ||
        (i && !areProximateSiblings(i, s) && n.links.length > 0)) &&
        n.links.length > 0 &&
        (o.push(n), (n = { name: a, links: [] })),
        a && (n.name = a),
        n.links.push({ url: t, title: r, context: "" }),
        (i = s));
    }),
    n.links.length > 0 && o.push(n),
    o
  );
}
function normalizeImportHtmlText(e) {
  return "string" != typeof e ? "" : e.replace(/\s+/g, " ").trim();
}
function getDirectChildByTag(e, t) {
  if (!e || !e.children || !t) return null;
  const r = String(t).toUpperCase();
  return Array.from(e.children).find((e) => e.tagName === r) || null;
}
function extractNetscapeDlEntries(e) {
  if (!e || "DL" !== e.tagName) return [];
  const t = [],
    r = Array.from(e.children || []);
  for (let e = 0; e < r.length; e++) {
    const a = r[e];
    if (!a || "DT" !== a.tagName) continue;
    const o = getDirectChildByTag(a, "H3"),
      n = getDirectChildByTag(a, "A");
    let i = getDirectChildByTag(a, "DL");
    if (!i) {
      let t = e + 1;
      for (; t < r.length && "P" === r[t]?.tagName; ) t++;
      t < r.length && "DL" === r[t]?.tagName && ((i = r[t]), (e = t));
    }
    if (o)
      t.push({
        kind: "folder",
        title: normalizeImportHtmlText(o.textContent || ""),
        childrenDl: i || null,
      });
    else if (n) {
      const e = normalizeImportHtmlText(n.getAttribute("href") || "");
      if (!e) continue;
      const r = normalizeImportHtmlText(n.textContent || "") || e;
      t.push({ kind: "link", url: e, title: r });
    }
  }
  return t;
}
function collectNetscapeLinksFromDl(e) {
  const t = [],
    r = extractNetscapeDlEntries(e);
  for (const e of r)
    "link" !== e.kind
      ? "folder" === e.kind &&
        e.childrenDl &&
        t.push(...collectNetscapeLinksFromDl(e.childrenDl))
      : t.push({ url: e.url, title: e.title, context: "" });
  return t;
}
function looksLikePapalyNetscapeExport(e, t = []) {
  const r = (Array.isArray(t) ? t : [])
      .map((e) => normalizeImportHtmlText(e).toLowerCase())
      .filter(Boolean),
    a = r.includes("tutorial"),
    o = r.includes("my first board"),
    n = r.includes("import"),
    i = !!e.querySelector('a[href*="papaly.com"]'),
    s = !!e.querySelector(
      'script[src*="static.cloudflareinsights.com/beacon.min.js"]',
    );
  return !(!a || !o) || !(!n || !i) || !!(s && r.length > 0);
}
function extractPapalyPagesFromHtmlDoc(e) {
  const t = e.querySelector("dl");
  if (!t) return null;
  const r = extractNetscapeDlEntries(t).filter((e) => "folder" === e.kind);
  if (0 === r.length) return null;
  if (
    !looksLikePapalyNetscapeExport(
      e,
      r.map((e) => e.title),
    )
  )
    return null;
  const a = [];
  return (
    r.forEach((e, t) => {
      if (!e?.childrenDl) return;
      const r = extractNetscapeDlEntries(e.childrenDl),
        o = [],
        n = [];
      let i = 0;
      for (const e of r) {
        if ("folder" === e.kind) {
          const t = collectNetscapeLinksFromDl(e.childrenDl);
          (t.length > 0 &&
            o.push({
              name: e.title || `Category ${i + 1}`,
              links: t,
              orderKey: i,
            }),
            i++);
          continue;
        }
        "link" === e.kind &&
          n.push({ url: e.url, title: e.title || e.url, context: "" });
      }
      (n.length > 0 && o.push({ name: "Uncategorized", links: n, orderKey: i }),
        0 !== o.length &&
          a.push({
            name: e.title || `Papaly Board ${t + 1}`,
            groups: o,
            orderKey: t,
          }));
    }),
    a.length > 0 ? a : null
  );
}
function extractPapalyPagesFromHtml(e) {
  return "string" == typeof e && e.trim()
    ? extractPapalyPagesFromHtmlDoc(
        new DOMParser().parseFromString(e, "text/html"),
      )
    : null;
}
function groupByDomain(e) {
  if (!e || !Array.isArray(e)) return [];
  const t = {};
  for (const r of e)
    try {
      const e = new URL(r.url).hostname.replace(/^www\./, "");
      (t[e] || (t[e] = []), t[e].push(r));
    } catch (e) {}
  const r = [],
    a = [];
  for (const [e, o] of Object.entries(t))
    o.length >= 2 ? r.push({ name: e, links: o }) : a.push(...o);
  return (a.length > 0 && r.push({ name: "Imported Links", links: a }), r);
}
function groupByLineBreaks(e) {
  if (!e || "string" != typeof e) return [];
  const t = e.split(/\n\s*\n/),
    r = [];
  return (
    t.forEach((e, t) => {
      const a = extractUrlsFromText(e);
      a.length > 0 &&
        r.push({
          name: `Group ${t + 1}`,
          links: a.map((e) => ({
            url: e.url,
            title: e.title || e.url,
            context: e.context,
          })),
        });
    }),
    r
  );
}
function groupByMarkdownHeadings(e) {
  if (!e || "string" != typeof e) return [];
  const t = e.split("\n"),
    r = [];
  let a = null,
    o = !1;
  for (const e of t) {
    const t = e.trim(),
      n = t.match(/^#{1,6}\s+(.+)$/);
    if (n) {
      ((o = !0),
        a && a.links.length > 0 && r.push(a),
        (a = { name: n[1].trim().substring(0, 100), links: [] }));
      continue;
    }
    if (!t) continue;
    const i = t.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/),
      s = t.match(/^(https?:\/\/[^\s]+)/);
    if (i || s) {
      const e = i ? i[2] : s[1],
        t = i ? i[1].replace(/\\([\[\]()])/g, "$1") : e;
      (a || (a = { name: "Imported Links", links: [] }),
        a.links.push({ url: e, title: t }));
    }
  }
  return (a && a.links.length > 0 && r.push(a), o ? r : []);
}
function isCsvContent(e) {
  if (!e || "string" != typeof e) return !1;
  const t = e
    .trim()
    .split("\n")
    .filter((e) => e.trim());
  if (t.length < 2) return !1;
  const r = t[0],
    a = r.includes(","),
    o = r.includes("\t");
  if (!a && !o) return !1;
  const n = o ? "\t" : ",",
    i = t.slice(0, Math.min(5, t.length)).map((e) => e.split(n).length),
    s = i[0];
  return !(s < 2) && i.filter((e) => e === s).length >= 0.8 * i.length;
}
function extractLinksFromCsv(e) {
  if (!e || "string" != typeof e) return [];
  const t = e
    .trim()
    .split("\n")
    .filter((e) => e.trim());
  if (t.length < 2) return [];
  const r = t[0].includes("\t") ? "\t" : ",";
  function parseCSVLine(e) {
    const t = [];
    let a = "",
      o = !1;
    for (let n = 0; n < e.length; n++) {
      const i = e[n];
      '"' === i
        ? o && '"' === e[n + 1]
          ? ((a += '"'), n++)
          : (o = !o)
        : i !== r || o
          ? (a += i)
          : (t.push(a.trim()), (a = ""));
    }
    return (t.push(a.trim()), t);
  }
  const a = parseCSVLine(t[0]).map((e) => e.toLowerCase().replace(/['"]/g, "")),
    o = ["url", "link", "href", "address", "website"];
  let n = a.findIndex((e) => o.includes(e));
  if (
    (-1 === n &&
      t.length > 1 &&
      (n = parseCSVLine(t[1]).findIndex((e) =>
        /^https?:\/\//i.test(e.replace(/['"]/g, "")),
      )),
    -1 === n)
  )
    return [];
  const i = ["title", "name", "description", "label", "text"];
  let s = a.findIndex((e) => i.includes(e));
  const l = ["group", "category", "folder", "tag", "board", "section", "type"];
  let c = a.findIndex((e) => l.includes(e));
  const d = new Map();
  for (let e = 1; e < t.length; e++) {
    const r = parseCSVLine(t[e]);
    let a = r[n]?.replace(/^['"]|['"]$/g, "").trim();
    if (!a || !a.match(/^https?:\/\//i)) continue;
    let o = -1 !== s ? r[s]?.replace(/^['"]|['"]$/g, "").trim() : null;
    o || (o = a);
    let i = -1 !== c ? r[c]?.replace(/^['"]|['"]$/g, "").trim() : null;
    (i || (i = "Imported Links"),
      d.has(i) || d.set(i, []),
      d.get(i).push({ url: a, title: o }));
  }
  const u = [];
  for (const [e, t] of d)
    t.length > 0 && u.push({ name: e.substring(0, 100), links: t });
  return u;
}
function isJsonContent(e) {
  const t = e.trim();
  return (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  );
}
function extractUrlsFromJson(e) {
  let t;
  try {
    t = JSON.parse(e);
  } catch (e) {
    return (
      console.warn(
        "[Import Links] Invalid JSON, falling back to text extraction",
      ),
      null
    );
  }
  const r = new Map();
  return (
    (function extractFromValue(e, t = "") {
      if ("string" == typeof e) {
        if (/^https?:\/\//i.test(e)) {
          const t = normalizeUrlForDuplicateCheck(e);
          r.has(t) || r.set(t, { url: e, title: e, context: "" });
        }
      } else if (Array.isArray(e)) e.forEach((e) => extractFromValue(e, t));
      else if (e && "object" == typeof e) {
        const t = ["url", "href", "link", "uri", "src"],
          a = ["title", "name", "label", "text", "description"];
        let o = null,
          n = null;
        for (const r of Object.keys(e)) {
          const i = r.toLowerCase();
          (t.includes(i) &&
            "string" == typeof e[r] &&
            /^https?:\/\//i.test(e[r]) &&
            (o = e[r]),
            a.includes(i) && "string" == typeof e[r] && (n = e[r]));
        }
        if (o) {
          const e = normalizeUrlForDuplicateCheck(o);
          r.has(e) || r.set(e, { url: o, title: n || o, context: "" });
        }
        for (const t of Object.keys(e)) extractFromValue(e[t], t);
      }
    })(t),
    Array.from(r.values())
  );
}
function extractGroupsFromJsonStructure(e) {
  if (!e || e.length > 10485760)
    return (console.warn("[Import] JSON content empty or too large"), null);
  let t;
  try {
    t = JSON.parse(e);
  } catch (e) {
    return null;
  }
  const r = buildLumiListBookmarkPortabilityImportGroupsFromPayload(t);
  if (r && r.length > 0) return r;
  const a = [],
    o = new Set(["__proto__", "constructor", "prototype"]);
  function sanitizeKey(e) {
    return "string" != typeof e ? String(e) : o.has(e) ? `_${e}` : e;
  }
  function extractUrl(e) {
    if (!e || "object" != typeof e) return null;
    const t = e.url || e.link || e.href || e.uri || e.address || e.resolved_url;
    return "string" == typeof t ? t : null;
  }
  function extractTitle(e, t) {
    if (!e || "object" != typeof e) return t;
    const r = [e.title, e.name, e.label, e.text, e.resolved_title];
    for (const e of r) {
      if ("string" == typeof e && "" !== e.trim()) return e;
      if ("number" == typeof e) return String(e);
    }
    return t;
  }
  function extractChildrenArray(e) {
    if (!e || "object" != typeof e) return null;
    const t = [
      e.children,
      e.bookmarks,
      e.links,
      e.items,
      e.urls,
      e.entries,
      e.tabs,
    ];
    for (const e of t) if (Array.isArray(e)) return e;
    return null;
  }
  function extractGroupName(e, t) {
    if (!e || "object" != typeof e) return t;
    const r = [e.name, e.title, e.label, e.folder];
    for (const e of r)
      if ("string" == typeof e && "" !== e.trim()) return sanitizeKey(e);
    return t;
  }
  function extractTags(e) {
    if (!e || "object" != typeof e) return null;
    const t = e.tags || e.labels || e.keywords || e.categories;
    return Array.isArray(t)
      ? t.filter((e) => "string" == typeof e && "" !== e.trim())
      : "string" == typeof t && "" !== t.trim()
        ? t
            .split(/[,;]/)
            .map((e) => e.trim())
            .filter((e) => "" !== e)
        : null;
  }
  function addGroup(e, t) {
    if (!e || !t || 0 === t.length) return;
    const r = a.find((t) => t.name === e);
    r ? r.links.push(...t) : a.push({ name: e, links: t });
  }
  function extractFromChildren(e, t = null, r = 0) {
    if (!e || r > 50) return;
    if (Array.isArray(e))
      return void e.forEach((e) => extractFromChildren(e, t, r + 1));
    const a = extractChildrenArray(e);
    if (a && Array.isArray(a)) {
      const o = extractGroupName(e, t),
        n = [],
        i = [];
      for (const e of a) {
        const t = extractUrl(e);
        t
          ? n.push({ url: t, title: extractTitle(e, t) })
          : extractChildrenArray(e) && i.push(e);
      }
      (n.length > 0 && o && addGroup(o, n),
        i.forEach((e) =>
          extractFromChildren(e, extractGroupName(e, null), r + 1),
        ));
    }
  }
  if (t.roots && (t.roots.bookmark_bar || t.roots.other))
    !(function extractFromChromeRoots(e) {
      if (!e.roots) return !1;
      const t = ["bookmark_bar", "other", "synced", "mobile"];
      for (const r of t) {
        const t = e.roots[r];
        t &&
          extractChildrenArray(t) &&
          extractFromChildren(t, extractGroupName(t, r.replace("_", " ")));
      }
      a.length;
    })(t);
  else if (
    t.boards ||
    t.groups ||
    t.collections ||
    t.folders ||
    t.categories ||
    t.lists
  )
    !(function extractFromBoardsArray(e) {
      const t = [
        "boards",
        "groups",
        "collections",
        "folders",
        "categories",
        "lists",
      ];
      let r = null;
      for (const a of t)
        if (Array.isArray(e[a]) && e[a].length > 0) {
          r = e[a];
          break;
        }
      if (!r) return !1;
      for (const e of r) {
        if (!e || "object" != typeof e) continue;
        const t = extractGroupName(e, null);
        if (!t) continue;
        const r = extractChildrenArray(e);
        if (!Array.isArray(r) || 0 === r.length) continue;
        const a = [];
        for (const e of r) {
          const t = extractUrl(e);
          t && a.push({ url: t, title: extractTitle(e, t) });
        }
        a.length > 0 && addGroup(t, a);
      }
      a.length;
    })(t);
  else if (t.containers || t.workspaces || t.profiles)
    !(function extractFromWorkspaces(e) {
      const t = e.containers || e.workspaces || e.profiles;
      if (!Array.isArray(t)) return !1;
      for (const e of t) {
        if (!e || "object" != typeof e) continue;
        const t = extractGroupName(e, "Workspace"),
          r = extractChildrenArray(e) || e.spaces;
        if (Array.isArray(r)) {
          const e = [];
          for (const t of r) {
            if (!t || "object" != typeof t) continue;
            const r = extractUrl(t);
            if (r) e.push({ url: r, title: extractTitle(t, r) });
            else {
              const r = extractChildrenArray(t);
              if (Array.isArray(r))
                for (const t of r) {
                  const r = extractUrl(t);
                  r && e.push({ url: r, title: extractTitle(t, r) });
                }
            }
          }
          e.length > 0 && addGroup(t, e);
        }
      }
      a.length;
    })(t);
  else if (t.windows || t.sessions)
    !(function extractFromSessionBuddy(e) {
      const t = e.windows || e.sessions;
      if (!Array.isArray(t)) return !1;
      for (let e = 0; e < t.length; e++) {
        const r = t[e];
        if (!r || "object" != typeof r) continue;
        const a = extractChildrenArray(r);
        if (!Array.isArray(a)) continue;
        const o = [];
        for (const e of a) {
          const t = extractUrl(e);
          t &&
            t.startsWith("http") &&
            o.push({ url: t, title: extractTitle(e, t) });
        }
        o.length > 0 && addGroup(extractGroupName(r, `Window ${e + 1}`), o);
      }
      a.length;
    })(t);
  else if (t.children || (Array.isArray(t) && t.length > 0 && t[0]?.children))
    extractFromChildren(t);
  else if (Array.isArray(t) && t.length > 0) {
    const e = t[0];
    extractTags(e)
      ? (function extractByTags(e) {
          if (!Array.isArray(e)) return;
          const t = Object.create(null),
            r = [];
          for (const a of e) {
            const e = extractUrl(a);
            if (!e) continue;
            const o = { url: e, title: extractTitle(a, e) },
              n = extractTags(a);
            if (n && n.length > 0) {
              const e = sanitizeKey(n[0]);
              (t[e] || (t[e] = []), t[e].push(o));
            } else r.push(o);
          }
          for (const e of Object.keys(t)) addGroup(e, t[e]);
          r.length > 0 && addGroup("Untagged", r);
        })(t)
      : extractUrl(e) &&
        (function extractFromFlatArray(e) {
          if (!Array.isArray(e)) return !1;
          if (!e.some((e) => extractUrl(e))) return !1;
          const t = Object.create(null),
            r = [];
          for (const a of e) {
            const e = extractUrl(a);
            if (!e) continue;
            const o = { url: e, title: extractTitle(a, e) },
              n = extractTags(a);
            if (n && n.length > 0) {
              const e = sanitizeKey(n[0]);
              (t[e] || (t[e] = []), t[e].push(o));
            } else r.push(o);
          }
          for (const e of Object.keys(t)) addGroup(e, t[e]);
          (r.length > 0 && addGroup("Imported", r), a.length);
        })(t);
  }
  return (
    0 === a.length &&
      (function extractByDeepSearch(e, t = 0, r = new WeakSet()) {
        if (t > 6) return !1;
        if (!e || "object" != typeof e) return !1;
        if (r.has(e)) return !1;
        if ((r.add(e), Array.isArray(e))) {
          const t = [];
          for (const r of e)
            if (r && "object" == typeof r) {
              const e = extractUrl(r);
              e &&
                e.startsWith("http") &&
                t.push({ url: e, title: extractTitle(r, e) });
            }
          if (t.length > 0) return (addGroup("Imported", t), !0);
        }
        if (!Array.isArray(e))
          for (const a of Object.values(e))
            if (a && "object" == typeof a && extractByDeepSearch(a, t + 1, r))
              return !0;
        return !1;
      })(t),
    a.length > 0 ? a : null
  );
}
function isUrlLikeImportTitle(e, t) {
  const r = "string" == typeof e ? e.trim() : "";
  if (!r) return !0;
  if (/^(https?:\/\/|www\.)/i.test(r)) return !0;
  if (!/\s/.test(r) && /^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(r)) return !0;
  const a = "string" == typeof t ? t.trim() : "";
  if (!a) return !1;
  try {
    const e = new URL(a),
      t = r.toLowerCase(),
      o = t
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "");
    if (
      o ===
      e.href
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "")
    )
      return !0;
    const n = (e.hostname || "").toLowerCase(),
      i = n.replace(/^www\./, "");
    if (t === n || t === i) return !0;
    const s = `${i}${(e.pathname || "").replace(/\/$/, "")}`.replace(/\/$/, "");
    if (s && o === s) return !0;
  } catch (e) {
    return !1;
  }
  return !1;
}
function resolveImportedLinkTitle({
  url: e,
  incomingTitle: t,
  fetchedTitle: r,
}) {
  const a = "string" == typeof r ? r.trim() : "";
  if (a) return a;
  const o = "string" == typeof t ? t.trim() : "";
  if (o && !isUrlLikeImportTitle(o, e)) return o;
  const n = getFallbackTitleFromUrl(e);
  return "string" == typeof n && n.trim()
    ? n.trim()
    : o || ("string" == typeof e && e.trim() ? e.trim() : "Untitled");
}
async function fetchTitlesForImportTargets(e, t = {}) {
  const r = Array.isArray(e)
      ? Array.from(new Set(e.filter((e) => "string" == typeof e && e.trim())))
      : [],
    a = r.length,
    o = new Map(),
    n = "function" == typeof t.onProgress ? t.onProgress : null,
    i = "function" == typeof t.shouldCancel ? t.shouldCancel : () => !1;
  if (0 === a) return (n && n(0, 0), o);
  const s = Math.max(1, Math.min(Number(t.concurrency) || 4, 12));
  let l = 0,
    c = 0;
  return (
    await Promise.all(
      Array.from({ length: Math.min(s, a) }, () =>
        (async function worker() {
          for (; !i(); ) {
            const e = l++;
            if (e >= a) break;
            const t = r[e];
            try {
              const e = await fetchPageTitleFromBackground(t),
                r =
                  e?.success && "string" == typeof e.title
                    ? e.title.trim()
                    : "";
              r && o.set(t, r);
            } catch (e) {
              console.warn(
                "[Import Links] Failed to fetch title for URL:",
                t,
                e,
              );
            } finally {
              (c++, n && n(c, a, t));
            }
          }
        })(),
      ),
    ),
    o
  );
}
function collectPreparedImportGroups(e) {
  const t = [];
  let r = 0,
    a = 0;
  const o = new Set();
  for (const n of Array.isArray(e) ? e : []) {
    if (!n || !Array.isArray(n.links) || 0 === n.links.length) continue;
    const e = [];
    for (const t of n.links) {
      if (!t || "string" != typeof t.url) continue;
      if (isUnsafeUrl(t.url)) {
        (console.warn("[Import Links] Skipped unsafe URL:", t.url), r++);
        continue;
      }
      const n = sanitizeUrl(t.url);
      if (!n) {
        (console.warn("[Import Links] Skipped invalid URL:", t.url), r++);
        continue;
      }
      const i = normalizeUrlForDuplicateCheck(n);
      o.has(i) || (o.add(i), e.push({ ...t, url: n }), a++);
    }
    0 !== e.length && t.push({ ...n, links: e });
  }
  return { preparedGroups: t, totalUnsafe: r, totalPreparedLinks: a };
}
function getImportTitleFetchTargets(e, t = !1) {
  if (t) return [];
  if (!Array.isArray(e) || 0 === e.length) return [];
  const r = [],
    a = new Set();
  for (const t of e)
    if (t && Array.isArray(t.links))
      for (const e of t.links) {
        const t = "string" == typeof e?.url ? e.url : "";
        t && !a.has(t) && (a.add(t), r.push(t));
      }
  return r;
}
function resolveImportedLinkRawDescription(e, t = !1) {
  const r = "string" == typeof e?.description ? e.description.trim() : "";
  if (r) return r;
  if (t) {
    const t = "string" == typeof e?.context ? e.context.trim() : "";
    if (t) return t;
  }
  return null;
}
document.addEventListener("DOMContentLoaded", function () {
  const e = document.getElementById("closeShareModalBtn");
  e && e.addEventListener("click", closeShareModal);
  const t = document.getElementById("copyShareLinkBtn");
  t && t.addEventListener("click", copyShareLink);
  const r = document.getElementById("stopShareBtn");
  (r && r.addEventListener("click", handleStopShare),
    setupModalClickOutside(
      document.getElementById("shareModal"),
      closeShareModal,
    ));
});
const IMPORT_LINKS_CREATE_PAGE_VALUE = "__create_page__",
  IMPORT_LINKS_SYNC_CHUNK_SIZE = 250;
let _importLinksFileDetectionToken = 0;
async function populateImportLinksPageSelect(e, t = currentPageId) {
  const r = await db.pages.filter((e) => !e.deletedAt).toArray();
  r.sort((e, t) => e.order - t.order);
  const a = r
    .map(
      (e) =>
        `<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>`,
    )
    .join("");
  ((e.innerHTML =
    a +
    `<option value="${IMPORT_LINKS_CREATE_PAGE_VALUE}">\u2795 ${escapeHtml(llT("import.createNewPage"))}</option>`),
    t && r.some((e) => e.id === t)
      ? (e.value = t)
      : r.length > 0
        ? (e.value = r[0].id)
        : (e.value = IMPORT_LINKS_CREATE_PAGE_VALUE),
    e.value !== IMPORT_LINKS_CREATE_PAGE_VALUE &&
      (e.dataset.lastSelectedPageId = e.value));
}
function resetImportLinksCreatePageUI() {
  const e = document.getElementById("importLinksCreatePageRow"),
    t = document.getElementById("importLinksCreatePageInput");
  (e && (e.style.display = "none"), t && (t.value = ""));
}
function getImportLinksPageCountLabel(e) {
  return llT(1 === e ? "import.page" : "import.pages");
}
function setImportLinksPapalyCountText(e, t, r, a) {
  const o = document.getElementById("importLinksPapalyCounts");
  o &&
    (o.innerHTML = e
      ? llT("import.papalyCountsWithPages", {
          pageCount: t,
          pageLabel: getImportLinksPageCountLabel(t),
          boardCount: r,
          linkCount: a,
        })
      : llT("import.papalyCountsNoPages", { boardCount: r, linkCount: a }));
}
function refreshImportLinksLocalizedLabels() {
  const e = document.getElementById("importLinksTextarea");
  if (e) {
    const t = llT("import.linksPlaceholder");
    ((e.placeholder = t), e.setAttribute("aria-label", t));
  }
  const t = document.getElementById("importLinksPage"),
    r = t?.querySelector?.(`option[value="${IMPORT_LINKS_CREATE_PAGE_VALUE}"]`);
  r && (r.textContent = `\u2795 ${llT("import.createNewPage")}`);
  const a = document.getElementById("importLinksPapalySummary");
  if (a && "none" !== a.style.display) {
    const e = "true" === a.dataset.hasPageCount;
    setImportLinksPapalyCountText(
      e,
      Number(a.dataset.pageCount || 0),
      Number(a.dataset.boardCount || 0),
      Number(a.dataset.linkCount || 0),
    );
    const t = document.getElementById("importLinksPapalyHint");
    t &&
      (t.textContent = llT(
        e ? "import.papalyHintPages" : "import.papalyHintSame",
      ));
  }
}
function setImportLinksPapalyFileUi(e, t = {}) {
  const r = document.getElementById("importLinksPapalySummary"),
    a = document.getElementById("importLinksPapalyCounts"),
    o = document.getElementById("importLinksPapalyHint"),
    n = document.getElementById("importLinksGroupingRow"),
    i = document.getElementById("importLinksTargetLocationSection"),
    s = document.getElementById("importLinksPageRow"),
    l = document.getElementById("importLinksDistributionRow"),
    c = document.getElementById("importLinksPlacementRow"),
    d = document.getElementById("importLinksCreatePageRow"),
    u = document.getElementById("importLinksColumnRow");
  if (e) {
    const e = Number(t.pageCount),
      p = Number.isFinite(e) && e >= 0,
      m = p ? Math.floor(e) : 0,
      g = Number(t.boardCount) || 0,
      f = Number(t.linkCount) || 0;
    return (
      r &&
        ((r.style.display = "block"),
        (r.dataset.hasPageCount = p ? "true" : "false"),
        (r.dataset.pageCount = String(m)),
        (r.dataset.boardCount = String(g)),
        (r.dataset.linkCount = String(f))),
      a && setImportLinksPapalyCountText(p, m, g, f),
      o && (o.textContent = llT("import.papalyHintPages")),
      n && (n.style.display = "none"),
      i
        ? (i.style.display = "none")
        : (s && (s.style.display = "none"),
          l && (l.style.display = "none"),
          c && (c.style.display = "none")),
      d && (d.style.display = "none"),
      void (u && (u.style.display = "none"))
    );
  }
  (r && (r.style.display = "none"),
    r &&
      (delete r.dataset.hasPageCount,
      delete r.dataset.pageCount,
      delete r.dataset.boardCount,
      delete r.dataset.linkCount),
    a && (a.textContent = ""),
    o && (o.textContent = llT("import.papalyHintSame")),
    n && (n.style.display = "block"),
    i
      ? (i.style.display = "block")
      : (s && (s.style.display = "block"),
        l && (l.style.display = "flex"),
        c && (c.style.display = "flex")));
}
async function detectPapalyExportFromImportFile(e) {
  const t = ++_importLinksFileDetectionToken;
  if (!e) return (setImportLinksPapalyFileUi(!1), null);
  const r = "string" == typeof e.name ? e.name.toLowerCase() : "",
    a = r.includes(".") ? r.slice(r.lastIndexOf(".")) : "";
  if (
    !(
      ".html" === a ||
      ".htm" === a ||
      ("string" == typeof e.type && e.type.toLowerCase().includes("html"))
    )
  )
    return (setImportLinksPapalyFileUi(!1), null);
  try {
    const r = await e.text();
    if (t !== _importLinksFileDetectionToken) return null;
    const a = extractPapalyPagesFromHtml(r);
    if (!Array.isArray(a) || 0 === a.length)
      return (setImportLinksPapalyFileUi(!1), null);
    const o = a.reduce(
        (e, t) => e + (Array.isArray(t?.groups) ? t.groups.length : 0),
        0,
      ),
      n = a.reduce(
        (e, t) =>
          Array.isArray(t?.groups)
            ? e +
              t.groups.reduce(
                (e, t) => e + (Array.isArray(t?.links) ? t.links.length : 0),
                0,
              )
            : e,
        0,
      );
    return (
      setImportLinksPapalyFileUi(!0, {
        pageCount: a.length,
        boardCount: o,
        linkCount: n,
      }),
      a
    );
  } catch (e) {
    return (
      t === _importLinksFileDetectionToken &&
        (console.warn(
          "[Import Links] Failed to analyze selected file for Papaly layout:",
          e,
        ),
        setImportLinksPapalyFileUi(!1)),
      null
    );
  }
}
async function openImportLinksModal() {
  const e = document.getElementById("importLinksModal"),
    t = document.getElementById("importLinksTextarea"),
    r = document.getElementById("importLinksPage"),
    a = document.getElementById("importLinksFile");
  if (!e || !t || !r)
    return void console.error("[Import Links] Modal elements not found");
  ((_importLinksFileDetectionToken += 1),
    (t.value = ""),
    (t.placeholder = llT("import.linksPlaceholder")),
    (t.style.display = "block"),
    a && (a.value = ""),
    setImportLinksPapalyFileUi(!1));
  const o = document.getElementById("importLinksFileIndicator"),
    n = document.getElementById("importLinksUploadRow");
  (o && (o.style.display = "none"), n && (n.style.display = "flex"));
  const i = document.getElementById("importLinksGrouping");
  i && (i.value = "smart");
  const s = document.getElementById("importLinksDistribution"),
    l = document.getElementById("importLinksColumnRow");
  (s && (s.value = "left-to-right"), l && (l.style.display = "none"));
  const c = document.getElementById("importLinksBelowExisting");
  (c && (c.checked = !0),
    await populateImportLinksPageSelect(r, currentPageId),
    resetImportLinksCreatePageUI(),
    e.classList.add("active"),
    t.focus(),
    (_contextMenuImportMeta = null),
    (_isContextMenuImportFlow = !1));
}
function closeImportLinksModal(e = {}) {
  const t = document.getElementById("importLinksModal");
  (t && t.classList.remove("active"),
    !1 !== e.clearContextMeta &&
      ((_contextMenuImportMeta = null), (_isContextMenuImportFlow = !1)));
}
let _importLinksInProgress = !1,
  _contextMenuImportMeta = null,
  _isContextMenuImportFlow = !1,
  _activeImportLinksRun = null;
const IMPORT_LINKS_CANCELLED_ERROR_CODE = "IMPORT_LINKS_CANCELLED";
function requestCancelActiveImportLinksRun() {
  return !(
    !_activeImportLinksRun ||
    !_activeImportLinksRun.canCancel ||
    _activeImportLinksRun.cancelRequested ||
    ((_activeImportLinksRun.cancelRequested = !0),
    updateImportLinksProgressModal(
      getImportLinksProgressTitle(!1),
      llT("import.progressCancelling"),
      0,
      0,
    ),
    setImportLinksProgressCancelable(!1),
    0)
  );
}
const IMPORT_LINKS_MAX_FILE_SIZE = 10485760,
  IMPORT_LINKS_ALLOWED_EXTENSIONS = [
    ".html",
    ".htm",
    ".json",
    ".csv",
    ".txt",
    ".md",
  ];
async function handleImportLinks() {
  const e = window.LumiListMobilePromotion?.captureBookmarkSave?.(
    getLoadedWorkspaceOwnerUserId(),
  );
  if (_importLinksInProgress) return;
  _importLinksInProgress = !0;
  const t = document.getElementById("confirmImportLinksBtn"),
    r = t ? t.textContent : llT("common.importLinks");
  t && (t.disabled = !0);
  let a = !1,
    o = !1;
  const n = { cancelRequested: !1, canCancel: !1 },
    i = [];
  let s = !1;
  _activeImportLinksRun = n;
  try {
    if ("function" == typeof canModify && !canModify())
      return void showGlassToast(llT("import.upgrade"), "warning");
    const t = document.getElementById("importLinksTextarea"),
      r = document.getElementById("importLinksFile"),
      o = document.getElementById("importLinksPage"),
      l = document.getElementById("importLinksColumn"),
      c = document.getElementById("importLinksDistribution"),
      d = document.getElementById("importLinksBelowExisting");
    if (!t || !o || !l)
      return (
        console.error("[Import Links] Form elements not found"),
        void showGlassToast(llT("common.somethingWrong"), "error")
      );
    const u = o.value,
      p = parseInt(l.value, 10),
      m = c?.value || "single",
      g = !1 !== d?.checked;
    let f = t.value.trim();
    if (r && r.files.length > 0) {
      const e = r.files[0];
      if (e.size > 10485760)
        return void showGlassToast(
          llT("import.fileTooLarge", { size: 10 }),
          "error",
        );
      const t = "." + e.name.split(".").pop().toLowerCase();
      if (!IMPORT_LINKS_ALLOWED_EXTENSIONS.includes(t))
        return void showGlassToast(
          llT("import.unsupportedFileType", {
            types: IMPORT_LINKS_ALLOWED_EXTENSIONS.join(", "),
          }),
          "error",
        );
      try {
        f = await e.text();
      } catch (e) {
        return (
          console.error("[Import Links] Failed to read file:", e),
          void showGlassToast(llT("import.readFileFailed"), "error")
        );
      }
      if (!f.trim())
        return void showGlassToast(llT("import.fileEmpty"), "error");
    }
    const h = Array.isArray(_contextMenuImportMeta?.rawGroups)
        ? _contextMenuImportMeta.rawGroups
        : null,
      y = !!(h && h.length > 0),
      b = _isContextMenuImportFlow;
    if (!f && !y)
      return void showGlassToast(llT("import.pasteOrUpload"), "error");
    const S = !(!f || y || !isLumiListBookmarkPortabilityExportContent(f));
    let w = null;
    if (S) {
      if (
        shouldBlockLumiListBookmarkPortabilityImport({
          content: f,
          status: getEffectiveSubscriptionStatusForImportLimit(),
        })
      )
        return void showGlassToast(
          BOOKMARK_PORTABILITY_TRIAL_IMPORT_WARNING,
          "warning",
          6500,
        );
      if (
        ((w = buildLumiListBookmarkPortabilityImportGroupsFromContent(f)),
        !w || 0 === w.length)
      )
        return void showGlassToast(
          llLiteral("No active bookmarks found in this LumiList export."),
          "warning",
          6500,
        );
    }
    const k = document.getElementById("importLinksGrouping")?.value || "smart";
    let I = [],
      L = y,
      T = null;
    if (y)
      I = h.map((e) => ({
        ...e,
        links: Array.isArray(e?.links) ? e.links.map((e) => ({ ...e })) : [],
      }));
    else if (w) I = w;
    else {
      const e = f.includes("<a ") || f.includes("</a>") || f.includes("<A "),
        t = isJsonContent(f);
      let r = null,
        a = [];
      switch (
        (e
          ? ((T = extractPapalyPagesFromHtml(f)),
            T && T.length > 0
              ? ((L = !0),
                (r = T.flatMap((e) =>
                  Array.isArray(e?.groups) ? e.groups : [],
                )),
                (a = r.flatMap((e) => e.links || [])))
              : ((r = extractLinksFromHtml(f)),
                (a = r.flatMap((e) => e.links)),
                (L = r.some(
                  (e) =>
                    Number.isFinite(e?.columnIndex) ||
                    Number.isFinite(e?.orderKey),
                ))))
          : (a = (t && extractUrlsFromJson(f)) || extractUrlsFromText(f)),
        k)
      ) {
        case "domain":
          I = groupByDomain(a);
          break;
        case "single":
          I = [
            { name: `Imported ${new Date().toLocaleDateString()}`, links: a },
          ];
          break;
        default:
          if (e) I = r || [];
          else if (t) {
            const e = extractGroupsFromJsonStructure(f);
            if (e && e.length > 0) I = e;
            else {
              const e = extractUrlsFromJson(f);
              I =
                e && e.length > 0
                  ? groupByDomain(e)
                  : groupByDomain(extractUrlsFromText(f));
            }
          } else {
            const e = groupByMarkdownHeadings(f);
            if (e.length > 0) I = e;
            else if (isCsvContent(f)) {
              const e = extractLinksFromCsv(f);
              I = e.length > 0 ? e : groupByDomain(extractUrlsFromText(f));
            } else {
              const e = groupByLineBreaks(f);
              I = e.length > 1 ? e : groupByDomain(extractUrlsFromText(f));
            }
          }
      }
    }
    if (
      _contextMenuImportMeta &&
      Array.isArray(_contextMenuImportMeta.groups)
    ) {
      const e = new Map();
      (_contextMenuImportMeta.groups.forEach((t) => {
        t && "string" == typeof t.name && !e.has(t.name) && e.set(t.name, t);
      }),
        (I = I.map((t) => {
          if (!t || "string" != typeof t.name) return t;
          const r = e.get(t.name);
          if (!r) return t;
          const a = Number.isFinite(t.columnIndex)
              ? t.columnIndex
              : r.columnIndex,
            o = Number.isFinite(t.orderKey) ? t.orderKey : r.orderKey;
          return { ...t, columnIndex: a, orderKey: o };
        })));
    }
    const normalizeColumnIndex = (e) =>
      Number.isFinite(e) ? ((Math.floor(e) % 4) + 4) % 4 : null;
    if (Array.isArray(T) && T.length > 0) {
      const t = [];
      let r = 0,
        o = 0,
        l = 0;
      for (const e of T) {
        if (!e || !Array.isArray(e.groups)) continue;
        const {
          preparedGroups: a,
          totalUnsafe: n,
          totalPreparedLinks: i,
        } = collectPreparedImportGroups(e.groups);
        ((r += n),
          0 !== a.length &&
            0 !== i &&
            (t.push({ name: sanitizePageName(e.name, 100), groups: a }),
            (l += a.length),
            (o += i)));
      }
      const c = t.length;
      if (0 === c || 0 === o)
        return void showGlassToast(llT("import.noLinksFound"), "error");
      const d = checkPageLimit(c);
      if (!d.allowed)
        return void (d.remaining > 0
          ? showGlassToast(
              llT("import.limitPagesPartial", {
                remaining: llNumber(d.remaining),
                total: llNumber(c),
              }),
              "warning",
            )
          : showGlassToast(d.warning, "error"));
      const u = checkBoardLimit(l);
      if (!u.allowed)
        return void (u.remaining > 0
          ? showGlassToast(
              llT("import.limitBoardsPartial", {
                remaining: llNumber(u.remaining),
                total: llNumber(l),
              }),
              "warning",
            )
          : showGlassToast(u.warning, "error"));
      const g = await checkBookmarkLimitForBulkImport(o);
      if (!g.allowed)
        return void (g.remaining > 0
          ? showGlassToast(
              llT("import.limitBookmarksPartial", {
                remaining: llNumber(g.remaining),
                total: llNumber(o),
              }),
              "warning",
            )
          : showGlassToast(g.warning, "error"));
      (closeImportLinksModal({ clearContextMeta: !1 }),
        (a = showImportLinksProgressModal(
          getImportLinksProgressTitle(!0),
          getImportLinksImportedStatus(0, o),
        )),
        (n.canCancel = !0),
        a && setImportLinksProgressCancelable(!0));
      const f = collectImportedNameRegistry(
          await db.pages.filter((e) => !e.deletedAt).toArray(),
          sanitizePageName,
        ),
        h = await db.pages.orderBy("order").reverse().first();
      let y = Number.isFinite(h?.order) ? h.order + 1 : 0,
        b = 0,
        S = 0,
        w = 0,
        k = null;
      for (const e of t) {
        if (n.cancelRequested) {
          const e = new Error("Import cancelled by user");
          throw ((e.code = "IMPORT_LINKS_CANCELLED"), e);
        }
        const t = buildUniqueImportedPageName(e.name, f),
          r = await addPage({ name: t, order: y++ }, { skipHistory: !0 });
        if (!r) throw new Error(`Failed to create imported page "${t}".`);
        (k || (k = r), w++);
        const s = await db.pages.get(r);
        s && i.push({ table: "pages", id: s.id, before: null, after: s });
        const l = [0, 0, 0, 0],
          c = new Set(),
          d = e.groups.some((e) => Number.isFinite(e?.columnIndex));
        let u = 0,
          g = 1;
        for (const t of e.groups) {
          if (!t?.links || 0 === t.links.length) continue;
          if (n.cancelRequested) {
            const e = new Error("Import cancelled by user");
            throw ((e.code = "IMPORT_LINKS_CANCELLED"), e);
          }
          const e = normalizeColumnIndex(t.columnIndex),
            s = d && null !== e ? e : "left-to-right" === m ? u % 4 : p,
            f = l[s]++,
            h = buildUniqueImportedBoardName(
              normalizeImportHtmlText(t.name) || `Group ${g}`,
              c,
            ),
            y = await addBoard(
              { pageId: r, name: h, columnIndex: s, order: f },
              { skipHistory: !0 },
            );
          if ((u++, !y))
            throw new Error(`Failed to create imported board "${h}".`);
          (g++, S++);
          const w = await db.boards.get(y);
          w && i.push({ table: "boards", id: w.id, before: null, after: w });
          const k = t.links.map((e, t) => ({
            boardId: y,
            title: sanitizeTitle(
              ("string" == typeof e?.title ? e.title.trim() : "") || e.url,
              500,
            ),
            url: e.url,
            description: sanitizeBookmarkNote(
              resolveImportedLinkRawDescription(e, !0),
            ),
            order: t,
          }));
          if (0 === k.length) continue;
          const I = await bulkAddBookmarks(k, {
            skipHistory: !0,
            syncChunkSize: 250,
          });
          ((b += I.length),
            a &&
              updateImportLinksProgressModal(
                getImportLinksProgressTitle(!0),
                getImportLinksImportedStatus(b, o),
                b,
                o,
              ),
            I.length > 0 &&
              (await db.bookmarks.bulkGet(I)).filter(Boolean).forEach((e) => {
                i.push({
                  table: "bookmarks",
                  id: e.id,
                  before: null,
                  after: e,
                });
              }));
        }
      }
      ((n.canCancel = !1),
        setImportLinksProgressCancelable(!1),
        !isApplyingUndoRedoHistory &&
          i.length > 0 &&
          (await recordUndoRedoHistoryEntry({
            kind: "import_links_papaly_pages",
            label: `Import ${b} links into ${S} boards across ${w} pages`,
            ops: i,
          })),
        (s = !0),
        b > 0 && (await e?.()),
        S > 0 && ((pageHasBoards = !0), hideAddBoardPlaceholder()),
        await loadPagesNavigation(),
        k && k !== currentPageId
          ? await switchToPage(k)
          : await loadBoardsFromDatabase(),
        closeImportLinksModal(),
        broadcastDataChange("importLinks"));
      const I = getImportSuccessMessage({
        links: b,
        boards: S,
        pages: w,
        unsafe: r,
      });
      return void showGlassToast(I, b > 0 ? "success" : "info");
    }
    if (u === IMPORT_LINKS_CREATE_PAGE_VALUE)
      return void showGlassToast(llT("import.selectOrCreatePage"), "warning");
    const E = u,
      C = I.some((e) => Number.isFinite(e?.columnIndex));
    if (
      (C &&
        ((I = I.map((e, t) => ({ ...e, _importIndex: t }))),
        I.sort((e, t) => {
          const r = Number.isFinite(e.columnIndex) ? e.columnIndex : 0,
            a = Number.isFinite(t.columnIndex) ? t.columnIndex : 0;
          if (r !== a) return r - a;
          const o = Number.isFinite(e.orderKey) ? e.orderKey : e._importIndex,
            n = Number.isFinite(t.orderKey) ? t.orderKey : t._importIndex;
          return o !== n ? o - n : e._importIndex - t._importIndex;
        })),
      0 === I.length || I.every((e) => 0 === e.links.length))
    )
      return void showGlassToast(llT("import.noLinksFound"), "error");
    const {
      preparedGroups: v,
      totalUnsafe: A,
      totalPreparedLinks: _,
    } = collectPreparedImportGroups(I);
    if (0 === v.length || 0 === _)
      return void showGlassToast(llT("import.noLinksFound"), "error");
    const B = _,
      P = v.length,
      R = checkBoardLimit(P);
    if (!R.allowed)
      return (
        console.warn(
          "[Import Links] Board limit would be exceeded:",
          R.warning,
        ),
        void (R.remaining > 0
          ? showGlassToast(
              llT("import.limitGroupsPartial", {
                remaining: llNumber(R.remaining),
                total: llNumber(P),
              }),
              "warning",
            )
          : showGlassToast(R.warning, "error"))
      );
    const F = await checkBookmarkLimitForBulkImport(B);
    if (!F.allowed)
      return (
        console.warn(
          "[Import Links] Bookmark limit would be exceeded:",
          F.warning,
        ),
        void (F.remaining > 0
          ? showGlassToast(
              llT("import.limitLinksPartial", {
                remaining: llNumber(F.remaining),
                total: llNumber(B),
              }),
              "warning",
            )
          : showGlassToast(F.warning, "error"))
      );
    (F.warning,
      closeImportLinksModal({ clearContextMeta: !1 }),
      (a = showImportLinksProgressModal(
        getImportLinksProgressTitle(!1),
        getImportLinksImportedStatus(0, _),
      )));
    const x = getImportTitleFetchTargets(v, L);
    let M = new Map();
    if (x.length > 0) {
      ((n.canCancel = !0), a && setImportLinksProgressCancelable(!0));
      try {
        (a &&
          updateImportLinksProgressModal(
            getImportLinksProgressTitle(!1),
            getImportLinksProcessedStatus(0, x.length),
            0,
            x.length,
          ),
          (M = await fetchTitlesForImportTargets(x, {
            concurrency: 4,
            shouldCancel: () => n.cancelRequested,
            onProgress: (e, t) => {
              a &&
                updateImportLinksProgressModal(
                  getImportLinksProgressTitle(!1),
                  getImportLinksProcessedStatus(e, t),
                  e,
                  t,
                );
            },
          })));
      } catch (e) {
        console.warn(
          "[Import Links] Title fetch pass failed. Falling back to inferred/imported titles.",
          e,
        );
      }
      if (n.cancelRequested) {
        const e = new Error("Import cancelled by user");
        throw ((e.code = "IMPORT_LINKS_CANCELLED"), e);
      }
    }
    ((n.canCancel = !1), setImportLinksProgressCancelable(!1));
    let O = null,
      W = 0,
      U = 0;
    a &&
      updateImportLinksProgressModal(
        getImportLinksProgressTitle(!1),
        getImportLinksImportedStatus(0, _),
        0,
        _,
      );
    const D = await db.boards
        .filter((e) => e.pageId === E && !e.deletedAt)
        .toArray(),
      N = collectImportedNameRegistry(D, sanitizeBoardName),
      z = {};
    for (let e = 0; e < 4; e++) {
      const t = D.filter((t) => t.columnIndex === e).sort(
          (e, t) => (e.order || 0) - (t.order || 0),
        ),
        r = t.length > 0 ? Math.max(...t.map((e) => e.order || 0)) + 1 : 0;
      z[e] = {
        nextOrder: r,
        boardsCreated: 0,
        createdBoardIds: [],
        existingBoards: t,
      };
    }
    let q = 0,
      G = 1;
    for (const e of v) {
      if (!e.links || 0 === e.links.length) continue;
      const t = normalizeColumnIndex(e.columnIndex),
        r = C && null !== t ? t : "left-to-right" === m ? q % 4 : p,
        o = z[r].nextOrder++;
      z[r].boardsCreated++;
      const n = e && "string" == typeof e.name ? e.name.trim() : "",
        s = buildUniqueImportedBoardName(
          b && !L ? "New Board" : n || `Group ${G}`,
          N,
        ),
        l = await addBoard(
          { pageId: E, name: s, columnIndex: r, order: o },
          { skipHistory: !0 },
        );
      if ((q++, !l)) throw new Error(`Failed to create imported board "${s}".`);
      (G++, U++, z[r].createdBoardIds.push(l));
      const c = await db.boards.get(l);
      c && i.push({ table: "boards", id: c.id, before: null, after: c });
      const d = e.links.map((e, t) => {
          const r = L
            ? ("string" == typeof e.title ? e.title.trim() : "") || e.url
            : resolveImportedLinkTitle({
                url: e.url,
                incomingTitle: e.title,
                fetchedTitle: M.get(e.url),
              });
          return {
            boardId: l,
            title: sanitizeTitle(r, 500),
            url: e.url,
            description: sanitizeBookmarkNote(
              resolveImportedLinkRawDescription(e, L),
            ),
            order: t,
          };
        }),
        u = await bulkAddBookmarks(d, { skipHistory: !0, syncChunkSize: 250 });
      ((W += u.length),
        a &&
          updateImportLinksProgressModal(
            getImportLinksProgressTitle(!1),
            getImportLinksImportedStatus(W, _),
            W,
            _,
          ),
        u.length > 0 &&
          (await db.bookmarks.bulkGet(u)).filter(Boolean).forEach((e) => {
            i.push({ table: "bookmarks", id: e.id, before: null, after: e });
          }));
    }
    if (!g) {
      const e = new Set();
      Object.values(z).forEach((t) => {
        (t.existingBoards.forEach((t) => e.add(t.id)),
          t.createdBoardIds.forEach((t) => e.add(t)));
      });
      const t = await collectUndoRedoSnapshotsByIds("boards", Array.from(e)),
        r = new Set(),
        a = getCurrentTimestamp();
      if (
        (await db.transaction("rw", db.boards, async () => {
          for (let e = 0; e < 4; e++) {
            const o = z[e].createdBoardIds.length;
            if (0 !== o) {
              for (let o = 0; o < z[e].createdBoardIds.length; o++) {
                const n = z[e].createdBoardIds[o],
                  i = t.get(n);
                i &&
                  i.order !== o &&
                  (await db.boards.update(n, { order: o, updatedAt: a }),
                  r.add(n));
              }
              for (const n of z[e].existingBoards) {
                const e = (n.order || 0) + o,
                  i = t.get(n.id);
                i &&
                  i.order !== e &&
                  (await db.boards.update(n.id, { order: e, updatedAt: a }),
                  r.add(n.id));
              }
            }
          }
        }),
        r.size > 0)
      ) {
        const e = await collectUndoRedoSnapshotsByIds("boards", Array.from(r)),
          a = new Map(Array.from(r).map((e) => [e, t.get(e) || null])),
          o = buildUndoRedoOpsFromSnapshotMaps("boards", a, e),
          n = await queueSyncItemsAtomically(
            o
              .filter((e) => e.after)
              .map((e) => ({
                op: "upsert",
                table: "boards",
                id: e.id,
                data: e.after,
              })),
            { contextLabel: "importLinksTopPlacement" },
          );
        n.success
          ? i.push(...o)
          : (await rollbackLocalMutationOps(o),
            (O = llT("import.topPlacementKeptBelow")),
            console.warn(
              "[Import Links] Failed to sync top-placement board reorder. Keeping imported boards below existing boards.",
              n.error,
            ));
      }
    }
    (!isApplyingUndoRedoHistory &&
      i.length > 0 &&
      (await recordUndoRedoHistoryEntry({
        kind: "import_links",
        label: `Import ${W} links into ${U} boards`,
        ops: i,
      })),
      (s = !0),
      W > 0 && (await e?.()),
      (pageHasBoards = !0),
      hideAddBoardPlaceholder(),
      E !== currentPageId
        ? await switchToPage(E)
        : await loadBoardsFromDatabase(),
      closeImportLinksModal(),
      broadcastDataChange("importLinks"));
    const H = getImportSuccessMessage({
      links: W,
      boards: U,
      unsafe: A,
      trailingWarning: O,
    });
    showGlassToast(H, O ? "warning" : W > 0 ? "success" : "info");
  } catch (e) {
    const t = "IMPORT_LINKS_CANCELLED" === e?.code;
    if (!s && i.length > 0) {
      const e = await rollbackImportMutationBatch(i, {
        contextLabel: "importLinksRollback",
      });
      if (!e.success)
        return (
          console.error(
            "[Import Links] Failed to roll back partial import:",
            e.error,
          ),
          showGlassToast(llT("import.progressFailedPartial"), "error"),
          void (o = !1)
        );
      (await loadPagesNavigation({ scrollToActive: !1 }),
        await loadBoardsFromDatabase());
    }
    (t
      ? showGlassToast(llT("import.cancelled"), "info")
      : (console.error("[Import Links] Import error:", e),
        showGlassToast(llT("import.progressFailed"), "error")),
      a && (o = !0));
  } finally {
    if ((a && hideImportLinksProgressModal(), o)) {
      const e = document.getElementById("importLinksModal");
      e && e.classList.add("active");
    }
    ((_activeImportLinksRun = null),
      (_importLinksInProgress = !1),
      t && ((t.disabled = !1), (t.textContent = r)));
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const e = document.getElementById("confirmImportLinksBtn");
  e && e.addEventListener("click", handleImportLinks);
  const t = document.getElementById("cancelImportLinksBtn");
  t && t.addEventListener("click", closeImportLinksModal);
  const r = document.getElementById("cancelImportLinksProgressBtn");
  r && r.addEventListener("click", requestCancelActiveImportLinksRun);
  const a = document.getElementById("importLinksDistribution"),
    o = document.getElementById("importLinksColumnRow");
  a &&
    o &&
    a.addEventListener("change", () => {
      o.style.display = "single" === a.value ? "block" : "none";
    });
  const n = document.getElementById("importLinksFile");
  n &&
    n.addEventListener("change", async (e) => {
      const t = document.getElementById("importLinksTextarea"),
        r = document.getElementById("importLinksFileIndicator"),
        a = document.getElementById("importLinksFileName"),
        o = document.getElementById("importLinksUploadRow");
      if (e.target.files.length > 0) {
        const n = e.target.files[0];
        (t && (t.style.display = "none"),
          o && (o.style.display = "none"),
          r && ((r.style.display = "block"), a && (a.textContent = n.name)),
          await detectPapalyExportFromImportFile(n));
      } else
        ((_importLinksFileDetectionToken += 1), setImportLinksPapalyFileUi(!1));
    });
  const i = document.getElementById("importLinksPage"),
    s = document.getElementById("importLinksCreatePageRow"),
    l = document.getElementById("importLinksCreatePageInput"),
    c = document.getElementById("importLinksCreatePageBtn"),
    d = document.getElementById("importLinksCancelCreatePageBtn");
  let u = !1;
  (i &&
    i.addEventListener("change", () => {
      i.value === IMPORT_LINKS_CREATE_PAGE_VALUE
        ? (s && (s.style.display = "flex"), l && ((l.value = ""), l.focus()))
        : (s && (s.style.display = "none"),
          l && (l.value = ""),
          (i.dataset.lastSelectedPageId = i.value));
    }),
    c &&
      c.addEventListener("click", async () => {
        if (u) return;
        if (!l || !i) return;
        const e = l.value.trim();
        if (!e)
          return (
            showGlassToast(llLiteral("Please enter a page name"), "warning"),
            void l.focus()
          );
        ((u = !0), (c.disabled = !0));
        try {
          const t = await db.pages.orderBy("order").reverse().first(),
            r = t ? t.order + 1 : 0,
            a = buildUniqueImportedPageName(
              e,
              collectImportedNameRegistry(
                await db.pages.filter((e) => !e.deletedAt).toArray(),
                sanitizePageName,
              ),
            ),
            o = await addPage({ name: a, order: r, isDefault: !1 });
          if (!o) return;
          (await populateImportLinksPageSelect(i, o),
            resetImportLinksCreatePageUI(),
            await loadPagesNavigation({ scrollToActive: !1 }));
        } finally {
          ((c.disabled = !1), (u = !1));
        }
      }),
    l &&
      l.addEventListener("keydown", (e) => {
        "Enter" === e.key && c && (e.preventDefault(), c.click());
      }),
    d &&
      d.addEventListener("click", () => {
        if (!i) return;
        const e = i.dataset.lastSelectedPageId;
        if (e && i.querySelector(`option[value="${e}"]`)) i.value = e;
        else {
          const e = i.querySelector(
            `option:not([value="${IMPORT_LINKS_CREATE_PAGE_VALUE}"])`,
          );
          e && (i.value = e.value);
        }
        (i.value !== IMPORT_LINKS_CREATE_PAGE_VALUE &&
          (i.dataset.lastSelectedPageId = i.value),
          resetImportLinksCreatePageUI());
      }));
  const p = document.getElementById("clearImportFileBtn");
  (p &&
    p.addEventListener("click", () => {
      const e = document.getElementById("importLinksTextarea"),
        t = document.getElementById("importLinksFileIndicator"),
        r = document.getElementById("importLinksFile"),
        a = document.getElementById("importLinksUploadRow");
      (r && (r.value = ""),
        (_importLinksFileDetectionToken += 1),
        setImportLinksPapalyFileUi(!1),
        e && (e.style.display = "block"),
        a && (a.style.display = "flex"),
        t && (t.style.display = "none"));
    }),
    setupModalClickOutside(
      document.getElementById("importLinksModal"),
      closeImportLinksModal,
    ));
  const m = document.getElementById("floatingImportBtn"),
    g = document.getElementById("importPopup"),
    f = document.getElementById("importChromeBookmarksPopupBtn"),
    h = document.getElementById("importLinksPopupBtn"),
    y = document.getElementById("floatingWallpaperBtn"),
    b = document.getElementById("wallpaperPopup"),
    S = document.querySelectorAll(".wallpaper-theme-btn"),
    w = document.getElementById("wallpaperGrid"),
    k = document.getElementById("wallpaperContextMenu"),
    E = document.getElementById("wallpaperStyleModal"),
    C = document.getElementById("wallpaperStyleModalCancelBtn"),
    v = document.getElementById("wallpaperStyleModalResetBtn"),
    A = document.getElementById("wallpaperStyleModalSaveBtn");
  (m &&
    g &&
    m.addEventListener("click", (e) => {
      (e.stopPropagation(),
        g.classList.contains("active")
          ? closeImportPopup()
          : (closeWallpaperPopup(), openImportPopup()));
    }),
    f &&
      f.addEventListener("click", () => {
        (closeImportPopup(), showChromeImportModal());
      }),
    h &&
      h.addEventListener("click", () => {
        (closeImportPopup(), openImportLinksModal());
      }),
    y &&
      b &&
      (y.setAttribute("aria-haspopup", "dialog"),
      y.setAttribute("aria-expanded", "false"),
      y.addEventListener("click", (e) => {
        (e.stopPropagation(),
          b.classList.contains("active")
            ? closeWallpaperPopup()
            : (closeImportPopup(), openWallpaperPopup()));
      })),
    S.forEach((e) => {
      e.addEventListener("click", handleWallpaperThemeButtonClick);
    }),
    w &&
      (w.addEventListener("click", (e) => {
        handleWallpaperTileClick(e).catch((e) => {
          console.error("Failed to update wallpaper selection:", e);
        });
      }),
      w.addEventListener("contextmenu", (e) => {
        handleWallpaperTileContextMenu(e).catch((e) => {
          console.error("Failed to open wallpaper context menu:", e);
        });
      }),
      w.addEventListener(
        "scroll",
        () => {
          closeWallpaperContextMenu();
        },
        { passive: !0 },
      )),
    k &&
      k.addEventListener("click", (e) => {
        handleWallpaperContextMenuClick(e).catch((e) => {
          console.error("Failed to handle wallpaper context menu action:", e);
        });
      }),
    E && initializeWallpaperStyleEditorDrag(),
    C &&
      C.addEventListener("click", () => {
        closeWallpaperStyleEditor();
      }),
    v &&
      v.addEventListener("click", () => {
        resetWallpaperStyleEditorDraft();
      }),
    A &&
      A.addEventListener("click", () => {
        saveWallpaperStyleEditorDraft().catch((e) => {
          console.error("Failed to save wallpaper style changes:", e);
        });
      }));
  let _ = !1,
    B = !1;
  const targetIsInsideControl = (e, t) => !!(e && t && e.contains(t));
  (document.addEventListener("mousedown", (e) => {
    if (
      (g &&
        g.classList.contains("active") &&
        (_ = !g.contains(e.target) && !targetIsInsideControl(m, e.target)),
      b && b.classList.contains("active"))
    ) {
      const t = !!e.target.closest(".wallpaper-context-menu"),
        r = !!e.target.closest("#wallpaperStyleModal");
      B = !(
        b.contains(e.target) ||
        targetIsInsideControl(y, e.target) ||
        t ||
        r
      );
    }
  }),
    document.addEventListener("mouseup", (e) => {
      if (g && g.classList.contains("active")) {
        const t = !g.contains(e.target) && !targetIsInsideControl(m, e.target);
        _ && t && closeImportPopup();
      }
      if (b && b.classList.contains("active")) {
        const t = !!e.target.closest(".wallpaper-context-menu"),
          r = !!e.target.closest("#wallpaperStyleModal"),
          a = !(
            b.contains(e.target) ||
            targetIsInsideControl(y, e.target) ||
            t ||
            r
          );
        B && a && closeWallpaperPopup();
      }
      ((_ = !1), (B = !1));
    }),
    document.addEventListener("click", (e) => {
      e.target.closest(".wallpaper-context-menu") ||
        closeWallpaperContextMenu();
    }),
    initFloatingControlsDock());
});
let floatingControlsDockInitialized = !1,
  floatingControlsAutoCollapsed = !1,
  wallpaperPopupResizeObserver = null;
function getFloatingControlsDom() {
  return {
    dock: document.getElementById("workspaceControlsDock"),
    tray: document.getElementById("workspaceControlsTray"),
    dockToggle: document.getElementById("workspaceControlsToggle"),
    rail: document.getElementById("floatingControlsRail"),
    toolsToggle: document.getElementById("floatingToolsToggle"),
    toolsMenu: document.getElementById("floatingToolsMenu"),
    searchBtn: document.getElementById("floatingSearchBtn"),
    settingsBtn: document.getElementById("floatingSettingsBtn"),
    importBtn: document.getElementById("floatingImportBtn"),
    importPopup: document.getElementById("importPopup"),
    wallpaperBtn: document.getElementById("floatingWallpaperBtn"),
    wallpaperPopup: document.getElementById("wallpaperPopup"),
  };
}
function getFloatingControlsCollapsedEnabled() {
  return (
    !0 === floatingControlsCollapsedEnabled || floatingControlsAutoCollapsed
  );
}
function setFloatingControlsCollapsedEnabled(e) {
  floatingControlsCollapsedEnabled = !0 === e;
}
function isFloatingToolsDockOpen() {
  return !!document
    .getElementById("floatingControlsRail")
    ?.classList.contains("tools-open");
}
function isCompactControlsLayout() {
  return (
    "1" ===
    getComputedStyle(document.documentElement)
      .getPropertyValue("--ll-compact-controls")
      .trim()
  );
}
function isCompactControlsDockOpen() {
  return !!document
    .getElementById("workspaceControlsDock")
    ?.classList.contains("is-open");
}
function openCompactControlsDock() {
  const { dock: e, tray: t, dockToggle: r } = getFloatingControlsDom();
  e &&
    t &&
    r &&
    isCompactControlsLayout() &&
    (e.classList.add("is-open"),
    r.setAttribute("aria-expanded", "true"),
    (t.inert = !1),
    requestAnimationFrame(repositionActiveFloatingPopups));
}
function closeCompactControlsDock(e = {}) {
  const { restoreFocus: t = !0 } = e,
    { dock: r, tray: a, dockToggle: o } = getFloatingControlsDom();
  r &&
    a &&
    o &&
    (t &&
      isCompactControlsDockOpen() &&
      a.contains(document.activeElement) &&
      o.focus({ preventScroll: !0 }),
    r.classList.remove("is-open"),
    o.setAttribute("aria-expanded", "false"),
    (a.inert = isCompactControlsLayout()),
    requestAnimationFrame(repositionActiveFloatingPopups));
}
function shouldAutoCollapseFloatingControls() {
  const e = document.documentElement.clientWidth || window.innerWidth;
  if (!e) return !1;
  const t = getComputedStyle(document.documentElement),
    r = getComputedStyle(document.body),
    a = parseFloat(t.getPropertyValue("--ll-workspace-max-width")) || 1200,
    o = parseFloat(t.getPropertyValue("--ll-floating-control-size")) || 56,
    n = parseFloat(t.getPropertyValue("--ll-floating-control-offset")) || 24,
    i = parseFloat(t.getPropertyValue("--ll-floating-control-board-gap")) || 8,
    s = parseFloat(r.paddingLeft) || 0,
    l = parseFloat(r.paddingRight) || 0,
    c = Math.max(0, e - s - l);
  return s + (c + Math.min(a, c)) / 2 + i > e - n - o;
}
function applyFloatingControlsCollapsedState() {
  if ("undefined" == typeof document) return;
  const e = document.body.classList.contains("floating-controls-collapsed"),
    t = document.body.classList.contains("compact-controls-layout"),
    r = isCompactControlsLayout();
  floatingControlsAutoCollapsed = r || shouldAutoCollapseFloatingControls();
  const a = getFloatingControlsCollapsedEnabled(),
    {
      toolsMenu: o,
      toolsToggle: n,
      searchBtn: i,
      tray: s,
      dockToggle: l,
    } = getFloatingControlsDom(),
    c = document.activeElement;
  (document.body.classList.toggle(
    "floating-controls-narrow",
    floatingControlsAutoCollapsed,
  ),
    document.body.classList.toggle("floating-controls-collapsed", a),
    document.body.classList.toggle("compact-controls-layout", r),
    r && !t && s?.contains(c)
      ? l?.focus({ preventScroll: !0 })
      : !r && t && c === l
        ? i?.focus({ preventScroll: !0 })
        : r || !a || (e && !t) || !o?.contains(c)
          ? r || a || c !== n || i?.focus({ preventScroll: !0 })
          : n?.focus({ preventScroll: !0 }),
    (a && e && r === t) || closeFloatingToolsDock({ restoreFocus: !1 }),
    r !== t && closeCompactControlsDock({ restoreFocus: !1 }),
    o && (o.inert = !r && a && !isFloatingToolsDockOpen()),
    s && (s.inert = r && !isCompactControlsDockOpen()),
    updateFloatingControlsCollapsedToggle(),
    requestAnimationFrame(() => {
      repositionActiveFloatingPopups();
    }));
}
function updateFloatingControlsCollapsedToggle() {
  const e = document.getElementById("floatingControlsCollapsedToggle");
  e &&
    ((e.checked = getFloatingControlsCollapsedEnabled()),
    (e.disabled = floatingControlsAutoCollapsed));
}
async function loadFloatingControlsCollapseSetting(e = null) {
  try {
    (setFloatingControlsCollapsedEnabled(
      !0 ===
        (e && "object" == typeof e
          ? e
          : await chrome.storage.local.get("floatingControlsCollapsedEnabled")
        ).floatingControlsCollapsedEnabled,
    ),
      applyFloatingControlsCollapsedState(),
      updateFloatingControlsCollapsedToggle());
  } catch (e) {
    (console.error("Error loading floating controls layout setting:", e),
      setFloatingControlsCollapsedEnabled(!1),
      applyFloatingControlsCollapsedState(),
      updateFloatingControlsCollapsedToggle());
  }
}
async function saveFloatingControlsCollapseSetting() {
  "undefined" != typeof chrome &&
    chrome.storage?.local &&
    (await chrome.storage.local.set({
      [FLOATING_CONTROLS_COLLAPSED_STORAGE_KEY]:
        !0 === floatingControlsCollapsedEnabled,
    }));
}
async function toggleFloatingControlsCollapseSetting() {
  if (floatingControlsAutoCollapsed)
    return (updateFloatingControlsCollapsedToggle(), !1);
  const e = document.getElementById("floatingControlsCollapsedToggle"),
    t = !0 === floatingControlsCollapsedEnabled;
  (setFloatingControlsCollapsedEnabled(!0 === e?.checked),
    applyFloatingControlsCollapsedState(),
    updateFloatingControlsCollapsedToggle());
  try {
    return (await saveFloatingControlsCollapseSetting(), !0);
  } catch (e) {
    return (
      console.error("Error saving floating controls layout setting:", e),
      setFloatingControlsCollapsedEnabled(t),
      applyFloatingControlsCollapsedState(),
      updateFloatingControlsCollapsedToggle(),
      showGlassToast(
        "Failed to save the floating tools layout. Please try again.",
        "error",
      ),
      !1
    );
  }
}
function openFloatingToolsDock() {
  const { rail: e, toolsToggle: t, toolsMenu: r } = getFloatingControlsDom();
  e &&
    t &&
    getFloatingControlsCollapsedEnabled() &&
    !isCompactControlsLayout() &&
    (e.classList.add("tools-open"),
    t.classList.add("active"),
    t.setAttribute("aria-expanded", "true"),
    r && (r.inert = !1));
}
function closeFloatingToolsDock(e = {}) {
  const { restoreFocus: t = !0 } = e,
    { rail: r, toolsToggle: a, toolsMenu: o } = getFloatingControlsDom();
  if (!r || !a) return;
  const n =
    t &&
    r.classList.contains("tools-open") &&
    "function" == typeof a.focus &&
    r.contains(document.activeElement);
  (r.classList.remove("tools-open"),
    a.classList.remove("active"),
    a.setAttribute("aria-expanded", "false"),
    o &&
      (o.inert =
        !isCompactControlsLayout() && getFloatingControlsCollapsedEnabled()),
    n && a.focus({ preventScroll: !0 }));
}
function toggleFloatingToolsDock() {
  getFloatingControlsCollapsedEnabled() &&
    (isFloatingToolsDockOpen()
      ? closeFloatingToolsDock()
      : openFloatingToolsDock());
}
function positionFloatingPopupNearButton(e, t) {
  if (!e || !t) return;
  const r = e.getBoundingClientRect(),
    a = isCompactControlsLayout(),
    { tray: o, dockToggle: n } = getFloatingControlsDom(),
    i = (
      (a ? (isCompactControlsDockOpen() ? o : n) : t) || t
    ).getBoundingClientRect(),
    s = r.width || e.offsetWidth || 0,
    l = r.height || e.offsetHeight || 0;
  if (!s || !l) return;
  const c = a ? i.left + (i.width - s) / 2 : i.left - s - 14,
    d = i.right + 14,
    u = window.innerWidth - s - 16,
    p = window.innerHeight - l - 16;
  let m = c;
  (!a && m < 16 && d <= u && (m = d),
    (m = clampNumber(m, 16, Math.max(16, u), 16)));
  const g = clampNumber(
    a ? i.top - l - 14 : i.top + i.height / 2 - l / 2,
    16,
    Math.max(16, p),
    16,
  );
  ((e.style.left = `${Math.round(m)}px`),
    (e.style.top = `${Math.round(g)}px`),
    (e.style.right = "auto"),
    (e.style.bottom = "auto"));
}
function repositionActiveFloatingPopups() {
  const {
    importBtn: e,
    importPopup: t,
    wallpaperBtn: r,
    wallpaperPopup: a,
  } = getFloatingControlsDom();
  (t?.classList.contains("active") &&
    e &&
    positionFloatingPopupNearButton(t, e),
    a?.classList.contains("active") &&
      r &&
      positionFloatingPopupNearButton(a, r));
}
function initializeWallpaperPopupResizeObserver(e, t) {
  e &&
    t &&
    "function" == typeof ResizeObserver &&
    (wallpaperPopupResizeObserver && wallpaperPopupResizeObserver.disconnect(),
    (wallpaperPopupResizeObserver = new ResizeObserver(() => {
      e.classList.contains("active") && positionFloatingPopupNearButton(e, t);
    })),
    wallpaperPopupResizeObserver.observe(e));
}
function initFloatingControlsDock() {
  if (floatingControlsDockInitialized) return;
  floatingControlsDockInitialized = !0;
  const {
    dock: e,
    tray: t,
    dockToggle: r,
    rail: a,
    toolsToggle: o,
    toolsMenu: n,
    importPopup: i,
    wallpaperBtn: s,
    wallpaperPopup: l,
  } = getFloatingControlsDom();
  if (a && o && n) {
    if (
      (initializeWallpaperPopupResizeObserver(l, s),
      o.addEventListener("click", (e) => {
        (e.stopPropagation(), toggleFloatingToolsDock());
      }),
      r?.addEventListener("click", () => {
        isCompactControlsDockOpen()
          ? closeCompactControlsDock()
          : openCompactControlsDock();
      }),
      e?.addEventListener("keydown", (e) => {
        if (isCompactControlsLayout())
          if ("Escape" === e.key && isCompactControlsDockOpen()) {
            if (
              i?.classList.contains("active") ||
              l?.classList.contains("active")
            )
              return;
            (e.preventDefault(),
              e.stopPropagation(),
              closeCompactControlsDock());
          } else
            e.target === r &&
              "ArrowUp" === e.key &&
              (e.preventDefault(),
              openCompactControlsDock(),
              t
                ?.querySelector(".floating-search-btn")
                ?.focus({ preventScroll: !0 }));
      }),
      document.addEventListener("mousedown", (t) => {
        const r = t.target;
        isCompactControlsLayout()
          ? !isCompactControlsDockOpen() ||
            e?.contains(r) ||
            i?.contains(r) ||
            l?.contains(r) ||
            closeCompactControlsDock({ restoreFocus: !1 })
          : getFloatingControlsCollapsedEnabled() &&
            isFloatingToolsDockOpen() &&
            (a.contains(r) ||
              i?.contains(r) ||
              l?.contains(r) ||
              closeFloatingToolsDock({ restoreFocus: !1 }));
      }),
      window.addEventListener("resize", () => {
        applyFloatingControlsCollapsedState();
      }),
      "function" == typeof ResizeObserver)
    ) {
      let e = document.documentElement.clientWidth;
      new ResizeObserver(() => {
        const t = document.documentElement.clientWidth;
        t !== e && ((e = t), applyFloatingControlsCollapsedState());
      }).observe(document.documentElement);
    }
    applyFloatingControlsCollapsedState();
  }
}
function openImportPopup() {
  const { importBtn: e, importPopup: t } = getFloatingControlsDom();
  t &&
    e &&
    (positionFloatingPopupNearButton(t, e),
    t.classList.add("active"),
    e.classList.add("active"),
    requestAnimationFrame(() => {
      t.classList.contains("active") && positionFloatingPopupNearButton(t, e);
    }));
}
function closeImportPopup() {
  const { importPopup: e, importBtn: t } = getFloatingControlsDom();
  (e && e.classList.remove("active"), t && t.classList.remove("active"));
}
function openWallpaperPopup() {
  const { wallpaperPopup: e, wallpaperBtn: t } = getFloatingControlsDom();
  (closeWallpaperContextMenu(),
    e &&
      (positionFloatingPopupNearButton(e, t),
      e.classList.add("active"),
      e.setAttribute("aria-hidden", "false"),
      e.removeAttribute("inert")),
    t && (t.classList.add("active"), t.setAttribute("aria-expanded", "true")),
    renderWallpaperPopup(),
    handleWallpaperPopupOpened().catch((e) => {
      console.error("Failed to update hosted wallpaper migration state:", e);
    }),
    emitQuickTourEvent("wallpaper_opened"),
    e &&
      "function" == typeof e.focus &&
      requestAnimationFrame(() => {
        e.classList.contains("active") &&
          (positionFloatingPopupNearButton(e, t),
          e.focus({ preventScroll: !0 }));
      }));
}
function closeWallpaperPopup(e = {}) {
  const { restoreFocus: t = !0 } = e,
    { wallpaperPopup: r, wallpaperBtn: a } = getFloatingControlsDom(),
    o = document.activeElement;
  (!!(r && o && r.contains(o)) &&
    (t && a && "function" == typeof a.focus
      ? a.focus({ preventScroll: !0 })
      : "function" == typeof o.blur && o.blur()),
    closeWallpaperContextMenu(),
    resetWallpaperDropZoneState(),
    closeWallpaperStyleEditor({ restoreOriginalState: !0, restoreFocus: !1 }),
    r &&
      (r.classList.remove("active"),
      r.setAttribute("aria-hidden", "true"),
      r.setAttribute("inert", "")),
    a &&
      (a.classList.remove("active"), a.setAttribute("aria-expanded", "false")));
}
let _shareImportInProgress = !1;
function sanitizeTitle(e, t = 500) {
  return (e && "string" == typeof e && e.trim().substring(0, t)) || "Untitled";
}
function sanitizeBookmarkNote(e, t = 2e3) {
  if ("string" != typeof e) return null;
  const r = e.trim();
  return r && "null" !== r.toLowerCase() ? r.substring(0, t) : null;
}
function sanitizeBoardName(e, t = 200) {
  return (
    (e && "string" == typeof e && e.trim().substring(0, t)) || "Imported Board"
  );
}
function sanitizePageName(e, t = 200) {
  return (
    (e && "string" == typeof e && e.trim().substring(0, t)) || "Imported Page"
  );
}
function normalizeImportedNameKey(e) {
  return "string" != typeof e ? "" : e.trim().toLowerCase();
}
function collectImportedNameRegistry(e, t) {
  const r = new Set();
  if (!Array.isArray(e) || "function" != typeof t) return r;
  for (const a of e) {
    const e = normalizeImportedNameKey(t(a?.name));
    e && r.add(e);
  }
  return r;
}
function buildUniqueImportedName(e, t, r = sanitizePageName) {
  const a = r(e),
    o =
      t &&
      "function" == typeof t.has &&
      "function" == typeof t.add &&
      "function" == typeof t.clear,
    n = o ? t : new Set();
  if (o) {
    const e = Array.from(t).map(normalizeImportedNameKey).filter(Boolean);
    (n.clear(), e.forEach((e) => n.add(e)));
  }
  let i = a,
    s = 2;
  for (; n.has(normalizeImportedNameKey(i)); ) ((i = `${a} (${s})`), s++);
  return (n.add(normalizeImportedNameKey(i)), i);
}
function buildUniqueImportedPageName(e, t) {
  return buildUniqueImportedName(e, t, sanitizePageName);
}
function buildUniqueImportedBoardName(e, t) {
  return buildUniqueImportedName(e, t, sanitizeBoardName);
}
function prepareShareImportBoards(e = []) {
  const t = [];
  let r = 0;
  for (const a of e) {
    if (!a) continue;
    const e = [];
    for (const t of a.bookmarks || []) {
      if (isUnsafeUrl(t?.url)) {
        (r++, console.warn(`Skipped unsafe URL in share import: ${t?.url}`));
        continue;
      }
      const a = sanitizeUrl(t?.url);
      a
        ? e.push({
            title: sanitizeTitle(t?.title || a),
            url: a,
            description: sanitizeBookmarkNote(t?.description),
            order: e.length,
          })
        : (r++, console.warn(`Skipped invalid URL in share import: ${t?.url}`));
    }
    0 !== e.length && t.push({ ...a, bookmarks: e });
  }
  return { preparedBoards: t, skippedCount: r };
}
async function fetchShareData(e) {
  try {
    const t = new AbortController(),
      r = setTimeout(() => t.abort(), 15e3),
      a = await fetch(`${SUPABASE_FUNCTIONS_URL}/get-share?id=${e}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(globalThis.getLumiListDiagnosticHeaders?.({
            surface: "newtab",
          }) || {}),
        },
        signal: t.signal,
      });
    return (clearTimeout(r), a.ok ? await a.json() : { status: "not_found" });
  } catch (e) {
    return "AbortError" === e.name
      ? (console.error("Share fetch timed out"), { status: "timeout" })
      : (console.error("Error fetching share data:", e),
        { status: "not_found" });
  }
}
async function showImportConfirmModal(e) {
  return new Promise(async (t) => {
    const r = document.getElementById("importShareModal"),
      a = document.getElementById("importShareType"),
      o = document.getElementById("importShareTitle"),
      n = document.getElementById("importShareStats"),
      i = document.getElementById("importSharePageSelectSection"),
      s = document.getElementById("importSharePageSelect"),
      l = document.getElementById("importSharePageInfo"),
      c = document.getElementById("cancelImportShareBtn"),
      d = document.getElementById("confirmImportShareBtn"),
      u = "page" === e.share.share_type;
    ((a.textContent = u
      ? `\u{1f4c4} ${llT("share.sharedPage")}`
      : `\u{1f4cb} ${llT("share.sharedBoard")}`),
      (o.textContent = e.share.title));
    const p = e.boards.reduce((e, t) => e + (t.bookmarks?.length || 0), 0);
    if (
      ((n.textContent = u
        ? llT("share.statsBoardsBookmarks", {
            boards: e.boards.length,
            bookmarks: p,
          })
        : llT("share.statsBookmarks", { bookmarks: p })),
      u)
    )
      ((i.style.display = "none"),
        (l.style.display = "block"),
        (d.textContent = llT("share.importPage")));
    else {
      ((i.style.display = "block"),
        (l.style.display = "none"),
        (d.textContent = llT("share.importBoard")));
      const e = await db.pages.filter((e) => !e.deletedAt).toArray();
      if (
        (e.sort((e, t) => e.order - t.order),
        (s.innerHTML = ""),
        0 === e.length)
      ) {
        const e = document.createElement("option");
        ((e.value = ""),
          (e.textContent = llT("share.noPagesAvailable")),
          (e.disabled = !0),
          s.appendChild(e));
      } else
        e.forEach((t) => {
          const r = document.createElement("option");
          ((r.value = t.id),
            (r.textContent = t.name),
            (t.id === currentPageId ||
              (!currentPageId && 0 === e.indexOf(t))) &&
              (r.selected = !0),
            s.appendChild(r));
        });
    }
    const handleCancelClick = () => {
        (cleanup(), r.classList.remove("active"), t(null));
      },
      handleConfirmClick = () => {
        (cleanup(), r.classList.remove("active"));
        const e = s.value,
          a = u ? null : e || null;
        if (!u && !a)
          return (
            showGlassToast(llLiteral("Please select a valid page"), "error"),
            void t(null)
          );
        t({ targetPageId: a });
      };
    let m = !1;
    const handleOverlayMouseDown = (e) => {
        m = e.target === r;
      },
      handleOverlayMouseUp = (e) => {
        (m && e.target === r && handleCancelClick(), (m = !1));
      },
      handleEscapeKey = (e) => {
        "Escape" === e.key && handleCancelClick();
      };
    let g = !1;
    const cleanup = () => {
        g ||
          ((g = !0),
          r.removeEventListener("mousedown", handleOverlayMouseDown),
          r.removeEventListener("mouseup", handleOverlayMouseUp),
          document.removeEventListener("keydown", handleEscapeKey),
          f.removeEventListener("click", handleCancelClick),
          h.removeEventListener("click", handleConfirmClick));
      },
      f = c.cloneNode(!0);
    c.parentNode.replaceChild(f, c);
    const h = d.cloneNode(!0);
    (d.parentNode.replaceChild(h, d),
      f.addEventListener("click", handleCancelClick),
      h.addEventListener("click", handleConfirmClick),
      r.addEventListener("mousedown", handleOverlayMouseDown),
      r.addEventListener("mouseup", handleOverlayMouseUp),
      document.addEventListener("keydown", handleEscapeKey),
      r.classList.add("active"));
  });
}
async function handleShareImport(e, t = null) {
  const r = window.LumiListMobilePromotion?.captureBookmarkSave?.(
    getLoadedWorkspaceOwnerUserId(),
  );
  if (_shareImportInProgress) return;
  _shareImportInProgress = !0;
  const a = [];
  let o = !1;
  window.history.replaceState({}, "", "newtab.html");
  try {
    const n = await fetchShareData(e);
    if ((hideLoadingOverlay(), "active" !== n.status)) {
      let e = llLiteral("This share is no longer available");
      return (
        "disabled" === n.status
          ? (e = llLiteral("This share has been disabled by the owner"))
          : "deleted" === n.status
            ? (e = llLiteral("This content has been removed"))
            : "timeout" === n.status && (e = llT("deleteAccount.timeout")),
        void showGlassToast(e, "error")
      );
    }
    if (!n.share || "object" != typeof n.share || !Array.isArray(n.boards))
      return (
        console.error("Invalid share data structure:", n),
        void showGlassToast(llLiteral("Invalid share data received"), "error")
      );
    if (!n.share.share_type || !n.share.title)
      return (
        console.error("Missing required share properties:", n.share),
        void showGlassToast(llLiteral("Invalid share data received"), "error")
      );
    const i = await db.pages
        .filter((t) => t.shareId === e && !t.deletedAt)
        .first(),
      s = await db.boards
        .filter((t) => t.shareId === e && !t.deletedAt)
        .first();
    if (i || s)
      return (
        i ? i.name : s.name,
        void showGlassToast(
          llLiteral("This is your own shared content - no need to import!"),
          "info",
        )
      );
    if (!canModify())
      return void showGlassToast(
        llLiteral(
          "Cannot import content in read-only mode. Please renew your subscription.",
        ),
        "warning",
      );
    let l = { ...n, share: { ...n.share }, boards: [...n.boards] };
    if (null !== t && "page" === n.share.share_type) {
      const e = parseInt(t, 10);
      if (!isNaN(e) && e >= 0 && e < n.boards.length) {
        const t = n.boards[e];
        ((l.boards = [t]),
          (l.share.share_type = "board"),
          (l.share.title = t.name));
      } else
        (console.warn("Invalid boardIndex:", t),
          showGlassToast(
            llLiteral("Invalid board selection. Importing full page instead."),
            "warning",
          ));
    }
    const { preparedBoards: c, skippedCount: d } = prepareShareImportBoards(
      l.boards,
    );
    if (0 === c.length)
      return void showGlassToast(
        llLiteral("No valid bookmarks found in this shared content."),
        "warning",
      );
    l = { ...l, boards: c };
    const u = l.boards.reduce((e, t) => e + (t.bookmarks?.length || 0), 0),
      p = l.boards.length;
    if ("page" === l.share.share_type) {
      const e = checkPageLimit(1);
      if (!e.allowed)
        return (
          console.warn(
            "[Share Import] Page limit would be exceeded:",
            e.warning,
          ),
          void showGlassToast(e.warning, "error")
        );
    }
    if (p > 0) {
      const e = checkBoardLimit(p);
      if (!e.allowed)
        return (
          console.warn(
            "[Share Import] Board limit would be exceeded:",
            e.warning,
          ),
          void showGlassToast(e.warning, "error")
        );
    }
    const m = await checkBookmarkLimitForBulkImport(u);
    if (!m.allowed)
      return (
        console.warn(
          "[Share Import] Bookmark limit would be exceeded:",
          m.warning,
        ),
        void showGlassToast(m.warning, "error")
      );
    const g = await showImportConfirmModal(l);
    if (!g) return;
    showGlassToast(llT("import.importing"), "info");
    let f = null;
    if ("page" === l.share.share_type) {
      const e = await db.pages.filter((e) => !e.deletedAt).toArray(),
        t = buildUniqueImportedPageName(
          l.share.title,
          collectImportedNameRegistry(e, sanitizePageName),
        ),
        r = await db.pages.orderBy("order").reverse().first(),
        o = r ? r.order + 1 : 0;
      if (((f = await addPage({ name: t, order: o }, { skipHistory: !0 })), !f))
        throw new Error("Failed to create imported page.");
      const n = await db.pages.get(f);
      n && a.push({ table: "pages", id: n.id, before: null, after: n });
      const i = new Set();
      for (const e of l.boards) {
        const t = await addBoard(
          {
            pageId: f,
            name: buildUniqueImportedBoardName(e.name, i),
            columnIndex: Math.max(
              0,
              Math.min(3, parseInt(e.column_index, 10) || 0),
            ),
            order: e.order || 0,
          },
          { skipHistory: !0 },
        );
        if (!t)
          throw new Error(
            `Failed to create imported board "${e.name || "Untitled"}".`,
          );
        const r = await db.boards.get(t);
        r && a.push({ table: "boards", id: r.id, before: null, after: r });
        for (const r of e.bookmarks || []) {
          const o = await addBookmark(
            {
              boardId: t,
              title: r.title,
              url: r.url,
              description: r.description,
              order: r.order || 0,
            },
            { skipHistory: !0 },
          );
          if (!o)
            throw new Error(
              `Failed to import a bookmark into "${e.name || "Untitled"}".`,
            );
          const n = await db.bookmarks.get(o);
          n && a.push({ table: "bookmarks", id: n.id, before: null, after: n });
        }
      }
    } else {
      const e = g.targetPageId,
        t = l.boards[0],
        r = await db.boards
          .filter((t) => t.pageId === e && !t.deletedAt)
          .toArray(),
        o = buildUniqueImportedBoardName(
          t.name,
          collectImportedNameRegistry(r, sanitizeBoardName),
        ),
        n = r.filter((e) => 0 === e.columnIndex);
      for (const e of n) {
        if (
          (await updateBoard(
            e.id,
            { order: (e.order || 0) + 1 },
            { skipHistory: !0 },
          )) <= 0
        )
          throw new Error(
            `Failed to shift board "${e.name || "Untitled"}" before import.`,
          );
        const t = await db.boards.get(e.id);
        t && a.push({ table: "boards", id: t.id, before: e, after: t });
      }
      const i = await addBoard(
        { pageId: e, name: o, columnIndex: 0, order: 0 },
        { skipHistory: !0 },
      );
      if (!i) throw new Error(`Failed to create imported board "${o}".`);
      const s = await db.boards.get(i);
      s && a.push({ table: "boards", id: s.id, before: null, after: s });
      for (const e of t.bookmarks || []) {
        const t = await addBookmark(
          {
            boardId: i,
            title: e.title,
            url: e.url,
            description: e.description,
            order: e.order || 0,
          },
          { skipHistory: !0 },
        );
        if (!t) throw new Error(`Failed to import a bookmark into "${o}".`);
        const r = await db.bookmarks.get(t);
        r && a.push({ table: "bookmarks", id: r.id, before: null, after: r });
      }
    }
    (!isApplyingUndoRedoHistory &&
      a.length > 0 &&
      (await recordUndoRedoHistoryEntry({
        kind:
          "page" === l.share.share_type
            ? "share_import_page"
            : "share_import_board",
        label:
          "page" === l.share.share_type
            ? llT("history.importSharedPage", {
                name: l.share.title || llT("common.untitled"),
              })
            : llT("history.importSharedBoard", {
                name: l.share.title || llT("common.untitled"),
              }),
        ops: a,
      })),
      (o = !0),
      a.some((e) => "bookmarks" === e.table && e.after && !e.before) &&
        (await r?.()));
    const h =
      "page" === g.importType
        ? f
        : g.targetPageId !== currentPageId
          ? g.targetPageId
          : null;
    (await loadPagesNavigation(), h && (await switchToPage(h)));
    let y = llT("import.success");
    if (d > 0) {
      const e = getUnsafeImportSuffix(d);
      e && (y += ` ${e}`);
    }
    (showGlassToast(y, "success"),
      (pageHasBoards = !0),
      hideAddBoardPlaceholder(),
      await loadBoardsFromDatabase());
  } catch (e) {
    if ((console.error("Import error:", e), !o && a.length > 0)) {
      const e = await rollbackImportMutationBatch(a, {
        contextLabel: "handleShareImportRollback",
      });
      if (!e.success)
        return (
          console.error("Failed to roll back partial share import:", e.error),
          showGlassToast(llT("import.progressFailedPartial"), "error"),
          void (_shareImportInProgress = !1)
        );
      (await loadPagesNavigation({ scrollToActive: !1 }),
        await loadBoardsFromDatabase());
    }
    showGlassToast(llT("import.progressFailed"), "error");
  } finally {
    _shareImportInProgress = !1;
  }
}
function checkForShareImport() {
  const e = new URLSearchParams(window.location.search),
    t = e.get("import"),
    r = e.get("boardIndex");
  t &&
    setTimeout(async () => {
      try {
        await handleShareImport(t, r);
      } catch (e) {
        (console.error("Share import failed:", e),
          hideLoadingOverlay(),
          showGlassToast(llT("import.progressFailed"), "error"),
          window.history.replaceState({}, "", "newtab.html"));
      }
    }, 500);
}
async function checkForContextMenuImport() {
  if (!new URLSearchParams(window.location.search).get("contextMenuImport"))
    return;
  updateLoadingMessage(
    llT("startup.preparingImport"),
    llT("startup.loadingLinks"),
  );
  const e = document.getElementById("loadingOverlay");
  (e && ((e.style.display = ""), e.classList.remove("hidden")),
    window.history.replaceState({}, "", "newtab.html"));
  try {
    const { contextMenuImportData: e } = await chrome.storage.local.get(
      "contextMenuImportData",
    );
    if (!e)
      return (
        showGlassToast(llT("import.dataNotFound"), "error"),
        void hideLoadingOverlay()
      );
    const t = 3e5;
    if (Date.now() - e.timestamp > t)
      return (
        await chrome.storage.local.remove("contextMenuImportData"),
        showGlassToast(llT("import.dataExpired"), "error"),
        void hideLoadingOverlay()
      );
    (await chrome.storage.local.remove("contextMenuImportData"),
      await openImportLinksModalWithData(e),
      hideLoadingOverlay());
  } catch (e) {
    (console.error("[ContextMenuImport] Error:", e),
      showGlassToast(llT("import.dataLoadFailed"), "error"),
      hideLoadingOverlay());
  }
}
async function openImportLinksModalWithData(e) {
  const t = document.getElementById("importLinksModal"),
    r = document.getElementById("importLinksTextarea"),
    a = document.getElementById("importLinksPage"),
    o = document.getElementById("importLinksGrouping"),
    n = document.getElementById("importLinksFile");
  if (!t || !r || !a)
    return (
      console.error("[ContextMenuImport] Modal elements not found"),
      void showGlassToast(llT("import.modalOpenFailed"), "error")
    );
  ((_isContextMenuImportFlow = !0),
    (_importLinksFileDetectionToken += 1),
    setImportLinksPapalyFileUi(!1),
    n && (n.value = ""));
  const i = document.getElementById("importLinksFileIndicator"),
    s = document.getElementById("importLinksUploadRow");
  (i && (i.style.display = "none"), s && (s.style.display = "flex"));
  const l = Array.isArray(e.groups) && e.groups.length > 0;
  let c = [],
    d = [];
  if (l)
    ((c = e.groups.map((e) => ({
      name: (e.name || "Imported Links").trim(),
      links: Array.isArray(e.links) ? e.links : [],
      columnIndex: (Number.isFinite(e.columnIndex), e.columnIndex),
      orderKey: (Number.isFinite(e.orderKey), e.orderKey),
    }))),
      (d = c.flatMap((e) => e.links || [])));
  else {
    d = e.links || [];
    const t = new Map();
    d.forEach((e) => {
      const r = e.containerId || 0;
      (t.has(r) || t.set(r, { heading: e.heading || null, links: [] }),
        t.get(r).links.push(e),
        e.heading &&
          !t.get(r).heading &&
          t.set(r, { ...t.get(r), heading: e.heading }));
    });
    const r = [];
    (t.forEach((e) => {
      1 === e.links.length
        ? r.push(e.links[0])
        : c.push({ name: e.heading || null, links: e.links });
    }),
      r.length > 0 && c.push({ name: "Other Links", links: r }));
  }
  const u = c.some(
    (e) => Number.isFinite(e.columnIndex) || Number.isFinite(e.orderKey),
  );
  u &&
    c.sort((e, t) => {
      const r = Number.isFinite(e.columnIndex) ? e.columnIndex : 0,
        a = Number.isFinite(t.columnIndex) ? t.columnIndex : 0;
      return r !== a
        ? r - a
        : (Number.isFinite(e.orderKey) ? e.orderKey : 0) -
            (Number.isFinite(t.orderKey) ? t.orderKey : 0);
    });
  const p = "papaly" === e?.source || u;
  _contextMenuImportMeta = u
    ? {
        groups: c
          .filter((e) => e && "string" == typeof e.name)
          .map((e) => ({
            name: e.name,
            columnIndex: e.columnIndex,
            orderKey: e.orderKey,
          })),
        rawGroups: p
          ? c.map((e) => ({
              ...e,
              links: Array.isArray(e?.links)
                ? e.links.map((e) => ({ ...e }))
                : [],
            }))
          : null,
      }
    : null;
  const m = document.getElementById("importLinksPapalySummary"),
    g = document.getElementById("importLinksPapalyCounts"),
    f = document.getElementById("importLinksGroupingRow"),
    h = document.getElementById("importLinksDistributionRow");
  if (p) {
    m && (m.style.display = "block");
    const e = c.length,
      t = d.length;
    (m &&
      ((m.dataset.hasPageCount = "false"),
      (m.dataset.pageCount = "0"),
      (m.dataset.boardCount = String(e)),
      (m.dataset.linkCount = String(t))),
      g && setImportLinksPapalyCountText(!1, 0, e, t),
      (r.style.display = "none"),
      s && (s.style.display = "none"),
      i && (i.style.display = "none"),
      f && (f.style.display = "none"),
      h && (h.style.display = "none"));
  } else
    (m && (m.style.display = "none"),
      m &&
        (delete m.dataset.hasPageCount,
        delete m.dataset.pageCount,
        delete m.dataset.boardCount,
        delete m.dataset.linkCount),
      (r.style.display = "block"),
      s && (s.style.display = "flex"),
      f && (f.style.display = "block"),
      h && (h.style.display = "flex"));
  let y = "";
  e.sourceTitle && (y += `# Links from: ${e.sourceTitle}\n\n`);
  let b = 1;
  (c.forEach((e) => {
    const t = e.name || "Group " + b++;
    ((y += `## ${t}\n`),
      (e.links || []).forEach((e) => {
        const t = ((e) => {
          if (e.title && e.title !== e.url)
            return e.title.replace(/[\[\]()]/g, "\\$&");
          try {
            return new URL(e.url).hostname;
          } catch {
            return e.url;
          }
        })(e);
        y += `[${t}](${e.url})\n`;
      }),
      (y += "\n"));
  }),
    (r.value = y.trim()),
    p || (r.style.display = "block"),
    o && (o.value = "smart"));
  const S = document.getElementById("importLinksDistribution"),
    w = document.getElementById("importLinksColumnRow");
  (S && (S.value = "left-to-right"), w && (w.style.display = "none"));
  const k = document.getElementById("importLinksBelowExisting");
  (k && (k.checked = !0),
    await populateImportLinksPageSelect(a, currentPageId),
    resetImportLinksCreatePageUI(),
    t.classList.add("active"),
    p ? a && a.focus() : r.focus());
  const I = d.length;
  showGlassToast(
    llT("import.reviewFound", {
      count: llNumber(I),
      linkLabel: getImportCountLabel(
        I,
        "import.linkSingular",
        "import.linkPlural",
      ),
    }),
    "info",
  );
}
(document.addEventListener("DOMContentLoaded", function () {
  (setTimeout(checkForShareImport, 1e3),
    setTimeout(checkForContextMenuImport, 1200));
}),
  "undefined" != typeof chrome &&
    chrome.runtime &&
    chrome.runtime.onMessage &&
    chrome.runtime.onMessage.addListener((e, t, r) =>
      t?.id !== chrome.runtime.id
        ? (console.warn(
            "[New Tab] Rejected message from unauthorized sender:",
            t?.id,
          ),
          r?.({ success: !1, error: "Unauthorized" }),
          !1)
        : "reloadBoards" === e.action
          ? (loadBoardsFromDatabase()
              .then(() => {
                r({ success: !0 });
              })
              .catch((e) => {
                (console.error("Failed to reload boards:", e),
                  r({ success: !1 }));
              }),
            !0)
          : "syncQueueOverflow" === e.action
            ? (console.warn(
                "\u26a0\ufe0f Sync queue overflow detected:",
                e.message,
              ),
              "function" == typeof showGlassToast &&
                showGlassToast(
                  "Some changes may not sync. Try refreshing the page.",
                  "warning",
                ),
              r({ received: !0 }),
              !1)
            : void 0,
    ));
