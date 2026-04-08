const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');

try {
    oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
} catch (err) {
    console.error("Thick mode init error:", err);
}

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());


const dbConfig = {
    user: "NDI",
    password: "NDI",
    connectString: "localhost:1521/XE"
};

async function initDb() {
    try {
        await oracledb.createPool(dbConfig);
        console.log("Пул з'єднань Oracle створено");
    } catch (err) {
        console.error("Помилка створення пулу:", err);
    }
}

// ================= USERS =================

app.post('/register', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: "Логін та пароль обов'язкові!" });

        connection = await oracledb.getConnection();
        
        const checkSql = `SELECT EMAIL FROM "TEST"."USERS" WHERE EMAIL = :username`;
        const checkResult = await connection.execute(checkSql, [username]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: "Такий користувач уже існує!" });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertSql = `INSERT INTO "TEST"."USERS" (EMAIL, PASSWORD) VALUES (:username, :password)`;
        await connection.execute(insertSql, { username, password: hashedPassword }, { autoCommit: true });

        res.status(201).json({ message: "Реєстрація успішна!" });
    } catch (error) {
        console.error("Помилка реєстрації:", error);
        res.status(500).json({ message: "Внутрішня помилка сервера" });
    } finally {
        if (connection) await connection.close();
    }
});

app.post('/login', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;
        connection = await oracledb.getConnection();

        const sql = `SELECT * FROM "TEST"."USERS" WHERE EMAIL = :username`;
        const result = await connection.execute(sql, { username }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Неправильний логін або пароль!" });
        }

        const user = result.rows[0];

        const match = await bcrypt.compare(password, user.PASSWORD);

        if (!match) {
            return res.status(401).json({ message: "Неправильний логін або пароль!" });
        }

        res.status(200).json({ message: "Виконано вхід в систему!" });
    } catch (error) {
        console.error("Помилка логіну:", error);
        res.status(500).json({ message: "Внутрішня помилка сервера" });
    } finally {
        if (connection) await connection.close();
    }
});

// ================= REQUESTS =================

app.post('/create-request', async (req, res) => {
    const { title, description, date, price } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: "Назва і опис обов'язкові" });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        
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
        res.status(500).json({ message: "Помилка бази даних при створенні заявки" });
    } finally {
        if (connection) await connection.close();
    }
});

app.get('/requests', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
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


// ================= RESPONSES =================

const companyResponses = []; 

app.get('/request/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
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
        
        requestData.responses = companyResponses.filter(r => r.requestId == req.params.id);
        
        res.json(requestData);
    } catch (err) {
        console.error("Помилка отримання заявки:", err);
        res.status(500).json({ message: "Помилка бази даних" });
    } finally {
        if (connection) await connection.close();
    }
});

app.post('/request/:id/respond', (req, res) => {
    const { id } = req.params;
    const { company, text } = req.body;

    const newResponse = {
        id: Date.now(),
        requestId: parseInt(id),
        company,
        text
    };

    companyResponses.push(newResponse);
    res.status(201).json({ message: "Відгук додано", response: newResponse });
});

// ================= SERVER START =================

const PORT = 3000;
app.listen(PORT, async () => {
    await initDb(); 
    console.log(`Сервер успішно запущено на порту http://localhost:${PORT}`);
});