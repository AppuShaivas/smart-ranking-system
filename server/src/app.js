const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// All API endpoints live under /api
app.use("/api", routes);
app.use("/api", notFound);

// In production, the server also serves the built React app (client/dist)
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use(errorHandler);
module.exports = app;
