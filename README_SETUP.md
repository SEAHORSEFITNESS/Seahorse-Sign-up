SEAHORSE REGISTRATION – SIMPLE PDF VERSION (UPDATED)

Files:
- index.html: existing registration form with clearer label/body distinction and a submission-complete popup.
- Code.gs: simple PDF summary version; each field label is in a shaded bold cell and the submitted value is in a separate cell.

Configured:
- Google Apps Script endpoint in index.html remains the existing URL.
- Google Sheet ID remains 1eIdNk32NDLlsdKfb-gJxT1jrf0lKQmGYOJpqEFReEDM
- PDF Drive folder ID: 1CtWAxaGGUQ-5VHrQCXgQ_LS9DzAyax_O
- PDF file naming: First_Last_info.pdf

Popup behavior:
After the POST request is sent, the page shows “Submission Complete / 提交完成” and attempts to close itself after about 1.8 seconds. Browsers may block window.close() on a tab not opened by JavaScript. If embedded in a parent website popup/iframe, the parent page must listen for the message type SEAHORSE_REGISTRATION_SUBMITTED and close its modal. A GitHub Pages tab may stay open due to browser security.

Install:
1. Replace Code.gs in the existing Apps Script project and Save.
2. Deploy > Manage deployments > Edit > New version > Deploy.
3. Publish this index.html to the existing GitHub Pages location.
4. Submit a test registration and verify the PDF and Google Sheet entry.
