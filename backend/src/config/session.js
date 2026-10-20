
const session = require("express-session");

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET wajib diatur di production.");
}

const sessionMiddleware = session({
  name: "nexora.sid",
  secret: process.env.SESSION_SECRET || "dev-only-secret-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  },
});

module.exports = sessionMiddleware;
