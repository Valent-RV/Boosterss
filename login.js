const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const users = [];


//реєстрація 
app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ message: "Такий користувач уже існує!" });
    }
    users.push({ username: username, password: password });
    
    res.status(201).json({ message: "Реєстрація успішна!" });
    
    console.log("користувачі:", users);
});


//логін
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = users.find(user => user.username === username);

    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Неправильний логін або пароль!" });
    }

    res.status(200).json({ message: "Виконано вхід в систему!" });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер успішно запущено на порту http://localhost:${PORT}`);
});