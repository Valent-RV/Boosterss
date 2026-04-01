const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb'); 

try {
    oracledb.initOracleClient();
} catch (err) {
    console.error("Помилка активації Thick mode:", err);
}

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    user: "NDI",
    password: "NDI",
    connectString: "localhost:1521/XE"
};

const users = []; 

// реєстрація 
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ message: "Такий користувач уже існує!" });
    }

    users.push({ username, password });
    res.status(201).json({ message: "Реєстрація успішна!" });

    console.log("користувачі:", users);
});

// логін
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);

    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Неправильний логін або пароль!" });
    }

    res.status(200).json({ message: "Виконано вхід в систему!" });
});

// ================= REQUESTS =================

// створення заявки в БД
app.post('/create-request', async (req, res) => {
  const { title, description, date, price } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Назва і опис обов'язкові" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Генеруємо унікальний ID
    const zamId = Math.floor(Date.now() / 1000); 
    const numericPrice = price ? parseFloat(price.toString().replace(/\D/g, '')) : null;
    const jsDate = date ? new Date(date) : new Date();

    await connection.execute(
      `INSERT INTO test.Work (ID, NomZam, DATEMOD, NEW) VALUES (:1, :2, :3, 1)`,
      [zamId, zamId, jsDate]
    );

    await connection.execute(
      `INSERT INTO test.BASE_MAiN (ID, NOMZAM, NAmeZAm, OpysZAM, PriceZAM, DATA) 
       VALUES (:1, :2, :3, :4, :5, :6)`,
      [zamId, zamId, title, description, numericPrice, jsDate],
      { autoCommit: true }
    );

    res.status(201).json({ message: "Заявка створена", id: zamId });
  } catch (err) {
    console.error("Помилка створення заявки:", err);
    res.status(500).json({ message: "Помилка бази даних" });
  } finally {
    if (connection) await connection.close();
  }
});

// отримати всі заявки з БД
app.get('/requests', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID as "id", NAmeZAm as "title", OpysZAM as "description", 
              PriceZAM as "price", DATA as "date" 
       FROM test.BASE_MAiN ORDER BY ID DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT } 
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Помилка отримання заявок:", err);
    res.status(500).json({ message: "Помилка бази даних" });
  } finally {
    if (connection) await connection.close();
  }
});

// отримати одну заявку з БД
app.get('/request/:id', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const reqResult = await connection.execute(
      `SELECT ID as "id", NAmeZAm as "title", OpysZAM as "description", 
              PriceZAM as "price", DATA as "date" 
       FROM test.BASE_MAiN WHERE ID = :1`,
      [req.params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (reqResult.rows.length === 0) {
      return res.status(404).json({ message: "Не знайдено" });
    }
    
    const requestData = reqResult.rows[0];
    requestData.responses = []; 
    
    res.json(requestData);
  } catch (err) {
    console.error("Помилка отримання заявки:", err);
    res.status(500).json({ message: "Помилка бази даних" });
  } finally {
    if (connection) await connection.close();
  }
});

// додати response (тимчасова заглушка, щоб сайт не видавав помилку)
app.post('/request/:id/respond', (req, res) => {
  res.status(201).json({ message: "Відгук додано", response: {} });
});

// ================= SERVER =================

const PORT = 3000;

app.listen(PORT, async () => {
    console.log(`Сервер успішно запущено на порту http://localhost:${PORT}`);
    
    try {
        const connection = await oracledb.getConnection(dbConfig);
        console.log("БД підключена успішно!");
        await connection.close();
    } catch (err) {
        console.error("Помилка підключення до бази:", err.message);
    }
});