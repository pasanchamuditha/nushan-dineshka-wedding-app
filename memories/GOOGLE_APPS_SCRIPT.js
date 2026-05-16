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

const FOLDER_ID       = "1HRm8d6bwdQBLBlWOTlcAE2x6ySwuVM1V";  // photos
const VIDEO_FOLDER_ID = "1QqM1Q7P4gqyw1cuPUQhVKn49S87U5N7J";  // videos (anyone-with-link editor)

// ── Route POST requests ───────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "vote")    return processVote(data);
    if (data.isChunked)            return processChunkedUpload(data);
    return processUpload(data);
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ── Upload a photo (single request) ──────────────────────────────────────────
function processUpload(data) {
  try {
    const mime    = data.mimeType || "image/jpeg";
    const raw     = data.image;
    const base64  = raw.replace(/^data:[^;]+;base64,/, "");
    const ext     = mime.split("/")[1] || "jpg";
    const name    = "Memory_" + new Date().toISOString().replace(/[:.]/g, "-") + "." + ext;

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const blob   = Utilities.newBlob(Utilities.base64Decode(base64), mime, name);
    const file   = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return respond({
      success:      true,
      fileId:       file.getId(),
      fileName:     name,
      thumbnailUrl: thumbUrl(file.getId()),
      type:         "photo",
    });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ── Chunked video upload ──────────────────────────────────────────────────────
// Each chunk: { isChunked:true, uploadId, chunkIndex, totalChunks, chunk(base64), mimeType }
// Chunks are stored as temp Drive files and assembled on the last chunk.
function processChunkedUpload(data) {
  try {
    const { uploadId, chunkIndex, totalChunks, chunk, mimeType } = data;
    const folder    = DriveApp.getFolderById(VIDEO_FOLDER_ID);
    const chunkName = "__tmp_" + uploadId + "_" + String(chunkIndex).padStart(5, "0");

    // Save this chunk as a temp binary file
    const chunkBytes = Utilities.base64Decode(chunk);
    folder.createFile(Utilities.newBlob(chunkBytes, "application/octet-stream", chunkName));

    // Not the last chunk — just acknowledge
    if (chunkIndex < totalChunks - 1) {
      return respond({ success: true, status: "chunk_received", chunkIndex: chunkIndex });
    }

    // ── Last chunk: reassemble ────────────────────────────────────────────────
    var allBytes = [];
    for (var i = 0; i < totalChunks; i++) {
      var name = "__tmp_" + uploadId + "_" + String(i).padStart(5, "0");
      var iter = folder.getFilesByName(name);
      if (!iter.hasNext()) return respond({ success: false, error: "Missing chunk " + i });
      var f    = iter.next();
      var bytes = f.getBlob().getBytes();
      // byte-by-byte push avoids call-stack overflow for large spread operations
      for (var b = 0; b < bytes.length; b++) allBytes.push(bytes[b]);
      f.setTrashed(true);
    }

    var ext      = mimeType.split("/")[1].replace("quicktime", "mov") || "mp4";
    var fileName = "Video_" + new Date().toISOString().replace(/[:.]/g, "-") + "." + ext;
    var blob     = Utilities.newBlob(allBytes, mimeType, fileName);
    var file     = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return respond({
      success:      true,
      fileId:       file.getId(),
      fileName:     fileName,
      thumbnailUrl: thumbUrl(file.getId()),
      type:         "video",
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
      const id     = f.getId();
      const stored = props.getProperty("v_" + id);
      const votes  = Object.assign({ h: 0, f: 0, w: 0, l: 0, c: 0 }, stored ? JSON.parse(stored) : {});
      media.push({ id, name: f.getName(), thumbnailUrl: thumbUrl(id), createdAt: f.getDateCreated().toISOString(), votes, type: "photo" });
    }

    // Videos (skip temp chunks and handle missing-share gracefully)
    try {
      const videoIter = DriveApp.getFolderById(VIDEO_FOLDER_ID).getFiles();
      while (videoIter.hasNext()) {
        const f = videoIter.next();
        if (f.getName().startsWith("__tmp_")) continue;   // skip chunk temp files
        if (!f.getMimeType().startsWith("video/")) continue;
        const id     = f.getId();
        const stored = props.getProperty("v_" + id);
        const votes  = Object.assign({ h: 0, f: 0, w: 0, l: 0, c: 0 }, stored ? JSON.parse(stored) : {});
        media.push({ id, name: f.getName(), thumbnailUrl: thumbUrl(id), createdAt: f.getDateCreated().toISOString(), votes, type: "video" });
      }
    } catch (_) { /* video folder not accessible yet — skip */ }

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
