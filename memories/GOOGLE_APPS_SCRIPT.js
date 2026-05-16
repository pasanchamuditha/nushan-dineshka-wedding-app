// ─────────────────────────────────────────────────────────────────────────────
// NUSHAN & DINESHKA WEDDING MEMORIES — Google Apps Script Backend
// ─────────────────────────────────────────────────────────────────────────────
// SETUP STEPS:
//   1. Go to https://script.google.com  → New Project
//   2. Paste this entire file
//   3. Click Deploy → New Deployment (or Manage Deployments → create new version)
//   4. Type: Web App | Execute as: Me | Access: Anyone
//   5. Copy the Web App URL → paste as APPS_SCRIPT_URL in .env.local + Vercel env vars
//
// VIDEO FOLDER SETUP:
//   The video folder belongs to a different Google account.
//   Share it with the Apps Script owner's email (Editor access) so this script
//   can write files to it.
// ─────────────────────────────────────────────────────────────────────────────

const FOLDER_ID       = "1HRm8d6bwdQBLBlWOTlcAE2x6ySwuVM1V";  // photos
const VIDEO_FOLDER_ID = "1QqM1Q7P4gqyw1cuPUQhVKn49S87U5N7J";  // videos

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

// ── Upload a photo or video ───────────────────────────────────────────────────
function processUpload(data) {
  try {
    const mime    = data.mimeType || "image/jpeg";
    const isVideo = mime.startsWith("video/");
    const raw     = isVideo ? data.video : data.image;
    const base64  = raw.replace(/^data:[^;]+;base64,/, "");
    const ext     = mime.split("/")[1].replace("quicktime", "mov") || (isVideo ? "mp4" : "jpg");
    const prefix  = isVideo ? "Video_" : "Memory_";
    const name    = prefix + new Date().toISOString().replace(/[:.]/g, "-") + "." + ext;

    const folderId = isVideo ? VIDEO_FOLDER_ID : FOLDER_ID;
    const folder   = DriveApp.getFolderById(folderId);
    const blob     = Utilities.newBlob(Utilities.base64Decode(base64), mime, name);
    const file     = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return respond({
      success:      true,
      fileId:       file.getId(),
      fileName:     name,
      thumbnailUrl: thumbUrl(file.getId()),
      type:         isVideo ? "video" : "photo",
    });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ── Vote on a photo/video ─────────────────────────────────────────────────────
function processVote(data) {
  const photoId      = data.photoId;
  const reaction     = data.reaction    || null;
  const prevReaction = data.prevReaction || null;

  if (!photoId) return respond({ success: false, error: "Missing photoId" });

  const lock = LockService.getScriptLock();
  lock.tryLock(6000);

  try {
    const props  = PropertiesService.getScriptProperties();
    const key    = "v_" + photoId;
    const stored = props.getProperty(key);
    const def    = { h: 0, f: 0, w: 0, l: 0, c: 0 };
    const votes  = stored ? Object.assign(def, JSON.parse(stored)) : def;

    if (prevReaction && votes[prevReaction] !== undefined) {
      votes[prevReaction] = Math.max(0, votes[prevReaction] - 1);
    }
    if (reaction && reaction !== prevReaction) {
      votes[reaction] = (votes[reaction] || 0) + 1;
    }

    props.setProperty(key, JSON.stringify(votes));
    return respond({ success: true, votes });
  } finally {
    lock.releaseLock();
  }
}

// ── List all photos + videos (with vote counts) ───────────────────────────────
function doGet() {
  try {
    const props = PropertiesService.getScriptProperties();
    const media = [];

    // Photos
    const photoIter = DriveApp.getFolderById(FOLDER_ID).getFiles();
    while (photoIter.hasNext()) {
      const f = photoIter.next();
      if (!f.getMimeType().startsWith("image/")) continue;
      const id    = f.getId();
      const stored = props.getProperty("v_" + id);
      const votes  = Object.assign({ h: 0, f: 0, w: 0, l: 0, c: 0 }, stored ? JSON.parse(stored) : {});
      media.push({ id, name: f.getName(), thumbnailUrl: thumbUrl(id), createdAt: f.getDateCreated().toISOString(), votes, type: "photo" });
    }

    // Videos
    try {
      const videoIter = DriveApp.getFolderById(VIDEO_FOLDER_ID).getFiles();
      while (videoIter.hasNext()) {
        const f = videoIter.next();
        if (!f.getMimeType().startsWith("video/")) continue;
        const id     = f.getId();
        const stored = props.getProperty("v_" + id);
        const votes  = Object.assign({ h: 0, f: 0, w: 0, l: 0, c: 0 }, stored ? JSON.parse(stored) : {});
        media.push({ id, name: f.getName(), thumbnailUrl: thumbUrl(id), createdAt: f.getDateCreated().toISOString(), votes, type: "video" });
      }
    } catch (videoErr) {
      // Video folder may not be shared yet — skip gracefully
    }

    media.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return respond({ success: true, photos: media });
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
