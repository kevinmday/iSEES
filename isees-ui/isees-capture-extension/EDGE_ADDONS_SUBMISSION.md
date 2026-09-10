# Microsoft Edge Add-ons submission draft

## Listing identity

- Product name: **iSEES Capture for Microsoft Edge**
- Toolbar and popup name: **iSEES Capture**
- Version: **1.0.0**
- Microsoft Edge Add-ons URL: **PENDING — assigned after Microsoft Edge Add-ons acceptance**
- Microsoft Edge Add-ons extension ID: **PENDING — assigned by Microsoft Edge Add-ons**

No pending field above is a functional URL or identifier. This draft does not claim Microsoft review, approval, certification, or endorsement.

## Short description

The iSEES external-source capture companion for Microsoft Edge, saving selected webpage passages as local Source Capsule JSON.

## Full description

iSEES Capture for Microsoft Edge helps an iSEES researcher preserve a selected passage and limited source metadata from an ordinary HTTP or HTTPS webpage. The user must first provide informed agreement, explicitly request inspection of the current selection, review the result, classify rights and privacy, and confirm creation. The extension then downloads a local iSEES Source Capsule JSON file for later human inspection. It does not monitor browsing, perform background capture, transmit captured material, or automatically import anything into iSEES.

Microsoft Edge on Windows is the sole native and supported platform for v1. Chrome, Firefox, Safari, Internet Explorer, mobile browsers, and other Chromium browsers are not supported. Capture cannot run on Edge restricted browser pages such as `edge://` URLs or the Edge Add-ons installation surface.

## Single purpose

Create a local, reviewable iSEES Source Capsule from a passage the user explicitly selects and confirms on the active ordinary webpage.

## Permissions justification

- `activeTab`: grants temporary access to the active ordinary webpage only after the user invokes the extension; no persistent site access is requested.
- `scripting`: runs the narrowly scoped selection and source-metadata extractor after the user presses **Inspect current selection**.
- `downloads`: saves the confirmed Source Capsule JSON file to the user's local Edge downloads destination.
- `storage`: stores only the versioned local informed-agreement record so the user can retain or withdraw agreement.

The manifest has no `host_permissions`, background service worker, or content script. Its extension-page content security policy denies network connections.

## Privacy and informed agreement

Nothing is inspected until the user accepts the dedicated agreement and explicitly presses the inspection control. The extension presents the captured passage and metadata for review, requires explicit rights and privacy classifications and per-capture confirmation, and allows agreement withdrawal. It does not export passwords, cookies, authentication tokens, browser storage, request headers, or browsing history. No captured material is sent over a network.

## Local-only and iSEES authority boundary

The confirmed output is downloaded locally as a uniquely named `*.isees-source.json` Source Capsule. The extension does not directly import it into the Research Inbox or any other iSEES surface. A Source Capsule is source material only: it is not Candidate Knowledge, verified evidence, accepted knowledge, or System Canon, and it cannot elevate itself into those authorities.

## Reviewer test steps

1. Install and open the extension in Microsoft Edge on Windows; optionally pin its icon.
2. Confirm the popup is named **iSEES Capture** and initially requires an unchecked informed-agreement checkbox.
3. Accept the agreement, open an ordinary HTTP(S) webpage, and select a visible passage.
4. Reopen the popup and press **Inspect current selection**; verify that the exact passage and limited source metadata appear.
5. Review rights and privacy classifications, check the per-capture confirmation, and create the Source Capsule.
6. Verify that a uniquely named JSON file appears in Edge Downloads and no automatic iSEES import occurs.
7. Withdraw agreement and verify that inspection is unavailable until agreement is provided again.
8. Open an `edge://` page and verify that capture is unavailable because it is a restricted browser page.
