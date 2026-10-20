const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const { generate, previewDocument } = require("./lib/generate");

const root = __dirname;
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads");
const sitePath = path.join(dataDir, "site.json");
const authPath = path.join(dataDir, "auth.json");
const PORT = 3780;
const sessions = new Map();
const sessionPath = path.join(dataDir, "sessions.json");

function loadSessions() {
  if (!fs.existsSync(sessionPath)) return;
  try {
    const saved = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    Object.keys(saved).forEach((token) => {
      const session = saved[token];
      if (session && session.expires > Date.now()) sessions.set(token, session);
    });
  } catch (error) {
    sessions.clear();
  }
}

function saveSessions() {
  const saved = {};
  sessions.forEach((session, token) => {
    if (session.expires > Date.now()) saved[token] = session;
  });
  fs.writeFileSync(sessionPath, JSON.stringify(saved));
}

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

function ensureAuth() {
  if (fs.existsSync(authPath)) return;
  const salt = crypto.randomBytes(16).toString("hex");
  fs.writeFileSync(authPath, JSON.stringify({
    salt,
    passwordHash: hashPassword("admin123", salt)
  }, null, 2));
}

function ensureSite() {
  if (fs.existsSync(sitePath)) return;
  const seed = require("./lib/seed-data");
  fs.writeFileSync(sitePath, JSON.stringify(seed, null, 2));
}

function readSite() {
  return JSON.parse(fs.readFileSync(sitePath, "utf8"));
}

function writeSite(site) {
  fs.copyFileSync(sitePath, sitePath + ".bak");
  fs.writeFileSync(sitePath, JSON.stringify(site, null, 2));
  generate(site, root);
}

function tokenFrom(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)tgea=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function requireAuth(req, res, next) {
  const token = tokenFrom(req);
  const session = sessions.get(token);
  if (!session || session.expires < Date.now()) {
    sessions.delete(token);
    res.status(401).json({ ok: false, error: "請先登入" });
    return;
  }
  next();
}

function validateSite(site) {
  if (!site || !Array.isArray(site.pages) || !site.settings) return "資料格式不正確";
  const slugs = new Set();
  for (const page of site.pages) {
    if (!/^[a-z0-9-]+$/.test(page.slug || "")) return "網址只能使用英文小寫、數字與減號";
    if (slugs.has(page.slug)) return "有兩個分頁使用同一個網址";
    slugs.add(page.slug);
  }
  if (!site.pages.some((page) => page.slug === "index")) return "必須保留網址為 index 的首頁";
  return "";
}

ensureAuth();
ensureSite();
loadSessions();
generate(readSite(), root);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safe = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext) ? ext : "";
      if (!safe) {
        cb(new Error("只接受圖片檔"));
        return;
      }
      cb(null, Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex") + safe);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024 }
});

const app = express();
app.use(express.json({ limit: "8mb" }));

app.post("/api/login", (req, res) => {
  const auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
  const password = String((req.body && req.body.password) || "");
  const hash = hashPassword(password, auth.salt);
  if (hash !== auth.passwordHash) {
    res.status(401).json({ ok: false, error: "密碼不正確" });
    return;
  }
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { expires: Date.now() + 1000 * 60 * 60 * 12 });
  saveSessions();
  res.setHeader("Set-Cookie", "tgea=" + token + "; HttpOnly; Path=/; SameSite=Lax");
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  sessions.delete(tokenFrom(req));
  saveSessions();
  res.setHeader("Set-Cookie", "tgea=; HttpOnly; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  const session = sessions.get(tokenFrom(req));
  res.json({ ok: !!(session && session.expires > Date.now()) });
});

app.get("/api/site", requireAuth, (req, res) => {
  res.json(readSite());
});

app.put("/api/site", requireAuth, (req, res) => {
  const error = validateSite(req.body);
  if (error) {
    res.status(400).json({ ok: false, error });
    return;
  }
  try {
    writeSite(req.body);
  } catch (err) {
    res.status(500).json({ ok: false, error: "儲存失敗" });
    return;
  }
  res.json({ ok: true });
});

app.post("/api/password", requireAuth, (req, res) => {
  const next = String((req.body && req.body.password) || "");
  if (next.length < 4) {
    res.status(400).json({ ok: false, error: "密碼至少 4 個字" });
    return;
  }
  const salt = crypto.randomBytes(16).toString("hex");
  fs.writeFileSync(authPath, JSON.stringify({ salt, passwordHash: hashPassword(next, salt) }, null, 2));
  res.json({ ok: true });
});

app.post("/api/preview", requireAuth, (req, res) => {
  const site = req.body && req.body.site;
  const page = site && Array.isArray(site.pages) ? site.pages.find((item) => item.id === req.body.pageId) : null;
  if (!page) {
    res.status(400).json({ ok: false, error: "找不到分頁" });
    return;
  }
  res.json({ ok: true, html: previewDocument(site, page, req.body && req.body.device) });
});

app.post("/api/upload", requireAuth, (req, res) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      res.status(400).json({ ok: false, error: error.message || "上傳失敗" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ ok: false, error: "沒有收到檔案" });
      return;
    }
    res.json({ ok: true, url: "uploads/" + req.file.filename });
  });
});

app.use("/css", express.static(path.join(root, "css")));
app.use("/js", express.static(path.join(root, "js")));
app.use("/images", express.static(path.join(root, "images")));
app.use("/uploads", express.static(uploadDir));
app.use("/admin", express.static(path.join(root, "admin")));
app.get(["/admin", "/admin/"], (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(root, "admin", "index.html"));
});
app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(root, "index.html"));
});
app.get("/:file", (req, res, next) => {
  if (!/^[a-z0-9-]+\.html$/i.test(req.params.file)) return next();
  const file = path.join(root, req.params.file);
  if (!file.startsWith(root) || !fs.existsSync(file)) return next();
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(file);
});

app.listen(PORT, "127.0.0.1", () => {
  console.log("網站 http://127.0.0.1:" + PORT + "/");
  console.log("後台 http://127.0.0.1:" + PORT + "/admin/");
});
