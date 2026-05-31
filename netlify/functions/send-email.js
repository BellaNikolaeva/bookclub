const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { email, code, name } = JSON.parse(event.body);
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Книжный клуб <noreply@send.mail.tulabook.ru>',
      to: [email],
      subject: 'Код подтверждения для книжного клуба',
      html: `<p>Привет, ${name}!</p><p>Твой код подтверждения: <strong>${code}</strong></p><p>Код действителен 5 минут.</p><p>Если ты не запрашивал код, просто проигнорируй это письмо.</p>`
    })
  });

  const data = await res.json();
  return {
    statusCode: res.ok ? 200 : 400,
    body: JSON.stringify(data)
  };
};