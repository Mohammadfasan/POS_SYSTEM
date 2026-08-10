import dotenv from "dotenv";
import app from "./src/app.js";
import prisma from "./src/config/prisma.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // Check PostgreSQL connection
    await prisma.$connect();
    console.log("✅ PostgreSQL database connected successfully");

    server = app.listen(PORT, () => {
      console.log(`🚀 SmartPOS server running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled Promise errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Rejection:", error);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle unexpected synchronous errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down server...`);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log("✅ Database disconnected");
      console.log("✅ Server stopped safely");
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));