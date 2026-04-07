const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');

// ================= ORACLE THICK MODE =================
try {
    // Вказуємо шлях до папки bin твого локального Oracle
    oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
    console.log("✅ Oracle Thick mode увімкнено");
} catch (err) {
    console.error("❌ Помилка ініціалізації Thick mode:", err);
    process.exit(1);
}
const app = express();

app.use(cors());
app.use(express.json());

// ================= ORACLE DATABASE =================
const dbConfig = {
    user: "NDI",
    password: "NDI",
    connectString: "localhost:1521/XE"
};

async function initDb() {
    try {
        await oracledb.createPool(dbConfig);
        console.log("✅ Пул з'єднань Oracle створено успішно!");
    } catch (err) {
        console.error("❌ Помилка створення пулу:", err);
    }
}

// ================= USERS  =================

// Реєстрація 
app.post('/register', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Логін та пароль обов'язкові!" });
        }

        connection = await oracledb.getConnection();

        const checkSql = `SELECT EMAIL FROM "TEST"."USERS" WHERE EMAIL = :username`;
        const checkResult = await connection.execute(checkSql, [username]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: "Такий користувач уже існує!" });
        }

        const insertSql = `INSERT INTO "TEST"."USERS" (EMAIL, PASSWORD) VALUES (:username, :password)`;
        await connection.execute(insertSql, { username, password }, { autoCommit: true });

        res.status(201).json({ message: "Реєстрація успішна!" });
        console.log(`👤 Новий користувач зареєстрований: ${username}`);

    } catch (error) {
        console.error("Помилка реєстрації:", error);
        res.status(500).json({ message: "Внутрішня помилка сервера" });
    } finally {
        if (connection) await connection.close();
    }
});

// Логін
app.post('/login', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;
        connection = await oracledb.getConnection();

        // Шукаємо користувача з таким логіном та паролем
        const sql = `SELECT * FROM "TEST"."USERS" WHERE EMAIL = :username AND PASSWORD = :password`;
        const result = await connection.execute(sql, { username, password });

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Неправильний логін або пароль!" });
        }

        res.status(200).json({ message: "Виконано вхід в систему!" });
        console.log(`🔑 Користувач увійшов: ${username}`);

    } catch (error) {
        console.error("Помилка логіну:", error);
        res.status(500).json({ message: "Внутрішня помилка сервера" });
    } finally {
        if (connection) await connection.close();
    }
});

// ================= REQUESTS (ПОКИ ЩО В ПАМ'ЯТІ) =================

const requests = [
  {
    id: 1,
    title: "Ремонт авто",
    description: "Потрібно замінити гальмівні колодки та перевірити двигун.",
    date: "2026-03-30T14:00",
    price: "2000 ₴",
    responses: [
      { id: 1, company: "AutoFix", text: "Зробимо за 1800 грн сьогодні" },
      { id: 2, company: "GaragePro", text: "Можемо завтра зранку" }
    ]
  },
  {
    id: 2,
    title: "Прибирання квартири",
    description: "Генеральне прибирання 2-кімнатної квартири.",
    date: "2026-03-29T10:00",
    price: "800 ₴",
    responses: []
  },
  {
    id: 3,
    title: "Ремонт ноутбука",
    description: "Ноутбук не вмикається, можливо проблема з батареєю.",
    date: null,
    price: null,
    responses: [
      { id: 1, company: "TechService", text: "Діагностика безкоштовна" }
    ]
  }
];

// створення заявки
app.post('/create-request', (req, res) => {
  const { title, description, date, price } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Назва і опис обов'язкові" });
  }

  const newRequest = {
    id: Date.now(),
    title,
    description,
    date: date || null,
    price: price || null,
    responses: []
  };

  requests.push(newRequest);
  res.status(201).json({ message: "Заявка створена", request: newRequest });
});

// отримати всі заявки
app.get('/requests', (req, res) => {
  res.json([...requests].sort((a, b) => b.id - a.id));
});

// отримати одну заявку
app.get('/request/:id', (req, res) => {
  const request = requests.find(r => r.id == req.params.id);

  if (!request) {
    return res.status(404).json({ message: "Не знайдено" });
  }

  res.json(request);
});

// додати response
app.post('/request/:id/respond', (req, res) => {
  const { id } = req.params;
  const { company, text } = req.body;

  const request = requests.find(r => r.id == id);

  if (!request) {
    return res.status(404).json({ message: "Заявка не знайдена" });
  }

  const newResponse = {
    id: Date.now(),
    company,
    text
  };

  request.responses.push(newResponse);
  res.status(201).json({ message: "Відгук додано", response: newResponse });
});

// ================= SERVER =================

const PORT = 3000;
app.listen(PORT, async () => {
    await initDb(); // Запускаємо підключення до бази перед стартом
    console.log(`🚀 Сервер успішно запущено на порту http://localhost:${PORT}`);
});