const Notification = require("../models/Notification");
const { emit } = require("./socket");

// Saves a notification and pushes it live to the user's open browser tabs.
async function notify(userId, { type = "info", title, message = "", link = "" }) {
  const doc = await Notification.create({ user: userId, type, title, message, link });
  emit.toUser(userId, "notification", doc);
  return doc;
}

module.exports = notify;
