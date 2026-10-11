const mongoose = require("mongoose");
const crypto = require("crypto");
const { Readable } = require("stream");

// Certificates are stored inside MongoDB using GridFS (bucket "certificates").
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "certificates" });

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

function saveFile(buffer, filename, contentType, metadata = {}) {
  return new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(filename, { metadata: { contentType, ...metadata } });
    Readable.from(buffer).pipe(stream).on("error", reject).on("finish", () => resolve(stream.id));
  });
}

async function streamFile(id, res) {
  const _id = new mongoose.Types.ObjectId(id);
  const [file] = await bucket().find({ _id }).toArray();
  if (!file) return res.status(404).json({ message: "File not found" });
  res.set("Content-Type", file.metadata?.contentType || "application/octet-stream");
  res.set("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
  res.set("Cache-Control", "private, max-age=86400");
  bucket().openDownloadStream(_id).pipe(res);
}

async function deleteFileByUrl(url) {
  const id = (url || "").split("/api/files/")[1];
  if (!id || !mongoose.isValidObjectId(id)) return;
  try {
    await bucket().delete(new mongoose.Types.ObjectId(id));
  } catch {
    /* already gone */
  }
}

module.exports = { saveFile, streamFile, deleteFileByUrl, sha256 };
