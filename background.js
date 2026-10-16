let _scriptsLoaded = false, _scriptLoadError = null;
if ("function" == typeof importScripts) {
  try {
    importScripts("lib/dexie.js");
    importScripts("localization-packs.js");
    importScripts("localization.js");
    importScripts("theme-bootstrap.js");
    importScripts("background/review-prompts.js");
    importScripts("background/quick-save.js");
    importScripts("background/title-fetch.js");
    _scriptsLoaded = true;
  } catch (e) {
    console.error("Failed to import scripts:", e);
    _scriptLoadError = e.message || "Unknown error loading scripts";
  }
} else {
  const e = "undefined" != typeof Dexie,
    r = "undefined" != typeof LumiListLocalization,
    s = "function" == typeof quickSaveCurrentTab && "function" == typeof saveAllTabs,
    c = "function" == typeof fetchPageTitle && "function" == typeof fetchFaviconLinksFromPage && "function" == typeof fetchFaviconAsBase64;
  _scriptsLoaded = e && r && s && c;
  if (!_scriptsLoaded) {
    _scriptLoadError = "Required background globals missing in non-worker background context";
    console.error(_scriptLoadError);
  }
}

function sendBackgroundRuntimeUnavailable(sendResponse, action = "unknown") {
  const err = _scriptLoadError || "Background runtime failed to initialize";
  console.error(`[Background] Runtime unavailable for action "${action}":`, err);
  sendResponse({ success: false, error: err, code: "background_runtime_unavailable" });
}

chrome.runtime.onInstalled.addListener(() => {
  if ("function" == typeof refreshContextMenus) refreshContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  if ("function" == typeof refreshContextMenus) refreshContextMenus();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender?.id !== chrome.runtime.id) {
    console.warn("[Background] Rejected message from unauthorized sender:", sender?.id);
    sendResponse({ success: false, error: "Unauthorized" });
    return;
  }
  if (!_scriptsLoaded) {
    sendBackgroundRuntimeUnavailable(sendResponse, message?.action);
    return;
  }

  const action = message.action;

  if ("quickSave" === action) {
    quickSaveCurrentTab()
      .then(res => sendResponse(res))
      .catch(err => {
        console.error("Error in quickSave:", err);
        sendResponse({ success: false, message: err.message });
      });
    return true;
  }

  if ("saveAllTabs" === action) {
    saveAllTabs()
      .then(res => sendResponse(res))
      .catch(err => {
        console.error("Error in saveAllTabs:", err);
        sendResponse({ success: false, message: err.message });
      });
    return true;
  }

  if ("getPages" === action) {
    (async () => {
      try {
        if ("function" == typeof ensureDbReady) await ensureDbReady();
        const pages = await db.pages.orderBy("order").filter(p => !p.deletedAt).toArray();
        sendResponse({ pages: pages.map(p => ({ id: p.id, name: p.name })) });
      } catch (err) {
        console.error("Error getting pages:", err);
        sendResponse({ pages: [] });
      }
    })();
    return true;
  }

  if ("fetchPageTitle" === action) {
    fetchPageTitle(message.url)
      .then(res => sendResponse(res))
      .catch(err => {
        console.warn("[FetchTitle] Handler error:", err?.message || err);
        sendResponse({ success: false, title: "", error: err.message });
      });
    return true;
  }

  if ("fetchFaviconLinksFromPage" === action) {
    fetchFaviconLinksFromPage(message.url, { timeoutMs: message.timeoutMs })
      .then(icons => sendResponse({ success: true, icons }))
      .catch(err => sendResponse({ success: false, error: err.message, icons: [] }));
    return true;
  }

  if ("fetchFaviconAsBase64" === action) {
    fetchFaviconAsBase64(message.url, { timeoutMs: message.timeoutMs })
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Local stubs for sync-related actions to guarantee smooth callers
  if ("queueSync" === action || "queueBatchSync" === action || "scheduleSyncPush" === action || "forcePush" === action || "clearSyncQueue" === action || "getQueueStatus" === action || "recoverEntitlementPolicyFailures" === action) {
    sendResponse({ success: true, added: Array.isArray(message.payload?.operations) ? message.payload.operations.length : 0 });
    return;
  }

  // Review prompt actions
  if ("reviewPromptRequestDisplay" === action) {
    sendResponse({ success: true, showPrompt: false, reason: "offline" });
    return;
  }
  if ("reviewPromptConfirmDisplay" === action || "reviewPromptCancelDisplay" === action || "reviewPromptHandleAction" === action) {
    sendResponse({ success: true });
    return;
  }

  sendResponse({ success: true });
});
