import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import nodemailer from "nodemailer";
import crypto from "node:crypto";

let oracledb = null;

try {
  const oracleModule = await import("oracledb");
  oracledb = oracleModule.default;
  oracledb.initOracleClient(); // Обов'язково повертаємо його на місце!
} catch (error) {
  console.log("Помилка завантаження oracledb:", error.message);
}

let transporter;
nodemailer.createTestAccount().then((testAccount) => {
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log("Тестова пошта готова!");
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT) || 3001;
const distPath = path.resolve(__dirname, "..", "dist");

const dbConfig = {
  user: "NDI",
  password: "NDI",
  connectString: "localhost:1521/XE"
};

app.use(cors());
app.use(express.json());

function getValue(row, keys, fallback = "") {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return fallback;
}

function mapCity(row) {
  return {
    id: String(getValue(row, ["ID", "CITY_ID", "KODCITY"], "")),
    name: String(getValue(row, ["NAME", "NAME_CITY"], ""))
  };
}

function mapType(row) {
  return {
    id: String(getValue(row, ["ID", "TYPEFIRM_ID"], "")),
    name: String(getValue(row, ["NAME", "NAME_TYPEFIRM"], ""))
  };
}

function mapResponse(row) {
  return {
    id: String(getValue(row, ["ID"], "")),
    zamId: String(getValue(row, ["ZAM_ID", "REQUEST_ID"], "")),
    firmId: String(getValue(row, ["FIRM_ID", "FIRMID"], "")),
    text: String(getValue(row, ["TEXT", "RESPONSE_TEXT"], "")),
    status: String(getValue(row, ["STATUS"], "pending")),
    fromType: String(getValue(row, ["FROM_TYPE"], "company")),
    createdAt: getValue(row, ["CREATED_AT"], ""),
    companyName: String(getValue(row, ["FIRMNAMEUKR", "NAME", "NAME_FIRM"], "Компанія"))
  };
}

function mapRequest(row, cities, types, responses = []) {
  const id = String(getValue(row, ["ID"], ""));
  const cityId = String(getValue(row, ["KODCITY"], ""));
  const typeId = String(getValue(row, ["TYPEFIRM"], ""));
  const city = cities.find((item) => item.id === cityId);
  const type = types.find((item) => item.id === typeId);
  const requestResponses = responses.filter((item) => item.zamId === id);

  return {
    id,
    nomzam: String(getValue(row, ["NOMZAM"], "")),
    title: String(getValue(row, ["NAMEZAM"], "")),
    description: String(getValue(row, ["OPYSZAM"], "")),
    price: getValue(row, ["PRICEZAM"], ""),
    date: getValue(row, ["DATA"], ""),
    cityId,
    cityName: city?.name || "Без міста",
    typeId,
    typeName: type?.name || "Без категорії",
    firmId: String(getValue(row, ["FIRM_ID"], "")),
    clientName: String(getValue(row, ["FAMZAM", "EMAIL"], "Клієнт")),
    responseCount: requestResponses.length
  };
}

async function createPool() {
  if (!oracledb) return;
  try {
    await oracledb.createPool(dbConfig);
    console.log("Oracle Connected");
  } catch (error) {
    console.log("Oracle Error:", error.message);
  }
}

app.post("/register", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();
  
  if (!email || !password) return res.status(400).json({ message: "Введіть email і пароль." });

  let connection;
  try {
    connection = await oracledb.getConnection();
    const exists = await connection.execute(`SELECT EMAIL FROM test.USERS WHERE EMAIL = :email`, { email });
    if (exists.rows.length) return res.status(400).json({ message: "Такий користувач уже є." });

    const verifyToken = crypto.randomBytes(20).toString('hex');
    const genId = Math.floor(Date.now() / 1000);

    await connection.execute(
      `INSERT INTO test.USERS (ID, EMAIL, PASSWORD, IS_VERIFIED, VERIFY_TOKEN) VALUES (:id, :email, :password, 0, :token)`,
      { id: genId, email, password, token: verifyToken },
      { autoCommit: true }
    );

    const verifyUrl = `http://localhost:3001/verify-email?token=${verifyToken}`;
    transporter.sendMail({
      from: '"Taskero" <noreply@taskero.com>',
      to: email,
      subject: "Підтвердження реєстрації",
      text: `Вітаємо! Перейдіть за посиланням, щоб підтвердити пошту: ${verifyUrl}`
    }).then(info => console.log("📧 Лист підтвердження: %s", nodemailer.getTestMessageUrl(info)));

    res.status(201).json({ success: true, message: "Зареєстровано! Перевірте пошту." });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});

app.get("/verify-email", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Токен відсутній.");

  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `UPDATE test.USERS SET IS_VERIFIED = 1, VERIFY_TOKEN = NULL WHERE VERIFY_TOKEN = :token`,
      { token }, { autoCommit: true }
    );
    if (result.rowsAffected === 0) return res.status(400).send("Недійсний або використаний токен.");
    res.send("<h1>Користувача успішно підтверджено!</h1><p>Тепер ви можете увійти на сайт.</p>");
  } catch (e) { res.status(500).send(e.message); }
  finally { if (connection) await connection.close(); }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT EMAIL, IS_VERIFIED FROM test.USERS WHERE EMAIL = :email AND PASSWORD = :password`,
      { email, password }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!result.rows.length) return res.status(401).json({ message: "Невірні дані." });
    if (result.rows[0].IS_VERIFIED === 0) return res.status(403).json({ message: "Підтвердіть пошту!" });

    res.json({ success: true, user: { email, role: "user" } });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});

app.post("/company/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT * FROM FIRM WHERE FIRM_MAIL = :email AND PASSWORD = :password`,
      { email, password }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!result.rows.length) return res.status(401).json({ message: "Невірні дані." });
    
    const row = result.rows[0];
    res.json({ 
      success: true, 
      user: { 
        email: row.FIRM_MAIL, 
        name: String(getValue(row, ["FIRMNAMEUKR", "FIRMNAMEENG"], email)), 
        role: "company", 
        firmId: String(row.FIRMID) 
      } 
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});


