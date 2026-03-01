/**
 * Email sending via Resend. No-op if RESEND_API_KEY is not set.
 * @module lib/email
 */
import { Resend } from 'resend';
import { config } from '../config/index.js';
import { logger } from './logger.js';

let resend = null;
if (config.resendApiKey) {
  resend = new Resend(config.resendApiKey);
}

const FROM = process.env.RESEND_FROM || 'BeMe <onboarding@resend.dev>';

/**
 * Send an email. No-op if Resend is not configured.
 * @param {{ to: string, subject: string, html: string }} opts
 */
export async function sendMail({ to, subject, html }) {
  if (!resend) {
    logger.warn({ to, subject: subject?.slice(0, 50) }, 'Email not sent (RESEND_API_KEY not set)');
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject,
      html,
    });
    if (error) {
      logger.error({ err: error }, 'Resend send error');
    }
    return data;
  } catch (err) {
    logger.error({ err }, 'Email send error');
  }
}

/**
 * Send "You've been added to {groupName}" with link to the group.
 */
export async function sendAddedToGroupEmail(toEmail, groupName, groupId) {
  const baseUrl = (config.appBaseUrl || '').replace(/\/$/, '');
  const link = `${baseUrl}/groups/${groupId}`;
  const subject = `You've been added to ${groupName}`;
  const html = `
    <p>You've been added to the group <strong>${escapeHtml(groupName)}</strong>.</p>
    <p><a href="${escapeHtml(link)}">Open the group</a></p>
  `;
  return sendMail({ to: toEmail, subject, html });
}

/**
 * Send invite email with signup/login link.
 */
export async function sendGroupInviteEmail(toEmail, groupName, inviteLink) {
  const subject = `You're invited to join ${groupName}`;
  const html = `
    <p>You're invited to join the group <strong>${escapeHtml(groupName)}</strong>.</p>
    <p>Sign up or log in to join: <a href="${escapeHtml(inviteLink)}">${escapeHtml(inviteLink)}</a></p>
  `;
  return sendMail({ to: toEmail, subject, html });
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
