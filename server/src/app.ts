import express from "express";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Collaborative Study Room API is running",
    "version": "0.1.0"
  });
});

export default app;