const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");
const { initSocket } = require("./utils/socket");

// Friendly check so beginners see exactly what's missing
const missing = ["MONGO_URI", "JWT_SECRET"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`\n❌ Missing ${missing.join(", ")} in server/.env`);
  console.error("   Copy server/.env.example to server/.env and fill in the values (see the guide, Step 5).\n");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB(process.env.MONGO_URI);
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
  });
})();
