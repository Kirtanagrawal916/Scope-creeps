import "dotenv/config";

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: (process.env.NODE_ENV || "development") === "development",

  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  // Optional for now — the DB module isn't implemented yet, so the app must
  // be able to start without it. connectDB() (config/db.js) handles the
  // missing/unreachable cases without crashing the server.
  mongoUri: process.env.MONGODB_URI || null,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },

  geminiApiKey: process.env.GEMINI_API_KEY,
};
