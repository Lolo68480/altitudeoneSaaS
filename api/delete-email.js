import { ImapFlow } from 'imapflow';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { uid, imap_host, imap_port, imap_user, imap_pass, folder = 'INBOX', trash_folder } = req.body || {};
  if (!uid || !imap_user || !imap_pass) return res.status(400).json({ error: 'Champs manquants' });

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

    if (trash_folder && trash_folder !== folder) {
      await client.messageMove({ uid }, trash_folder, { uid: true });
    } else {
      await client.messageFlagsAdd({ uid }, ['\\Deleted'], { uid: true });
      await client.mailboxExpunge();
    }

    lock.release();
    await client.logout();
    res.status(200).json({ ok: true });
  } catch (e) {
    try { await client.logout(); } catch {}
    res.status(500).json({ error: e.message });
  }
}
