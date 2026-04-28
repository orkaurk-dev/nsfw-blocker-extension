const SETTINGS_SCHEMA_VERSION = 1;
const MAX_BLOCKED_ITEMS = 500;
const MAX_DOMAIN_LENGTH = 253;
const MAX_KEYWORD_LENGTH = 64;
const MAX_DISPLAY_NAME_LENGTH = 40;
const MAX_LOCK_DAYS = 365;

function toBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeDisplayName(value) {
  const text = String(value || "").trim();
  const cleaned = text.replace(/[^\p{L}\p{N}\s._-]/gu, "");
  return cleaned.slice(0, MAX_DISPLAY_NAME_LENGTH) || DEFAULT_SETTINGS.displayName;
}

function sanitizeDomainEntry(value) {
  const normalized = normalizeEntry(value);
  if (!normalized || normalized.length > MAX_DOMAIN_LENGTH) {
    return "";
  }

  if (!/^[a-z0-9.-]+$/.test(normalized)) {
    return "";
  }

  if (normalized.startsWith(".") || normalized.endsWith(".") || normalized.includes("..")) {
    return "";
  }

  return normalized;
}

function sanitizeKeywordEntry(value) {
  const normalized = normalizeEntry(value);
  if (!normalized || normalized.length > MAX_KEYWORD_LENGTH) {
    return "";
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return "";
  }

  return normalized;
}

function sanitizeList(values, sanitizer, limit) {
  const result = [];
  const seen = new Set();

  for (const value of Array.isArray(values) ? values : []) {
    const clean = sanitizer(value);
    if (!clean || seen.has(clean)) {
      continue;
    }

    seen.add(clean);
    result.push(clean);

    if (result.length >= limit) {
      break;
    }
  }

  return result.sort();
}

function sanitizeSettings(rawSettings) {
  const input = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const settings = {
    ...DEFAULT_SETTINGS,
    ...input,
    schemaVersion: SETTINGS_SCHEMA_VERSION
  };

  settings.enabled = toBoolean(input.enabled, DEFAULT_SETTINGS.enabled);
  settings.lockDurationDays = clamp(
    toInteger(input.lockDurationDays, DEFAULT_SETTINGS.lockDurationDays),
    1,
    MAX_LOCK_DAYS
  );
  settings.lockUntil = isBlockingLocked(input) ? Number(input.lockUntil) : null;
  settings.displayName = sanitizeDisplayName(input.displayName);
  settings.nameChangeLockedUntil = isNameChangeLocked(input) ? Number(input.nameChangeLockedUntil) : null;
  settings.blockedDomains = sanitizeList(input.blockedDomains, sanitizeDomainEntry, MAX_BLOCKED_ITEMS);
  settings.blockedKeywords = sanitizeList(input.blockedKeywords, sanitizeKeywordEntry, MAX_BLOCKED_ITEMS);

  return settings;
}

function settingsNeedRepair(rawSettings) {
  const sanitized = sanitizeSettings(rawSettings);
  return JSON.stringify(rawSettings || {}) !== JSON.stringify(sanitized);
}