app.post("/forgot-password", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  let connection;
  try {
    connection = await oracledb.getConnection();
    const resetToken = crypto.randomBytes(20).toString('hex');
    let isCompany = false;

    let updateRes = await connection.execute(
      `UPDATE test.USERS SET RESET_TOKEN = :token WHERE EMAIL = :email`,
      { token: resetToken, email }, { autoCommit: true }
    );

    if (updateRes.rowsAffected === 0) {
      updateRes = await connection.execute(
        `UPDATE FIRM SET RESET_TOKEN = :token WHERE FIRM_MAIL = :email`,
        { token: resetToken, email }, { autoCommit: true }
      );
      if (updateRes.rowsAffected === 0) return res.status(404).json({ message: "Акаунт не знайдено." });
      isCompany = true;
    }

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    transporter.sendMail({
      from: '"Taskero" <noreply@taskero.com>',
      to: email,
      subject: "Скидання пароля",
      text: `Перейдіть сюди: ${resetUrl}`
    }).then(info => console.log("🔗 Лист скидання для %s: %s", isCompany ? "компанії" : "юзера", nodemailer.getTestMessageUrl(info)));

    res.json({ success: true, message: "Інструкції на пошті." });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: "Дані відсутні." });

  let connection;
  try {
    connection = await oracledb.getConnection();
    let updateRes = await connection.execute(
      `UPDATE test.USERS SET PASSWORD = :pwd, RESET_TOKEN = NULL WHERE RESET_TOKEN = :token`,
      { pwd: newPassword, token }, { autoCommit: true }
    );

    if (updateRes.rowsAffected === 0) {
      updateRes = await connection.execute(
        `UPDATE FIRM SET PASSWORD = :pwd, RESET_TOKEN = NULL WHERE RESET_TOKEN = :token`,
        { pwd: newPassword, token }, { autoCommit: true }
      );
      if (updateRes.rowsAffected === 0) return res.status(400).json({ message: "Токен недійсний." });
    }

    res.json({ success: true, message: "Пароль успішно змінено!" });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});


