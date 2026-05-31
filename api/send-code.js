// api/send-code.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Разрешаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    }

    const response = await fetch('https://api.resend.com/emails', {
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

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message });
    }
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ error: error.message });
  }
};