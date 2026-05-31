require('dotenv').config();

const express = require('express');
const admin = require('firebase-admin');
const path = require('path');

// Инициализация Firebase Admin SDK из переменных окружения
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 10000;  // ← ИСПРАВЛЕНО: порт 10000

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API endpoints ----------

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

// Записаться на встречу
app.post('/api/meetings/:id/signup', async (req, res) => {
  try {
    const { name } = req.body;
    const meetingRef = db.collection('meetings').doc(req.params.id);
    const doc = await meetingRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Встреча не найдена' });
    }
    
    const guests = doc.data().guests || [];
    if (!guests.includes(name)) {
      await meetingRef.update({ guests: [...guests, name] });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Отменить запись
app.post('/api/meetings/:id/cancel', async (req, res) => {
  try {
    const { name } = req.body;
    const meetingRef = db.collection('meetings').doc(req.params.id);
    const doc = await meetingRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Встреча не найдена' });
    }
    
    const guests = doc.data().guests || [];
    const newGuests = guests.filter(g => g !== name);
    await meetingRef.update({ guests: newGuests });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить встречу (требует секретный ключ)
app.post('/api/meetings', async (req, res) => {
  try {
    const { secret, meeting } = req.body;
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Неавторизовано' });
    }
    
    const newId = Date.now().toString();
    await db.collection('meetings').doc(newId).set({
      ...meeting,
      id: newId,
      guests: []
    });
    res.json({ success: true, id: newId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить встречу
app.put('/api/meetings/:id', async (req, res) => {
  try {
    const { secret, meeting } = req.body;
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Неавторизовано' });
    }
    
    await db.collection('meetings').doc(req.params.id).update(meeting);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить встречу
app.delete('/api/meetings/:id', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Неавторизовано' });
    }
    
    await db.collection('meetings').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Проверка уникальности имени пользователя
app.post('/api/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (username === 'admin') {
      return res.json({ available: true });
    }
    
    const snapshot = await db.collection('meetings').get();
    let existingUsers = new Set();
    
    snapshot.forEach(doc => {
      const guests = doc.data().guests || [];
      guests.forEach(guest => existingUsers.add(guest));
    });
    
    const isAvailable = !existingUsers.has(username);
    res.json({ available: isAvailable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Привязка устройств ----------
const deviceLinksCollection = db.collection('device_links');
const usersCollection = db.collection('users');

app.post('/api/register-device', async (req, res) => {
  try {
    const { fingerprint, username } = req.body;
    
    if (!fingerprint) {
      return res.status(400).json({ error: 'Нет идентификатора устройства' });
    }
    
    const deviceDoc = await deviceLinksCollection.doc(fingerprint).get();
    
    if (!deviceDoc.exists) {
      if (!username) {
        return res.status(400).json({ error: 'Для нового устройства нужно имя' });
      }
      
      const userDoc = await usersCollection.doc(username).get();
      
      if (!userDoc.exists) {
        await usersCollection.doc(username).set({
          username: username,
          devices: [fingerprint],
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        });
      } else {
        const devices = userDoc.data().devices || [];
        if (!devices.includes(fingerprint)) {
          await usersCollection.doc(username).update({
            devices: [...devices, fingerprint],
            lastActive: new Date().toISOString()
          });
        }
      }
      
      await deviceLinksCollection.doc(fingerprint).set({
        username: username,
        firstSeen: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      });
      
      return res.json({ success: true, username: username, isNew: true });
    } else {
      const linkedUsername = deviceDoc.data().username;
      
      if (!username) {
        return res.json({ success: true, username: linkedUsername, isNew: false });
      }
      
      if (username !== linkedUsername) {
        const targetUserDoc = await usersCollection.doc(username).get();
        
        if (targetUserDoc.exists) {
          return res.status(403).json({ 
            error: `Ник "${username}" уже используется. Если это вы, войдите сначала с того устройства, где вы регистрировались.` 
          });
        } else {
          return res.status(403).json({
            error: `Это устройство уже привязано к нику "${linkedUsername}". Хотите сменить ник? Обратитесь к администратору.`
          });
        }
      }
      
      await deviceLinksCollection.doc(fingerprint).update({
        lastUsed: new Date().toISOString()
      });
      
      await usersCollection.doc(username).update({
        lastActive: new Date().toISOString()
      });
      
      return res.json({ success: true, username: username, isNew: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user-devices/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userDoc = await usersCollection.doc(username).get();
    
    if (!userDoc.exists) {
      return res.json({ devices: [] });
    }
    
    res.json({ devices: userDoc.data().devices || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/remove-device', async (req, res) => {
  try {
    const { username, fingerprint, adminSecret } = req.body;
    
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Неавторизовано' });
    }
    
    const userDoc = await usersCollection.doc(username).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const devices = userDoc.data().devices || [];
    const newDevices = devices.filter(d => d !== fingerprint);
    await usersCollection.doc(username).update({ devices: newDevices });
    
    await deviceLinksCollection.doc(fingerprint).delete();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Инициализация тестовых данных
async function initDefaultMeetings() {
  const snapshot = await db.collection('meetings').get();
  if (snapshot.empty) {
    const defaultMeetings = [
      { id: 'm1', book: "Дом, в котором…", author: "Мариам Петросян", date: "2025-06-15", time: "18:30", location: "онлайн (Zoom)", guests: [] },
      { id: 'm2', book: "Сто лет одиночества", author: "Габриэль Маркес", date: "2025-06-29", time: "19:00", location: "библиотека Coffee&Books", guests: [] },
      { id: 'm3', book: "Преступление и наказание", author: "Ф. Достоевский", date: "2025-07-12", time: "18:00", location: "коворкинг «Слово»", guests: [] },
      { id: 'm4', book: "Мастер и Маргарита", author: "М. Булгаков", date: "2025-07-26", time: "17:30", location: "читальный зал", guests: [] }
    ];
    for (const meeting of defaultMeetings) {
      await db.collection('meetings').doc(meeting.id).set(meeting);
    }
    console.log('✅ Добавлены тестовые встречи');
  }
}

// Запуск сервера
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  await initDefaultMeetings();
  console.log('📁 База данных готова');
});