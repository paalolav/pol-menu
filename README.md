# pol-menu

## Summary

This web part lets you embed your own HTML and CSS on SharePoint pages across the site collection. Place your local html file on the site, i.e. placed under SiteAssets. Copy the file's path and paste it in the web part property panel, see further down on this page for examples.


## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.20.0-green.svg)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)

## Prerequisites

SharePoint Administrator for app catalog deployment. Normally, I'd recommend that site owners add the extention manually per site.

## Solution

| Solution    | Author(s)                                               |
| ----------- | ------------------------------------------------------- |
| pol-menu    | Pål Olav Loftesnes (www.paalolav.no)                    |

## Version history

| Version | Date             | Comments        |
| ------- | ---------------- | --------------- |
| 1.0     | Febryar 6, 2025  | Initial release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

---

## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder
- in the command-line run:

```bash
npm install
```

```bash
gulp bundle --ship
gulp package-solution --ship
```

# Watching the code 
```bash
gulp serve
```

## Features

Web part that enables you to add HTML and CSS styling to any SharePoint site.
Ideal for creating menus, embedding external sites with more control than the standard Embed web part.
