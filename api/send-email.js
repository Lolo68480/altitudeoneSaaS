import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, body, from_email, smtp_host, smtp_port, smtp_user, smtp_pass } = req.body || {};
  if (!to || !smtp_user || !smtp_pass) return res.status(400).json({ error: 'Champs requis manquants' });

  try {
    const transporter = nodemailer.createTransport({
      host: smtp_host || 'smtp.gmail.com',
      port: parseInt(smtp_port) || 587,
      secure: parseInt(smtp_port) === 465,
      auth: { user: smtp_user, pass: smtp_pass },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({
      from: from_email || smtp_user,
      to,
      subject: subject || '(sans objet)',
      text: body || '',
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
