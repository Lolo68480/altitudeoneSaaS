import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { uid, imap_host, imap_port, imap_user, imap_pass, folder = 'INBOX' } = req.body || {};
  if (!uid || !imap_user || !imap_pass) return res.status(400).json({ error: 'Champs requis manquants' });

  const client = new ImapFlow({
    host: imap_host || 'imap.gmail.com',
    port: parseInt(imap_port) || 993,
    secure: true,
    auth: { user: imap_user, pass: imap_pass },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });

    let parsed = null;
    for await (const msg of client.fetch({ uid }, { source: true }, { uid: true })) {
      parsed = await simpleParser(msg.source);
    }

    lock.release();
    await client.logout();

    if (!parsed) return res.status(404).json({ error: 'Message introuvable' });

    res.status(200).json({
      subject: parsed.subject || '(sans objet)',
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      date: parsed.date?.toISOString() || null,
      html: parsed.html || null,
      text: parsed.text || '',
      attachments: (parsed.attachments || []).map(a => ({
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
      })),
    });
  } catch (e) {
    try { await client.logout(); } catch {}
    res.status(500).json({ error: e.message });
  }
}
