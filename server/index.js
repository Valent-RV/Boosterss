import { existsSync, readFileSync, writeFileSync } from "node:fs";
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
} catch (error) {
  console.log("Oracle package not found, local mode enabled");
}

let transporter = nodemailer.createTransport({ jsonTransport: true });

nodemailer.createTestAccount().then((testAccount) => {
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log("Тестова пошта готова!");
}).catch(() => {
  console.log("Тестова пошта недоступна, листи пишуться у локальний transport");
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT) || 3001;
const distPath = path.resolve(__dirname, "..", "dist");
const localDbPath = path.resolve(__dirname, "local-db.json");

const dbConfig = {
  user: process.env.DB_USER || "NDI",
  password: process.env.DB_PASSWORD || "NDI",
  connectString: process.env.DB_CONNECT_STRING || "localhost:1521/XE"
};

const enforceEmailVerification = process.env.ENFORCE_EMAIL_VERIFICATION === "1";

const defaultCities = [
  { id: "1", name: "Київ" },
  { id: "2", name: "Львів" },
  { id: "3", name: "Одеса" }
];

const defaultTypes = [
  { id: "1", name: "Прибирання" },
  { id: "2", name: "Ремонт" },
  { id: "3", name: "Перевезення" }
];

let dbReady = false;
let useLocalData = process.env.USE_LOCAL_DATA === "1" || !oracledb;

app.use(cors());
app.use(express.json());

function getValue(row, keys, fallback = "") {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }

  return fallback;
}

function createLocalSeed() {
  return {
    users: [
      {
        email: "demo@taskero.local",
        password: "123456",
        name: "Демо Користувач",
        role: "user"
      },
      {
        email: "ivan@taskero.local",
        password: "123456",
        name: "Іван Тестовий",
        role: "user"
      }
    ],
    companies: [
      {
        email: "company@taskero.local",
        password: "123456",
        name: "Тест Компанія",
        role: "company",
        isVerified: true,
        firmId: "1",
        cityId: "1",
        typeId: "1"
      },
      {
        email: "repair@taskero.local",
        password: "123456",
        name: "Ремонт Плюс",
        role: "company",
        isVerified: true,
        firmId: "2",
        cityId: "2",
        typeId: "2"
      }
    ],
    cities: defaultCities,
    types: defaultTypes,
    requests: [
      {
        id: "1001",
        title: "Прибрати квартиру",
        description: "Потрібне генеральне прибирання двокімнатної квартири.",
        price: 2500,
        date: new Date().toISOString(),
        cityId: "1",
        cityName: "Київ",
        typeId: "1",
        typeName: "Прибирання",
        firmId: "",
        clientName: "Демо Користувач",
        responseCount: 0
      },
      {
        id: "1002",
        title: "Підклеїти шпалери",
        description: "Треба акуратно підклеїти шпалери в кімнаті.",
        price: 1800,
        date: new Date().toISOString(),
        cityId: "2",
        cityName: "Львів",
        typeId: "2",
        typeName: "Ремонт",
        firmId: "",
        clientName: "Іван Тестовий",
        responseCount: 0
      }
    ],
    responses: []
  };
}

function ensureLocalDb() {
  if (!existsSync(localDbPath)) {
    writeFileSync(localDbPath, JSON.stringify(createLocalSeed(), null, 2));
  }
}

function readLocalDb() {
  ensureLocalDb();

  try {
    const data = JSON.parse(readFileSync(localDbPath, "utf8"));

    if (!Array.isArray(data.cities) || !data.cities.length) {
      data.cities = defaultCities;
    }

    if (!Array.isArray(data.types) || !data.types.length) {
      data.types = defaultTypes;
    }

    if (!Array.isArray(data.requests)) {
      data.requests = [];
    }

    if (!Array.isArray(data.responses)) {
      data.responses = [];
    }

    return data;
  } catch {
    const seed = createLocalSeed();
    writeFileSync(localDbPath, JSON.stringify(seed, null, 2));
    return seed;
  }
}

function writeLocalDb(data) {
  writeFileSync(localDbPath, JSON.stringify(data, null, 2));
}

function mapCity(row) {
  return {
    id: String(getValue(row, ["ID_CITY", "CITY_ID", "ID"], "")),
    name: String(getValue(row, ["NAME_CITY", "CITY_NAME", "NAME"], ""))
  };
}

function mapType(row) {
  return {
    id: String(getValue(row, ["ID_TYPEFIRM", "TYPEFIRM_ID", "ID"], "")),
    name: String(getValue(row, ["NAME_TYPEFIRM", "TYPE_NAME", "NAME"], ""))
  };
}

