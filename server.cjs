const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const users = [];

// ================= USERS =================

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
app.listen(PORT, () => {
    console.log(`Сервер успішно запущено на порту http://localhost:${PORT}`);
});
