console.log("===== ДИАГНОСТИКА ПРИ ЗАПУСКЕ =====");
console.log("Node.js version:", process.version);
console.log("PORT из окружения:", process.env.PORT);
console.log("");

console.log("--- Переменные окружения ---");
console.log("TEST_VAR:", process.env.TEST_VAR || "❌ не задана");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✅ задан" : "❌ не задан");
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ задан" : "❌ не задан");
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "✅ задан (первые 50 символов: " + process.env.FIREBASE_PRIVATE_KEY.substring(0, 50) + "...)" : "❌ не задан");
console.log("ADMIN_SECRET:", process.env.ADMIN_SECRET ? "✅ задан" : "❌ не задан");
console.log("");

console.log("--- Все переменные (первые 10) ---");
let count = 0;
for (const key in process.env) {
  if (count < 10) {
    console.log(`  ${key}=${process.env[key].substring(0, 30)}...`);
    count++;
  }
}
console.log("================================\n");

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

console.log("=== ИНИЦИАЛИЗАЦИЯ FIREBASE ===");
console.log("serviceAccount.projectId:", serviceAccount.projectId || "❌");
console.log("serviceAccount.clientEmail:", serviceAccount.clientEmail || "❌");
console.log("serviceAccount.privateKey:", serviceAccount.privateKey ? "✅ есть (" + serviceAccount.privateKey.length + " символов)" : "❌");
console.log("==============================\n");

// ВРЕМЕННО ОТКЛЮЧАЕМ FIREBASE ДЛЯ ДИАГНОСТИКИ СТАТИКИ
// Раскомментируйте эти строки, когда захотите включить Firebase
/*
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
*/

// ВРЕМЕННАЯ ЗАГЛУШКА
const db = null;
console.log("⚠️ Firebase ВРЕМЕННО отключен для диагностики статики");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log(`📁 Папка public: ${path.join(__dirname, 'public')}`);
console.log(`🚀 Запуск сервера на порту ${PORT}...`);

// ---------- ТЕСТОВЫЕ МАРШРУТЫ ----------
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

// ---------- API заглушки (чтобы фронтенд не падал) ----------
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

// ---------- Запуск сервера ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер УСПЕШНО запущен на порту ${PORT}`);
  console.log(`🔗 Откройте: https://bookclub-79w3.onrender.com`);
  console.log(`🔗 Тестовый маршрут: https://bookclub-79w3.onrender.com/test`);
});