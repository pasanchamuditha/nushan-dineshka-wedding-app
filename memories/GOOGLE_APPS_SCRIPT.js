// ─────────────────────────────────────────────────────────────────────────────
// NUSHAN & DINESHKA WEDDING MEMORIES — Google Apps Script Backend
// ─────────────────────────────────────────────────────────────────────────────
// SETUP STEPS:
//   1. Go to https://script.google.com  → New Project
//   2. Paste this entire file
//   3. Click Deploy → New Deployment
//   4. Type: Web App
//   5. Execute as: Me
//   6. Who has access: Anyone
//   7. Click Deploy → copy the Web App URL
//   8. Paste that URL as APPS_SCRIPT_URL in your .env.local (and Vercel env vars)
// ─────────────────────────────────────────────────────────────────────────────

const FOLDER_ID = "1HRm8d6bwdQBLBlWOTlcAE2x6ySwuVM1V";

// ── Upload a photo ────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const base64 = data.image.replace(/^data:image\/\w+;base64,/, "");
    const mime   = data.mimeType || "image/jpeg";
    const ext    = mime.split("/")[1] || "jpg";
    const name   = "Memory_" + new Date().toISOString().replace(/[:.]/g, "-") + "." + ext;

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const blob   = Utilities.newBlob(Utilities.base64Decode(base64), mime, name);
    const file   = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return respond({
      success:      true,
      fileId:       file.getId(),
      fileName:     name,
      thumbnailUrl: thumbUrl(file.getId()),
    });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ── List all photos ───────────────────────────────────────────────────────────
function doGet() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const iter   = folder.getFiles();
    const photos = [];

    while (iter.hasNext()) {
      const f = iter.next();
      if (!f.getMimeType().startsWith("image/")) continue;
      photos.push({
        id:           f.getId(),
        name:         f.getName(),
        thumbnailUrl: thumbUrl(f.getId()),
        createdAt:    f.getDateCreated().toISOString(),
      });
    }

    photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return respond({ success: true, photos });
  } catch (err) {
    return respond({ success: false, error: err.message, photos: [] });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function thumbUrl(id) {
  return "https://drive.google.com/thumbnail?id=" + id + "&sz=w800";
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
