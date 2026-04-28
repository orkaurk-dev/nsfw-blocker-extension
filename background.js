importScripts("defaults.js", "security.js");

async function syncAppearance() {
  const settings = sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
  const displayName = getDisplayName(settings);

  await chrome.action.setTitle({ title: displayName });
}

async function repairSettingsIfNeeded() {
  const raw = await chrome.storage.local.get(DEFAULT_SETTINGS);
  if (!settingsNeedRepair(raw)) {
    return;
  }

  await chrome.storage.local.set(sanitizeSettings(raw));
}

chrome.runtime.onInstalled.addListener(async () => {
  const sanitized = sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
  await chrome.storage.local.set(sanitized);
  await syncAppearance();
});

chrome.runtime.onStartup.addListener(() => {
  syncAppearance();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (changes.displayName) {
    syncAppearance();
  }

  if (
    changes.enabled ||
    changes.lockUntil ||
    changes.lockDurationDays ||
    changes.displayName ||
    changes.nameChangeLockedUntil ||
    changes.blockedDomains ||
    changes.blockedKeywords
  ) {
    repairSettingsIfNeeded();
  }
});
