module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

    const name = String(body.name || '').trim();
    const contact = String(body.contact || '').trim();
    const message = String(body.message || body.situation || '').trim();
    const source = String(body.source || 'website').trim();
    const page = String(body.page || '').trim();

    if (!name || !contact || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          name: !!name,
          contact: !!contact,
          message: !!message
        }
      });
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramToken || !telegramChatId) {
      return res.status(500).json({
        error: 'Telegram env vars missing'
      });
    }

    const text = [
      'Новая заявка с сайта ВерноеСлово',
      '',
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      '',
      'Ситуация:',
      message,
      '',
      `Источник: ${source}`,
      `Страница: ${page || '—'}`
    ].join('\n');

    const tgResponse = await fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text
        })
      }
    );

    const tgData = await tgResponse.json().catch(() => null);

    if (!tgResponse.ok || !tgData?.ok) {
      return res.status(500).json({
        error: 'Telegram send failed',
        telegramError: tgData || `HTTP ${tgResponse.status}`
      });
    }

    return res.status(200).json({
      ok: true,
      telegramSent: true
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Server error'
    });
  }
};