function mapResponse(row) {
  return {
    id: String(getValue(row, ["ID"], "")),
    zamId: String(getValue(row, ["ZAM_ID", "REQUEST_ID"], "")),
    firmId: String(getValue(row, ["FIRM_ID", "ID_FIRM"], "")),
    text: String(getValue(row, ["TEXT", "RESPONSE_TEXT"], "")),
    status: String(getValue(row, ["STATUS"], "pending")),
    fromType: String(getValue(row, ["FROM_TYPE"], "company")),
    createdAt: getValue(row, ["CREATED_AT"], ""),
    companyName: String(getValue(row, ["NAME_FIRM", "COMPANY_NAME", "FIRM_NAME"], "Компанія"))
  };
}

function mapRequest(row, cities, types, responses) {
  const id = String(getValue(row, ["ID"], ""));
  const cityId = String(getValue(row, ["CITY_ID", "ID_CITY"], ""));
  const typeId = String(getValue(row, ["TYPEFIRM_ID", "ID_TYPEFIRM", "TYPE_ID"], ""));
  const city = cities.find((item) => item.id === cityId);
  const type = types.find((item) => item.id === typeId);
  const requestResponses = responses.filter((item) => item.zamId === id);

  return {
    id,
    title: String(getValue(row, ["NAMEZAM", "NAmeZAm", "NOMZAM"], "")),
    description: String(getValue(row, ["OPYSZAM", "DESCRIPTION"], "")),
    price: getValue(row, ["PRICEZAM", "PRICE"], ""),
    date: getValue(row, ["DATA", "REQUEST_DATE"], ""),
    cityId,
    cityName: city?.name || "Без міста",
    typeId,
    typeName: type?.name || "Без категорії",
    firmId: String(getValue(row, ["FIRM_ID", "ID_FIRM"], "")),
    clientName: String(getValue(row, ["CLIENT_NAME", "USERNAME", "USER_NAME"], "")),
    responseCount: requestResponses.length
  };
}

async function openConnection() {
  return oracledb.getConnection();
}

async function createPool() {
  if (!oracledb || useLocalData) {
    return;
  }

  try {
    await oracledb.createPool(dbConfig);
    dbReady = true;
    console.log("Oracle pool started");
  } catch (error) {
    console.log("Oracle unavailable, local mode enabled");
    console.log(error);
    useLocalData = true;
    dbReady = false;
  }
}

function getLocalRequests(data, firmId = "", myResponses = "") {
  let requests = [...data.requests];

  requests = requests.map((request) => {
    const responseCount = data.responses.filter((response) => response.zamId === request.id).length;
    return { ...request, responseCount };
  });

  if (firmId && myResponses === "1") {
    requests = requests.filter((request) =>
      data.responses.some((response) => response.zamId === request.id && response.firmId === firmId)
    );
  }

  return requests;
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    mode: useLocalData || !dbReady ? "local" : "oracle"
  });
});

