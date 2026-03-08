module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name = '',
      contact = '',
      situation = '',
      source = 'website',
      page = ''
    } = req.body || {};

    if (!name || !contact || !situation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    let telegramOk = false;
    let telegramError = null;

    if (telegramToken && telegramChatId) {
      const text = [
        'Новая заявка с сайта ВерноеСлово',
        '',
        `Имя: ${name}`,
        `Контакт: ${contact}`,
        `Ситуация: ${situation}`,
        `Источник: ${source}`,
        `Страница: ${page}`
      ].join('\n');

      const tgResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text
        })
      });

      if (tgResponse.ok) {
        telegramOk = true;
      } else {
        telegramError = await tgResponse.text();
      }
    } else {
      telegramError = 'Telegram env vars missing';
    }

    if (telegramOk) {
      return res.status(200).json({
        ok: true,
        telegramSent: true
      });
    }

    return res.status(500).json({
      ok: false,
      error: 'No delivery channel succeeded',
      telegramError
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Server error'
    });
  }
};
