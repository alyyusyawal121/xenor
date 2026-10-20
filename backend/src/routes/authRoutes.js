
const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");

const router = express.Router();

// Registrasi pelanggan
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Nama harus terdiri dari 2–100 karakter.",
      });
    }

    if (
      cleanEmail.length > 191 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password harus terdiri dari 8–72 karakter.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil.",
      data: user,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registrasi gagal karena kesalahan server.",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    // Pesan generik agar keberadaan akun tidak mudah ditebak.
    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    // Mencegah sesi lama digunakan kembali setelah login.
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return req.session.save((error) => {
      if (error) {
        console.error("Session save error:", error.message);

        return res.status(500).json({
          success: false,
          message: "Sesi login gagal disimpan.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Login berhasil.",
        data: req.session.user,
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login gagal karena kesalahan server.",
    });
  }
});

// Memeriksa pengguna yang sedang login
router.get("/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Kamu belum login.",
    });
  }

  return res.status(200).json({
    success: true,
    data: req.session.user,
  });
});

// Logout
router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.status(200).json({
      success: true,
      message: "Kamu sudah logout.",
    });
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Logout gagal.",
      });
    }

    res.clearCookie("nexora.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout berhasil.",
    });
  });
});

module.exports = router;
