# iSEES Capture — unpacked browser acceptance

Build with `npx tsc -p isees-capture-extension/tsconfig.json && npx vite build --config isees-capture-extension/vite.config.ts` from `isees-ui`.

In Edge open `edge://extensions`; in Chrome open `chrome://extensions`. Enable **Developer mode**, choose **Load unpacked**, and select `isees-capture-extension/dist`. Pin and open **iSEES Capture**, review the dedicated agreement, check the unchecked agreement box, and choose **Agree and enable iSEES Capture**. On a normal public HTTP(S) page, select text, reopen the popup, and choose **Inspect current selection**. Review the exact passage and metadata, select rights and privacy classifications (both explicitly default to unknown), optionally add a separate researcher note, check the per-capture confirmation, and choose **Create iSEES Source Capsule**.

Locate the uniquely named `*.isees-source.json` in the browser's Downloads list/folder and inspect it with a text editor. Reopen iSEES Capture, choose **Withdraw agreement**, then confirm the dedicated agreement screen returns and inspection is unavailable. Record browser acceptance only after completing these operator steps.

This increment defers screenshots, full-page capture, images/media, attachments, API submission, Research Inbox/New Lead/Incoming Source persistence, offline queues, and synchronization.
