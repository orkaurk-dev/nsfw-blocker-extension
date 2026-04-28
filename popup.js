const stateEl = document.getElementById("state");
const extensionNameEl = document.getElementById("extension-name");
const enabledElPopup = document.getElementById("enabled");
const lockDurationEl = document.getElementById("lock-duration");
const lockBlockingButton = document.getElementById("lock-blocking");
const openOptionsButton = document.getElementById("open-options");

async function loadSettings() {
  return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
}

async function refresh() {
  const settings = await loadSettings();
  const displayName = getDisplayName(settings);
  document.title = displayName;
  extensionNameEl.textContent = displayName;
  enabledElPopup.checked = Boolean(settings.enabled);
  lockDurationEl.value = String(settings.lockDurationDays || 5);

  const status = getBlockingStatus(settings);
  stateEl.textContent = status.label;
  enabledElPopup.disabled = Boolean(status.locked);
  lockBlockingButton.disabled = Boolean(status.locked);
}

enabledElPopup.addEventListener("change", async () => {
  const settings = await loadSettings();
  settings.enabled = enabledElPopup.checked;
  await chrome.storage.local.set(sanitizeSettings(settings));
  refresh();
});

lockDurationEl.addEventListener("change", async () => {
  const settings = await loadSettings();
  settings.lockDurationDays = Number(lockDurationEl.value) || 5;
  await chrome.storage.local.set(sanitizeSettings(settings));
  refresh();
});

lockBlockingButton.addEventListener("click", async () => {
  const settings = await loadSettings();
  settings.enabled = true;
  settings.lockUntil = getLockUntilMs(Number(lockDurationEl.value) || settings.lockDurationDays || 5);
  await chrome.storage.local.set(sanitizeSettings(settings));
  refresh();
});

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

refresh();
