// netlify/functions/send-code.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 1. Разрешаем только POST-запросы
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. Получаем email и код из тела запроса
  const { email, code } = JSON.parse(event.body);

  // 3. Ваш API-ключ из переменных окружения Netlify
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  // 4. Отправляем запрос в Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Книжный клуб <noreply@mail.tulabook.ru>', // Проверьте этот email!
      to: [email],
      subject: 'Код подтверждения',
      html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действителен 5 минут.</p>`
    })
  });

  const data = await res.json();
  
  // 5. Возвращаем ответ клиенту
  return {
    statusCode: res.ok ? 200 : 400,
    body: JSON.stringify(data)
  };
};