app.post("/register", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  if (useLocalData || !dbReady) {
    const data = readLocalDb();
    const exists = data.users.find((item) => item.email === email);

    if (exists) return res.status(400).json({ message: "Такий користувач уже існує." });

    // токен
    const verifyToken = crypto.randomBytes(20).toString('hex');

    const user = {
      email,
      password,
      name: email,
      role: "user",
      isVerified: !enforceEmailVerification,
      verifyToken: verifyToken
    };

    data.users.push(user);
    writeLocalDb(data);

    if (enforceEmailVerification) {
      const verifyUrl = `http://localhost:3001/verify-email?token=${verifyToken}`;
      transporter.sendMail({
        from: '"Taskero" <noreply@taskero.com>',
        to: email,
        subject: "Підтвердження реєстрації",
        text: `Вітаємо! Перейдіть за посиланням, щоб підтвердити пошту: ${verifyUrl}`
      }).then(info => console.log(" Лист підтвердження: %s", nodemailer.getTestMessageUrl(info)));
    }

    return res.status(201).json({
      success: true,
      message: enforceEmailVerification ? "Зареєстровано! Перевірте пошту." : "Зареєстровано.",
      user: {
        email: user.email,
        name: user.name,
        role: "user"
      }
    });
  }
  
  
  let connection;

  try {
    connection = await openConnection();

    const existsResult = await connection.execute(
      `SELECT EMAIL FROM USERS WHERE EMAIL = :email`,
      { email }
    );

    if (existsResult.rows.length) {
      return res.status(400).json({ message: "Такий користувач уже є." });
    }

    await connection.execute(
      `INSERT INTO USERS (EMAIL, PASSWORD) VALUES (:email, :password)`,
      { email, password },
      { autoCommit: true }
    );

    return res.status(201).json({
      success: true,
      user: {
        email,
        name: email,
        role: "user"
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
  });

  app.get("/verify-email", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Токен відсутній.");

  const data = readLocalDb();
  const userIndex = data.users.findIndex(u => u.verifyToken === token);

  if (userIndex === -1) return res.status(400).send("Недійсний токен.");

  data.users[userIndex].isVerified = true;
  delete data.users[userIndex].verifyToken;
  writeLocalDb(data);

  res.send("<h1>Користувача успішно підтверджено!</h1><p>Тепер ви можете увійти на сайт.</p>");
});

app.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  if (useLocalData || !dbReady) {
    const data = readLocalDb();
    const user = data.users.find((item) => item.email === email && item.password === password);

    if (!user) {
      return res.status(401).json({ message: "Неправильний логін або пароль." });
    }
    
    if (enforceEmailVerification && user.isVerified === false) {
      return res.status(403).json({ message: "Будь ласка, підтвердіть свою пошту!" });
    }
    
    return res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: "user"
      }
    });
  }

  let connection;

  try {
    connection = await openConnection();

    const result = await connection.execute(
      `SELECT EMAIL FROM USERS WHERE EMAIL = :email AND PASSWORD = :password`,
      { email, password }
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Неправильний логін або пароль." });
    }

    return res.json({
      success: true,
      user: {
        email,
        name: email,
        role: "user"
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.post("/company/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  if (useLocalData || !dbReady) {
    const data = readLocalDb();
    const company = data.companies.find(
      (item) => item.email === email && item.password === password
    );

    if (!company) {
      return res.status(401).json({ message: "Неправильний логін або пароль компанії." });
    }

    if (company.isVerified === false) {
      return res.status(403).json({ message: "Компанія має підтвердити свою пошту!" });
    }

    return res.json({
      success: true,
      user: {
        email: company.email,
        name: company.name,
        role: "company",
        firmId: company.firmId
      }
    });
  }

  let connection;

  try {
    connection = await openConnection();

    const result = await connection.execute(
      `SELECT * FROM ND_FIRM WHERE EMAIL = :email AND PASSWORD = :password`,
      { email, password },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Неправильний логін або пароль." });
    }

    const row = result.rows[0];

    return res.json({
      success: true,
      user: {
        email,
        name: String(getValue(row, ["NAME_FIRM", "FIRM_NAME", "NAME"], email)),
        role: "company",
        firmId: String(getValue(row, ["FIRM_ID", "ID_FIRM", "ID"], "")),
        cityId: String(getValue(row, ["CITY_ID", "ID_CITY"], "")),
        typeId: String(getValue(row, ["TYPEFIRM_ID", "ID_TYPEFIRM", "TYPE_ID"], ""))
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.post("/forgot-password", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const data = readLocalDb();
  
  let account = data.users.find(u => u.email === email);
  let isCompany = false;

  if (!account) {
    account = data.companies.find(c => c.email === email);
    isCompany = true;
  }

  if (!account) {
    return res.status(404).json({ message: "Акаунт з таким email не знайдено." });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  account.resetToken = resetToken;
  writeLocalDb(data);

  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
  transporter.sendMail({
    from: '"Taskero" <noreply@taskero.com>',
    to: email,
    subject: "Скидання пароля",
    text: `Привіт! Ви (або ваша компанія) запросили зміну пароля. Перейдіть сюди: ${resetUrl}`
  }).then(info => console.log("🔗 Лист для %s: %s", isCompany ? "компанії" : "користувача", nodemailer.getTestMessageUrl(info)));

  res.json({ success: true, message: "Інструкції відправлено на пошту." });
});

app.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: "Дані відсутні." });

  const data = readLocalDb();
  
  let account = data.users.find(u => u.resetToken === token);
  if (!account) {
    account = data.companies.find(c => c.resetToken === token);
  }

  if (!account) {
    return res.status(400).json({ message: "Токен недійсний або застарілий." });
  }

  account.password = newPassword;
  delete account.resetToken;
  writeLocalDb(data);

  res.json({ success: true, message: "Пароль успішно змінено!" });
});

app.get("/requests", async (req, res) => {
  const firmId = String(req.query.firmId || "");
  const myResponses = String(req.query.myResponses || "");

  if (useLocalData || !dbReady) {
    const data = readLocalDb();
    return res.json({
      requests: getLocalRequests(data, firmId, myResponses),
      cities: data.cities.length ? data.cities : defaultCities,
      types: data.types.length ? data.types : defaultTypes
    });
  }

  let connection;

  try {
    connection = await openConnection();

    const requestsResult = await connection.execute(
      `SELECT * FROM BASE_MAIN ORDER BY ID DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const citiesResult = await connection.execute(
      `SELECT * FROM ND_CITY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const typesResult = await connection.execute(
      `SELECT * FROM TYPEFIRM`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const responsesResult = await connection.execute(
      `SELECT r.*, f.NAME_FIRM
         FROM RESPONSES r
         LEFT JOIN ND_FIRM f ON f.FIRM_ID = r.FIRM_ID
         ORDER BY r.ID DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const cities = citiesResult.rows.map(mapCity).filter((item) => item.id && item.name);
    const types = typesResult.rows.map(mapType).filter((item) => item.id && item.name);
    const cityOptions = cities.length ? cities : defaultCities;
    const typeOptions = types.length ? types : defaultTypes;
    const responses = responsesResult.rows.map(mapResponse);
    let requests = requestsResult.rows.map((row) => mapRequest(row, cityOptions, typeOptions, responses));

    if (firmId && myResponses === "1") {
      requests = requests.filter((request) =>
        responses.some((response) => response.zamId === request.id && response.firmId === firmId)
      );
    }

    return res.json({ requests, cities: cityOptions, types: typeOptions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.post("/requests", async (req, res) => {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const price = req.body.price ? Number(req.body.price) : null;
  const cityId = String(req.body.cityId || "");
  const typeId = String(req.body.typeId || "");
  const clientName = String(req.body.clientName || req.body.email || "").trim();
  const requestId = Date.now();
  const requestDate = new Date().toISOString();

  if (!title || !description || !cityId || !typeId) {
    return res.status(400).json({ message: "Заповніть назву, опис, місто і категорію." });
  }

  if (useLocalData || !dbReady) {
    const data = readLocalDb();
    const city = data.cities.find((item) => item.id === cityId);
    const type = data.types.find((item) => item.id === typeId);

    if (!city || !type) {
      return res.status(400).json({ message: "Оберіть коректне місто і категорію." });
    }

    const request = {
      id: String(requestId),
      title,
      description,
      price,
      date: requestDate,
      cityId,
      cityName: city.name,
      typeId,
      typeName: type.name,
      firmId: "",
      clientName,
      clientEmail: String(req.body.email || "").trim().toLowerCase()
    };

    data.requests.unshift(request);
    writeLocalDb(data);

    return res.status(201).json({
      success: true,
      request
    });
  }

  let connection;

  try {
    connection = await openConnection();

    await connection.execute(
      `INSERT INTO BASE_MAIN
        (ID, NOMZAM, NAMEZAM, OPYSZAM, PRICEZAM, DATA, CITY_ID, TYPEFIRM_ID, FIRM_ID, CLIENT_NAME)
       VALUES
        (:id, :title, :title, :description, :price, :requestDate, :cityId, :typeId, NULL, :clientName)`,
      {
        id: requestId,
        title,
        description,
        price,
        requestDate: new Date(requestDate),
        cityId: cityId || null,
        typeId: typeId || null,
        clientName: clientName || null
      },
      { autoCommit: true }
    );

    return res.status(201).json({
      success: true,
      request: {
        id: String(requestId),
        title,
        description,
        price,
        cityId,
        typeId,
        clientName
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.post("/responses", async (req, res) => {
  const zamId = String(req.body.zamId || req.body.requestId || "");
  const firmId = String(req.body.firmId || "");
  const text = String(req.body.text || "").trim();

  if (!zamId || !firmId || !text) {
    return res.status(400).json({ message: "Не вистачає даних для відповіді." });
  }

  if (useLocalData || !dbReady) {
    const data = readLocalDb();
    const exists = data.responses.find((item) => item.zamId === zamId && item.firmId === firmId);

    if (exists) {
      return res.status(400).json({ message: "Ви вже відгукувались на цю заявку." });
    }

    const company = data.companies.find((item) => item.firmId === firmId);

    data.responses.unshift({
      id: String(Date.now()),
      zamId,
      firmId,
      text,
      createdAt: new Date().toISOString(),
      status: "pending",
      fromType: "company",
      companyName: company?.name || "Компанія"
    });

    writeLocalDb(data);
    return res.status(201).json({ success: true });
  }

  let connection;

  try {
    connection = await openConnection();

    const existsResult = await connection.execute(
      `SELECT ID FROM RESPONSES WHERE ZAM_ID = :zamId AND FIRM_ID = :firmId`,
      {
        zamId: Number(zamId),
        firmId: Number(firmId)
      }
    );

    if (existsResult.rows.length) {
      return res.status(400).json({ message: "Ви вже відгукувались на цю заявку." });
    }

    await connection.execute(
      `INSERT INTO RESPONSES
        (ID, ZAM_ID, FIRM_ID, TEXT, CREATED_AT, STATUS, FROM_TYPE)
       VALUES
        (:id, :zamId, :firmId, :text, :createdAt, :status, :fromType)`,
      {
        id: Date.now(),
        zamId: Number(zamId),
        firmId: Number(firmId),
        text,
        createdAt: new Date(),
        status: "pending",
        fromType: "company"
      },
      { autoCommit: true }
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.get("/responses/:zamId", async (req, res) => {
  const zamId = String(req.params.zamId || "");
  const firmId = String(req.query.firmId || "");

  if (useLocalData || !dbReady) {
    const data = readLocalDb();
    let responses = data.responses.filter((item) => item.zamId === zamId);

    if (firmId) {
      responses = responses.filter((item) => item.firmId === firmId);
    }

    return res.json({ responses });
  }

  let connection;

  try {
    connection = await openConnection();

    const result = await connection.execute(
      `SELECT r.*, f.NAME_FIRM
         FROM RESPONSES r
         LEFT JOIN ND_FIRM f ON f.FIRM_ID = r.FIRM_ID
        WHERE r.ZAM_ID = :zamId
        ORDER BY r.ID DESC`,
      { zamId: Number(zamId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let responses = result.rows.map(mapResponse);

    if (firmId) {
      responses = responses.filter((item) => item.firmId === firmId);
    }

    return res.json({ responses });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.post("/responses/accept", async (req, res) => {
  const responseId = String(req.body.id || "");

  if (!responseId) {
    return res.status(400).json({ message: "Немає id відповіді." });
  }

  if (useLocalData || !dbReady) {
    const data = readLocalDb();
    const accepted = data.responses.find((item) => item.id === responseId);

    if (!accepted) {
      return res.status(404).json({ message: "Відповідь не знайдена." });
    }

    data.responses = data.responses.map((item) => {
      if (item.id === responseId) {
        return { ...item, status: "accepted", fromType: "user" };
      }

      if (item.zamId === accepted.zamId && item.status === "pending") {
        return { ...item, status: "rejected" };
      }

      return item;
    });

    data.requests = data.requests.map((request) =>
      request.id === accepted.zamId ? { ...request, firmId: accepted.firmId } : request
    );

    writeLocalDb(data);
    return res.json({ success: true });
  }

  let connection;

  try {
    connection = await openConnection();

    const result = await connection.execute(
      `SELECT * FROM RESPONSES WHERE ID = :id`,
      { id: Number(responseId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Відповідь не знайдена." });
    }

    const row = result.rows[0];
    const zamId = Number(getValue(row, ["ZAM_ID", "REQUEST_ID"], 0));
    const firmId = Number(getValue(row, ["FIRM_ID"], 0));

    await connection.execute(
      `UPDATE RESPONSES SET STATUS = 'rejected' WHERE ZAM_ID = :zamId AND ID <> :id AND STATUS = 'pending'`,
      {
        zamId,
        id: Number(responseId)
      },
      { autoCommit: false }
    );

    await connection.execute(
      `UPDATE RESPONSES SET STATUS = 'accepted', FROM_TYPE = 'user' WHERE ID = :id`,
      { id: Number(responseId) },
      { autoCommit: false }
    );

    await connection.execute(
      `UPDATE BASE_MAIN SET FIRM_ID = :firmId WHERE ID = :zamId`,
      {
        firmId,
        zamId
      },
      { autoCommit: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.post("/responses/reject", async (req, res) => {
  const responseId = String(req.body.id || "");

  if (!responseId) {
    return res.status(400).json({ message: "Немає id відповіді." });
  }

  if (useLocalData || !dbReady) {
    const data = readLocalDb();

    data.responses = data.responses.map((item) =>
      item.id === responseId ? { ...item, status: "rejected", fromType: "user" } : item
    );

    writeLocalDb(data);
    return res.json({ success: true });
  }

  let connection;

  try {
    connection = await openConnection();

    await connection.execute(
      `UPDATE RESPONSES SET STATUS = 'rejected', FROM_TYPE = 'user' WHERE ID = :id`,
      { id: Number(responseId) },
      { autoCommit: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Помилка сервера." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/requests") || req.path.startsWith("/responses") || req.path === "/health") {
      return next();
    }

    return res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, async () => {
  ensureLocalDb();
  await createPool();
  console.log(`Server running on http://localhost:${port}`);
});
