// ─────────────────────────────────────────────────────────────────────────────
// NUSHAN & DINESHKA WEDDING MEMORIES — Google Apps Script Backend
// ─────────────────────────────────────────────────────────────────────────────
// SETUP STEPS:
//   1. Go to https://script.google.com  → New Project
//   2. Paste this entire file
//   3. Click Deploy → New Deployment (or Manage Deployments → create new version)
//   4. Type: Web App | Execute as: Me | Access: Anyone
//   5. Copy the Web App URL → paste as APPS_SCRIPT_URL in .env.local + Vercel env vars
// ─────────────────────────────────────────────────────────────────────────────

const FOLDER_ID = "1HRm8d6bwdQBLBlWOTlcAE2x6ySwuVM1V";

// ── Route POST requests ───────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "vote") return processVote(data);
    return processUpload(data);
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ── Upload a photo ────────────────────────────────────────────────────────────
function processUpload(data) {
  try {
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

// ── Vote on a photo ───────────────────────────────────────────────────────────
// data: { action:"vote", photoId, reaction, prevReaction? }
// reaction / prevReaction: "h" (❤️), "f" (🔥), "w" (😍), or null to remove
function processVote(data) {
  const photoId     = data.photoId;
  const reaction    = data.reaction    || null;  // new reaction (null = remove)
  const prevReaction = data.prevReaction || null; // previous reaction to undo

  if (!photoId) return respond({ success: false, error: "Missing photoId" });

  const lock = LockService.getScriptLock();
  lock.tryLock(6000);

  try {
    const props   = PropertiesService.getScriptProperties();
    const key     = "v_" + photoId;
    const stored  = props.getProperty(key);
    const votes   = stored ? JSON.parse(stored) : { h: 0, f: 0, w: 0 };

    // Undo previous reaction
    if (prevReaction && votes[prevReaction] !== undefined) {
      votes[prevReaction] = Math.max(0, votes[prevReaction] - 1);
    }
    // Apply new reaction (skip if toggling off same one)
    if (reaction && reaction !== prevReaction) {
      votes[reaction] = (votes[reaction] || 0) + 1;
    }

    props.setProperty(key, JSON.stringify(votes));
    return respond({ success: true, votes });
  } finally {
    lock.releaseLock();
  }
}

// ── List all photos (with vote counts) ───────────────────────────────────────
function doGet() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const props  = PropertiesService.getScriptProperties();
    const iter   = folder.getFiles();
    const photos = [];

    while (iter.hasNext()) {
      const f = iter.next();
      if (!f.getMimeType().startsWith("image/")) continue;
      const id       = f.getId();
      const stored   = props.getProperty("v_" + id);
      const votes    = stored ? JSON.parse(stored) : { h: 0, f: 0, w: 0 };
      photos.push({
        id,
        name:         f.getName(),
        thumbnailUrl: thumbUrl(id),
        createdAt:    f.getDateCreated().toISOString(),
        votes,
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
