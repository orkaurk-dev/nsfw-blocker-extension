const DEFAULT_SETTINGS = {
  enabled: true,
  lockUntil: null,
  lockDurationDays: 5,
  displayName: "NSFW Website Blocker",
  nameChangeLockedUntil: null,
  blockedDomains: [
    "pornhub.com",
    "xvideos.com",
    "xnxx.com",
    "xhamster.com",
    "redtube.com",
    "youporn.com",
    "onlyfans.com",
    "chaturbate.com",
    "stripchat.com",
    "rule34.xxx",
    "nhentai.net",
    "hentaihaven.xxx"
  ],
  blockedKeywords: ["porn", "sex", "xxx", "hentai", "nude", "nsfw", "adult"]
};

function normalizeEntry(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\.+$/, "");
}

function dedupeAndClean(values) {
  return [...new Set(values.map(normalizeEntry).filter(Boolean))].sort();
}

function hostnameMatchesDomain(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function shouldBlockUrl(url, settings) {
  if (!isBlockingActive(settings)) {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const domains = dedupeAndClean(settings.blockedDomains || []);
  const keywords = dedupeAndClean(settings.blockedKeywords || []);

  if (domains.some((domain) => hostnameMatchesDomain(hostname, domain))) {
    return true;
  }

  return keywords.some((keyword) => hostname.includes(keyword));
}

function getLockUntilMs(days) {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

function isBlockingLocked(settings) {
  return Boolean(settings.lockUntil) && Number(settings.lockUntil) > Date.now();
}

function isBlockingActive(settings) {
  return Boolean(settings.enabled) || isBlockingLocked(settings);
}

function getBlockingStatus(settings) {
  if (isBlockingLocked(settings)) {
    return {
      active: true,
      locked: true,
      label: `Locked until ${new Date(Number(settings.lockUntil)).toLocaleString()}`
    };
  }

  if (settings.enabled) {
    return { active: true, locked: false, label: "Blocking is on" };
  }

  return { active: false, locked: false, label: "Blocking is off" };
}

function getDisplayName(settings) {
  return String(settings.displayName || DEFAULT_SETTINGS.displayName).trim() || DEFAULT_SETTINGS.displayName;
}

function isNameChangeLocked(settings) {
  return Boolean(settings.nameChangeLockedUntil) && Number(settings.nameChangeLockedUntil) > Date.now();
}

function getNameChangeCooldownUntilMs() {
  return Date.now() + 60 * 60 * 1000;
}

function getNameChangeCooldownRemainingMs(settings) {
  if (!isNameChangeLocked(settings)) {
    return 0;
  }

  return Number(settings.nameChangeLockedUntil) - Date.now();
}