app.get("/requests", async (req, res) => {
  const firmId = String(req.query.firmId || "");
  const myResponses = String(req.query.myResponses || "");

  let connection;
  try {
    connection = await oracledb.getConnection();
    const reqs = await connection.execute(`SELECT * FROM test.BASE_MAIN ORDER BY DATA DESC`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const cities = await connection.execute(`SELECT * FROM CITY`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const types = await connection.execute(`SELECT * FROM TYPEFIRM`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    let responsesResult = { rows: [] };
    try {
      responsesResult = await connection.execute(
        `SELECT r.*, f.FIRMNAMEUKR FROM RESPONSES r LEFT JOIN FIRM f ON f.FIRMID = r.FIRM_ID ORDER BY r.ID DESC`,
        [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
    } catch (e) {}

    const mCities = cities.rows.map(mapCity);
    const mTypes = types.rows.map(mapType);
    const responses = responsesResult.rows.map(mapResponse);
    let requests = reqs.rows.map(row => mapRequest(row, mCities, mTypes, responses));

    if (firmId && myResponses === "1") {
      requests = requests.filter((r) => responses.some((resp) => resp.zamId === r.id && resp.firmId === firmId));
    }

    res.json({ requests, cities: mCities, types: mTypes });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});

app.post("/requests", async (req, res) => {
  const { title, description, price, cityId, typeId, email } = req.body;
  const commonId = Math.floor(Date.now() / 1000);
  const clientName = String(req.body.clientName || email || "").trim();

  let connection;
  try {
    connection = await oracledb.getConnection(); 
    await connection.execute(
      `INSERT INTO test.BASE_MAIN 
        (ID, NOMZAM, NAMEZAM, OPYSZAM, PRICEZAM, DATA, KODCITY, TYPEFIRM, FAMZAM)
       VALUES 
        (:v_id, :v_nom, :v_tit, :v_desc, :v_pri, :v_dat, :v_cit, :v_typ, :v_fam)`,
      {
        v_id: commonId, 
        v_nom: commonId, 
        v_tit: title || "Нова заявка",
        v_desc: description || "",
        v_pri: price || 0,
        v_dat: new Date(),
        v_cit: cityId || null,
        v_typ: typeId || null,
        v_fam: clientName || null
      },
      { autoCommit: true }
    );

    res.status(201).json({ 
      success: true, 
      request: { id: String(commonId), title, description, price, cityId, typeId, clientName } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.post("/responses", async (req, res) => {
  const { zamId, firmId, text } = req.body;
  if (!zamId || !firmId || !text) return res.status(400).json({ message: "Не вистачає даних." });

  let connection;
  try {
    connection = await oracledb.getConnection();
    const exists = await connection.execute(
      `SELECT ID FROM RESPONSES WHERE ZAM_ID = :zamId AND FIRM_ID = :firmId`,
      { zamId: Number(zamId), firmId: Number(firmId) }
    );
    if (exists.rows.length) return res.status(400).json({ message: "Ви вже відгукувались." });

    await connection.execute(
      `INSERT INTO RESPONSES (ID, ZAM_ID, FIRM_ID, TEXT, CREATED_AT, STATUS, FROM_TYPE)
       VALUES (:id, :zamId, :firmId, :text, :createdAt, 'pending', 'company')`,
      {
        id: Math.floor(Date.now() / 1000),
        zamId: Number(zamId),
        firmId: Number(firmId),
        text,
        createdAt: new Date()
      },
      { autoCommit: true }
    );
    res.status(201).json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});

app.get("/responses/:zamId", async (req, res) => {
  const zamId = String(req.params.zamId || "");
  const firmId = String(req.query.firmId || "");

  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT r.*, f.FIRMNAMEUKR 
         FROM RESPONSES r 
         LEFT JOIN FIRM f ON f.FIRMID = r.FIRM_ID 
        WHERE r.ZAM_ID = :zamId ORDER BY r.ID DESC`,
      { zamId: Number(zamId) }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    let responses = result.rows.map(mapResponse);
    if (firmId) responses = responses.filter((item) => item.firmId === firmId);

    res.json({ responses });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});

app.post("/responses/accept", async (req, res) => {
  const responseId = String(req.body.id || "");
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`SELECT * FROM RESPONSES WHERE ID = :id`, { id: Number(responseId) }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    if (!result.rows.length) return res.status(404).json({ message: "Відповідь не знайдена." });

    const row = result.rows[0];
    const zamId = Number(getValue(row, ["ZAM_ID"], 0));
    const firmId = Number(getValue(row, ["FIRM_ID"], 0));

    await connection.execute(`UPDATE RESPONSES SET STATUS = 'rejected' WHERE ZAM_ID = :zamId AND ID <> :id AND STATUS = 'pending'`, { zamId, id: Number(responseId) }, { autoCommit: false });
    await connection.execute(`UPDATE RESPONSES SET STATUS = 'accepted', FROM_TYPE = 'user' WHERE ID = :id`, { id: Number(responseId) }, { autoCommit: false });
    await connection.execute(`UPDATE test.BASE_MAIN SET FIRM_ID = :firmId WHERE ID = :zamId`, { firmId, zamId }, { autoCommit: true });

    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});

app.post("/responses/reject", async (req, res) => {
  const responseId = String(req.body.id || "");
  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(`UPDATE RESPONSES SET STATUS = 'rejected', FROM_TYPE = 'user' WHERE ID = :id`, { id: Number(responseId) }, { autoCommit: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
  finally { if (connection) await connection.close(); }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/requests") || req.path.startsWith("/responses") || req.path === "/health") return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, async () => {
  await createPool();
  console.log(`Server running on http://localhost:${port}`);
});