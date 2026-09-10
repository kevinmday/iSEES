# iSEES Capture for Microsoft Edge

Microsoft Edge on Windows is the sole native and supported browser for iSEES Capture v1. Chrome, Firefox, Safari, Internet Explorer, mobile browsers, and other Chromium browsers are not supported for v1. The toolbar and popup product name remains **iSEES Capture**.

iSEES Capture is the external-source capture companion to iSEES. After informed agreement and an explicit user action, it can inspect selected text and limited source metadata on an ordinary HTTP or HTTPS webpage. It does not use broad host permissions, monitor browsing in the background, or send captured material over a network. Microsoft Edge restricted browser pages, including `edge://` URLs and the Edge Add-ons installation surface, do not permit capture. Internet Explorer is explicitly unsupported.

## Production installation contract

The normal-user journey is:

1. The user discovers iSEES Capture from within iSEES.
2. The user selects **Install iSEES Capture for Microsoft Edge**.
3. Microsoft Edge opens the verified Microsoft Edge Add-ons installation surface.
4. The user explicitly approves installation.
5. The user may pin the loud iSEES Capture icon to the Edge toolbar.
6. The installed extension persists across normal Edge restarts and Windows reboots.
7. The extension still requires informed agreement and explicit activation before it inspects a selection.
8. Captures save locally as iSEES Source Capsule JSON files and are not automatically imported into iSEES.

The production Microsoft Edge Add-ons URL and extension ID are unresolved release values:

- Store URL: **PENDING — assigned after Microsoft Edge Add-ons acceptance**
- Extension ID: **PENDING — assigned by Microsoft Edge Add-ons**

No placeholder in this repository is a functional installation URL. The later in-iSEES advertisement should use the canonical label **Install iSEES Capture for Microsoft Edge** and must remain disabled or absent until the verified store URL is available. This increment does not modify iSEES mode pages.

## Developer-mode acceptance

Developer-mode loading is for local testing only; it is separate from the persistent production installation journey above.

From `isees-ui`, build with:

```powershell
npx tsc -p isees-capture-extension/tsconfig.json
npx vite build --config isees-capture-extension/vite.config.ts
```

In Microsoft Edge, open `edge://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `isees-capture-extension/dist`. Pin and open **iSEES Capture**, review the dedicated agreement, check the unchecked agreement box, and choose **Agree and enable iSEES Capture**. On an ordinary public HTTP(S) webpage, select text, reopen the popup, and choose **Inspect current selection**. Review the exact passage and metadata, select rights and privacy classifications (both default explicitly to unknown), optionally add a separate researcher note, check the per-capture confirmation, and choose **Create iSEES Source Capsule**.

Locate the uniquely named `*.isees-source.json` in Edge's Downloads list or folder and inspect it with a text editor. Reopen iSEES Capture, choose **Withdraw agreement**, then confirm the dedicated agreement screen returns and inspection is unavailable. Record Microsoft Edge browser acceptance only after completing these operator steps.

## Capture boundary

A downloaded Source Capsule is local source material for later human inspection. It is not directly imported into the Research Inbox and is not Candidate Knowledge, verified evidence, accepted knowledge, or System Canon. This version defers screenshots, full-page capture, images or media, attachments, API submission, iSEES persistence, offline queues, and synchronization.
