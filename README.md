# NSFW Website Blocker

Chrome/Edge manifest v3 extension that blocks configured NSFW domains and keyword-matched hostnames.

## What it does

- Ships with a starter blocklist of common adult sites.
- Lets you add or remove domains and keywords in the options page.
- Can be toggled on or off from the popup.
- Can be locked for a selectable duration from the popup or options page.
- Can change the displayed name inside the extension UI, with a 1-hour cooldown after saving.
- Replaces blocked pages with a local warning screen.

Note: Chrome and Edge do not let an unpacked extension rename its manifest name at runtime. The "display name" setting changes what the extension shows inside its own UI and its runtime title, not the browser's extension list entry.

## Install locally

1. Open `chrome://extensions` or `edge://extensions`.
2. Turn on Developer mode.
3. Click Load unpacked.
4. Select this folder: where you saved it.

## Notes

- Domain entries block the domain and all subdomains.
- Keyword entries only match the hostname.
- This is a browser-level blocker, not a system-wide one.
