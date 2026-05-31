require('dotenv').config();

const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanup() {
  console.log('🧹 Начинаем очистку базы данных...\n');

  try {
    // 1. Очистка привязок устройств
    console.log('📱 Удаляем привязки устройств...');
    const deviceLinks = await db.collection('device_links').get();
    let deletedDevices = 0;
    for (const doc of deviceLinks.docs) {
      await doc.ref.delete();
      deletedDevices++;
    }
    console.log(`✅ Удалено ${deletedDevices} привязок устройств\n`);

    // 2. Очистка списков участников во всех встречах
    console.log('👥 Очищаем списки участников встреч...');
    const meetings = await db.collection('meetings').get();
    let clearedMeetings = 0;
    for (const doc of meetings.docs) {
      await doc.ref.update({ guests: [] });
      clearedMeetings++;
    }
    console.log(`✅ Очищены списки участников в ${clearedMeetings} встречах\n`);

    // 3. Показываем итоговую статистику
    console.log('📊 ИТОГО:');
    console.log(`   - Удалено привязок устройств: ${deletedDevices}`);
    console.log(`   - Очищено встреч: ${clearedMeetings}`);
    console.log('\n✨ База данных успешно очищена!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при очистке:', error);
    process.exit(1);
  }
}

cleanup();