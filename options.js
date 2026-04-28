const statusEl = document.getElementById("status");
const enabledEl = document.getElementById("enabled");
const domainsEl = document.getElementById("domains");
const keywordsEl = document.getElementById("keywords");
const addForm = document.getElementById("add-form");
const entryTypeEl = document.getElementById("entry-type");
const entryValueEl = document.getElementById("entry-value");
const statusTitleEl = document.getElementById("status-title");
const statusDetailEl = document.getElementById("status-detail");
const lockDurationEl = document.getElementById("lock-duration");
const lockBlockingButton = document.getElementById("lock-blocking");
const unlockNowButton = document.getElementById("unlock-now");
const extensionNameEl = document.getElementById("extension-name");
const displayNameEl = document.getElementById("display-name");
const saveAppearanceButton = document.getElementById("save-appearance");
const nameCooldownEl = document.getElementById("name-cooldown");
const resetButton = document.getElementById("reset");

function showStatus(message) {
  statusEl.textContent = message;
  window.clearTimeout(showStatus.timeoutId);
  showStatus.timeoutId = window.setTimeout(() => {
    statusEl.textContent = "";
  }, 1800);
}

async function loadSettings() {
  return sanitizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
}

async function saveSettings(settings) {
  await chrome.storage.local.set(sanitizeSettings(settings));
  showStatus("Saved");
}

function formatMs(ms) {
  const totalMinutes = Math.ceil(ms / (60 * 1000));
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }

  const hours = Math.ceil(totalMinutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function createListItem(value, onRemove) {
  const li = document.createElement("li");
  li.className = "list-item";

  const code = document.createElement("code");
  code.textContent = value;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "remove secondary";
  button.textContent = "Remove";
  button.addEventListener("click", onRemove);

  li.append(code, button);
  return li;
}

async function render() {
  const settings = await loadSettings();
  const displayName = getDisplayName(settings);
  enabledEl.checked = Boolean(settings.enabled);
  lockDurationEl.value = String(settings.lockDurationDays || 5);
  extensionNameEl.textContent = displayName;
  document.title = `${displayName} Settings`;

  displayNameEl.value = displayName;

  const status = getBlockingStatus(settings);
  statusTitleEl.textContent = status.locked ? "Locked" : status.active ? "Blocking active" : "Blocking off";
  statusDetailEl.textContent = status.label;
  enabledEl.disabled = Boolean(status.locked);
  lockBlockingButton.disabled = Boolean(status.locked);
  unlockNowButton.disabled = !status.locked;

  const cooldownRemaining = getNameChangeCooldownRemainingMs(settings);
  const nameLocked = cooldownRemaining > 0;
  displayNameEl.disabled = nameLocked;
  nameCooldownEl.textContent = nameLocked
    ? `Name changes are locked for ${formatMs(cooldownRemaining)}.`
    : "Name changes are available now and lock again for 1 hour after saving.";

  domainsEl.replaceChildren();
  keywordsEl.replaceChildren();

  const domains = dedupeAndClean(settings.blockedDomains || []);
  const keywords = dedupeAndClean(settings.blockedKeywords || []);

  if (!domains.length) {
    const empty = document.createElement("li");
    empty.className = "list-item";
    empty.textContent = "No blocked domains configured.";
    domainsEl.append(empty);
  } else {
    domains.forEach((domain) => {
      domainsEl.append(
        createListItem(domain, async () => {
          const next = await loadSettings();
          next.blockedDomains = dedupeAndClean((next.blockedDomains || []).filter((item) => normalizeEntry(item) !== domain));
          await saveSettings(next);
          render();
        })
      );
    });
  }

  if (!keywords.length) {
    const empty = document.createElement("li");
    empty.className = "list-item";
    empty.textContent = "No blocked keywords configured.";
    keywordsEl.append(empty);
  } else {
    keywords.forEach((keyword) => {
      keywordsEl.append(
        createListItem(keyword, async () => {
          const next = await loadSettings();
          next.blockedKeywords = dedupeAndClean((next.blockedKeywords || []).filter((item) => normalizeEntry(item) !== keyword));
          await saveSettings(next);
          render();
        })
      );
    });
  }
}

enabledEl.addEventListener("change", async () => {
  const settings = await loadSettings();
  settings.enabled = enabledEl.checked;
  await saveSettings(settings);
  render();
});

lockDurationEl.addEventListener("change", async () => {
  const settings = await loadSettings();
  settings.lockDurationDays = Number(lockDurationEl.value) || 5;
  await saveSettings(settings);
  render();
});

lockBlockingButton.addEventListener("click", async () => {
  const settings = await loadSettings();
  settings.enabled = true;
  settings.lockUntil = getLockUntilMs(Number(lockDurationEl.value) || settings.lockDurationDays || 5);
  await saveSettings(settings);
  render();
});

unlockNowButton.addEventListener("click", async () => {
  const settings = await loadSettings();
  settings.lockUntil = null;
  await saveSettings(settings);
  render();
});

saveAppearanceButton.addEventListener("click", async () => {
  const settings = await loadSettings();
  const nextDisplayName = displayNameEl.value.trim() || DEFAULT_SETTINGS.displayName;
  const currentDisplayName = getDisplayName(settings);
  const nameChanged = nextDisplayName !== currentDisplayName;

  if (nameChanged && isNameChangeLocked(settings)) {
    showStatus("Name change cooldown is still active");
    return;
  }

  settings.displayName = nextDisplayName;

  if (nameChanged) {
    settings.nameChangeLockedUntil = getNameChangeCooldownUntilMs();
  }

  await saveSettings(settings);
  render();
});

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const type = entryTypeEl.value;
  const value = normalizeEntry(entryValueEl.value);

  if (!value) {
    showStatus("Enter a value");
    return;
  }

  const settings = await loadSettings();

  if (type === "domain") {
    settings.blockedDomains = dedupeAndClean([...(settings.blockedDomains || []), value]);
  } else {
    settings.blockedKeywords = dedupeAndClean([...(settings.blockedKeywords || []), value]);
  }

  await saveSettings(settings);
  entryValueEl.value = "";
  render();
});

resetButton.addEventListener("click", async () => {
  await chrome.storage.local.set(sanitizeSettings(DEFAULT_SETTINGS));
  showStatus("Reset to defaults");
  render();
});

render();
