# pol-menu

## Summary

This web part lets you embed your own HTML and CSS on SharePoint pages across the site collection. Place your local html file on the site, i.e. placed under SiteAssets. Copy the file's path and paste it in the web part property panel, see further down on this page for examples.


## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.23.2-green.svg)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)

## Prerequisites

SharePoint Administrator for app catalog deployment. Normally, I'd recommend that site owners add the extention manually per site.

Node.js 22.14 or later (SPFx 1.23.2 does not support newer majors). The repo ships an `.nvmrc`, so `nvm use` picks the right version.

Because this web part renders author-supplied markup, its manifest sets `requiresCustomScript: true`. It is therefore hidden from the toolbox on site collections where custom script is disabled. To use it there, an administrator must enable custom script for that site collection.

## Solution

| Solution    | Author(s)                                               |
| ----------- | ------------------------------------------------------- |
| pol-menu    | Pål Olav Loftesnes (www.paalolav.no)                    |

## Version history

| Version | Date             | Comments        |
| ------- | ---------------- | --------------- |
| 1.0     | Febryar 6, 2025  | Initial release |
| 1.1     | August 12, 2026  | Sanitize embedded HTML, restrict content sources, upgrade to SPFx 1.23.2 on the Heft toolchain |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

---

## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder
- in the command-line run:

```bash
nvm use
npm install
```

```bash
npm run build:ship
npm run package
```

# Watching the code
```bash
npm run serve
```

This solution uses the [Heft](https://heft.rushstack.io/) toolchain, which is the default for SPFx 1.23. The underlying commands are `heft build --production`, `heft package-solution --production` and `heft start`; run `npx heft --help` for the full list.

## Features

Web part that enables you to add HTML and CSS styling to any SharePoint site.
Ideal for creating menus, embedding external sites with more control than the standard Embed web part.

## Configuration

| Property | Purpose |
| -------- | ------- |
| HTML File URL | Path to the HTML file, e.g. `/SiteAssets/menu.html`. Must resolve to this site, or to a host listed under *Allowed external hosts*. |
| Title | Optional heading rendered above the content. |
| Allowed external hosts | Comma-separated hosts outside this site that may serve content, e.g. `cdn.contoso.com`. Empty means this site only. |

## Content handling

The fetched markup is sanitized before it is rendered:

- HTML and CSS are preserved: tags, `class`, inline `style` attributes and `<style>` blocks all survive.
- Script is not: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<base>`, `<form>`, all `on*` event handler attributes, and `javascript:`/`vbscript:` URLs are removed. Legacy script-bearing CSS (`expression()`, `behavior:`, `-moz-binding`) is stripped as well.
- Only `https:` sources are accepted, and a request that redirects to a host outside the allow list is rejected.

This means interactive menus must be driven by CSS rather than by inline event handlers. Inline `<script>` never executed in this web part anyway, since markup injected through `innerHTML` does not run scripts.

Sanitizing limits what an embedded file can do; it is not a substitute for controlling who can edit pages. Anyone who can edit the page can change these properties.
