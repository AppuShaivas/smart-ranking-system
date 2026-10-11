const mongoose = require("mongoose");

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log(`✅ MongoDB connected (database: ${mongoose.connection.name})`);
  } catch (err) {
    console.error("\n❌ Could not connect to MongoDB.");
    console.error("   Reason:", err.message);
    console.error("   Common fixes:");
    console.error("   1. Atlas → Network Access → add your IP address (or 0.0.0.0/0 while learning).");
    console.error("   2. Check the username/password in MONGO_URI (Atlas → Database Access).");
    console.error("   3. If your password has special characters like @ # % /, change it to letters+numbers.");
    console.error("   4. Make sure MONGO_URI in server/.env has no spaces or quotes.\n");
    process.exit(1);
  }
}

module.exports = connectDB;
