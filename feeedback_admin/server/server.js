const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "../public")));

const getDatabase = () => {
  const data = fs.readFileSync(path.join(__dirname, "database.json"));
  return JSON.parse(data);
};

app.get("/api/customers", (req, res) => {
  res.json(getDatabase().customers);
});

app.get("/api/feedback", (req, res) => {
  res.json(getDatabase().feedback);
});

app.get("/api/tickets", (req, res) => {
  res.json(getDatabase().supportTickets);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
