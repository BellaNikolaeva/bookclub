require('dotenv').config();

const express = require('express');
const admin = require('firebase-admin');
const path = require('path');

// Инициализация Firebase Admin SDK из переменных окружения
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// ВРЕМЕННО ОТКЛЮЧАЕМ FIREBASE ДЛЯ ДИАГНОСТИКИ СТАТИКИ
/*
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
*/

// ВРЕМЕННАЯ ЗАГЛУШКА
const db = null;
console.log("⚠️ Firebase ВРЕМЕННО отключен для диагностики статики");
console.log("Проверяем, работает ли раздача файлов из папки public...");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// ИСПРАВЛЕННЫЙ ПУТЬ К СТАТИКЕ (абсолютный)
app.use(express.static(path.join(__dirname, 'public')));

// ---------- ВРЕМЕННЫЕ ТЕСТОВЫЕ МАРШРУТЫ ----------
app.get('/test', (req, res) => {
  res.send('Сервер работает! 🚀');
});

app.get('/check-public', (req, res) => {
  const fs = require('fs');
  const publicPath = path.join(__dirname, 'public');
  fs.readdir(publicPath, (err, files) => {
    if (err) {
      res.send(`Ошибка: папка public не найдена. Путь: ${publicPath}`);
    } else {
      res.send(`Папка public найдена. Файлы: ${files.join(', ')}`);
    }
  });
});

// ВРЕМЕННЫЙ МАРШРУТ ДЛЯ ПРОВЕРКИ, ЧТО СЕРВЕР ВИДИТ index.html
app.get('/check-index', (req, res) => {
  const fs = require('fs');
  const indexPath = path.join(__dirname, 'public', 'index.html');
  fs.access(indexPath, fs.constants.F_OK, (err) => {
    if (err) {
      res.send(`❌ index.html НЕ найден по пути: ${indexPath}`);
    } else {
      res.send(`✅ index.html найден по пути: ${indexPath}`);
    }
  });
});

// ---------- API endpoints (временно закомментированы) ----------
/*
// Получить все встречи
app.get('/api/meetings', async (req, res) => {
  try {
    const snapshot = await db.collection('meetings').get();
    const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ... остальные API временно отключены
*/

// Заглушка для API, чтобы фронтенд не падал
app.get('/api/meetings', (req, res) => {
  res.json([]);
});

app.post('/api/meetings/:id/signup', (req, res) => {
  res.json({ success: true, message: "Диагностический режим" });
});

app.post('/api/meetings/:id/cancel', (req, res) => {
  res.json({ success: true, message: "Диагностический режим" });
});

app.post('/api/check-username', (req, res) => {
  res.json({ available: true });
});

app.post('/api/register-device', (req, res) => {
  res.json({ success: true, username: req.body.username, isNew: true });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📁 Папка public: ${path.join(__dirname, 'public')}`);
  console.log(`🔗 Откройте: http://localhost:${PORT}`);
});