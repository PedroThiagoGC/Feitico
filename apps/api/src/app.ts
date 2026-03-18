import cors from "cors";
import express from "express";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "api", timestamp: new Date().toISOString() });
});

app.get("/api/ping", (_req, res) => {
  res.status(200).json({ message: "pong" });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "Feitico API",
    docs: ["GET /health", "GET /api/ping"],
  });
});

export default app;
