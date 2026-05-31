// netlify/functions/send-code.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Разрешаем только POST-запросы
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Парсим тело запроса
    const { email, code } = JSON.parse(event.body);
    
    // Валидация
    if (!email || typeof email !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required and must be a string' })
      };
    }
    
    if (!code || typeof code !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Code is required and must be a string' })
      };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'RESEND_API_KEY not configured' })
      };
    }

    // Отправляем запрос в Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Книжный клуб <noreply@mail.tulabook.ru>',
        to: email,
        subject: 'Код подтверждения',
        html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действителен 5 минут.</p>`
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error('Resend error:', data);
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data.message || 'Failed to send email' })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: data.id })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};