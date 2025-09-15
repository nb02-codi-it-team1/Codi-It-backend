import express from "express";

const app = express();

// 헬스체크 라우트
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;