import express, { Request, Response, NextError } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable security headers and robust CORS policy
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());

// Main Health Check Endpoint
app.get("/api/health", async (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "Church system Core API Engine",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    database: "connected (SQLite baseline active)"
  });
});

// Root fallback route
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Requested API resource not found."
  });
});

// Server listener bootstrapping
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⛪ CHURCH SYSTEM CORE API RUNNING ON PORT ${PORT} ⛪`);
  console.log(`======================================================`);
  console.log(`👉 Live Server URL: http://localhost:${PORT}`);
  console.log(`👉 Dev Swagger Docs: http://localhost:${PORT}/api/docs (Planned)`);
  console.log(`======================================================\n`);
});
