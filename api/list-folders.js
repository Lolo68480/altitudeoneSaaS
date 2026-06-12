import { ImapFlow } from 'imapflow';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imap_host, imap_port, imap_user, imap_pass } = req.body || {};
  if (!imap_user || !imap_pass) return res.status(400).json({ error: 'Champs manquants' });

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
    const folders = await client.list();
    await client.logout();

    const mapped = { inbox: 'INBOX', sent: null, drafts: null, trash: null, spam: null };
    folders.forEach(f => {
      if (f.specialUse === '\\Sent')   mapped.sent   = f.path;
      if (f.specialUse === '\\Drafts') mapped.drafts = f.path;
      if (f.specialUse === '\\Trash')  mapped.trash  = f.path;
      if (f.specialUse === '\\Junk')   mapped.spam   = f.path;
    });

    res.status(200).json({ mapped, all: folders.map(f => ({ path: f.path, name: f.name, specialUse: f.specialUse || null })) });
  } catch (e) {
    try { await client.logout(); } catch {}
    res.status(500).json({ error: e.message });
  }
}
