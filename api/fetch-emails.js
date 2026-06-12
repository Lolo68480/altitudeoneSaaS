import { ImapFlow } from 'imapflow';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imap_host, imap_port, imap_user, imap_pass, folder = 'INBOX', limit = 30 } = req.body || {};
  if (!imap_user || !imap_pass) return res.status(400).json({ error: 'Champs requis manquants' });

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
    const total = client.mailbox.exists;
    const emails = [];

    if (total > 0) {
      const start = Math.max(1, total - parseInt(limit) + 1);
      for await (const msg of client.fetch(`${start}:*`, { envelope: true, flags: true })) {
        emails.unshift({
          uid: msg.uid,
          seq: msg.seq,
          subject: msg.envelope.subject || '(sans objet)',
          from: {
            name: msg.envelope.from?.[0]?.name || '',
            address: msg.envelope.from?.[0]?.address || '',
          },
          date: msg.envelope.date?.toISOString() || new Date().toISOString(),
          seen: msg.flags.has('\\Seen'),
        });
      }
    }

    lock.release();
    await client.logout();
    res.status(200).json({ emails, total });
  } catch (e) {
    try { await client.logout(); } catch {}
    res.status(500).json({ error: e.message });
  }
}
