// netlify/functions/send-code.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  // Только POST-запросы
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, code } = JSON.parse(event.body);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Книжный клуб <noreply@mail.tulabook.ru>',
      to: [email],
      subject: 'Код подтверждения',
      html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действителен 5 минут.</p>`
    })
  });

  const data = await res.json();
  
  return {
    statusCode: res.ok ? 200 : 400,
    body: JSON.stringify(data)
  };
};