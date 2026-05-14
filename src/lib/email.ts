import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

interface BulkEmailResult {
  sentCount: number;
  failedCount: number;
  results: Array<{
    receiver: string;
    receiverName: string;
    status: 'SENT' | 'FAILED';
    errorMessage: string;
  }>;
}

// Create a transporter using environment variables or ethereal for demo
export function createTransporter() {
  const host = process.env.SMTP_HOST || '';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  // If SMTP credentials are provided, use them
  if (host && user) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // For demo purposes, return a placeholder transporter
  // In production, you would configure proper SMTP settings
  return nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const from = options.from || process.env.SMTP_FROM || 'BulkMail <noreply@bulkmail.app>';

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending email';
    return { success: false, error: errorMessage };
  }
}

export async function sendBulkEmails(
  receivers: Array<{ name: string; email: string }>,
  subject: string,
  htmlContent: string,
  options?: {
    from?: string;
    attachments?: Array<{ filename: string; path: string }>;
    logoUrl?: string;
    delay?: number;
  }
): Promise<BulkEmailResult> {
  const results: BulkEmailResult['results'] = [];
  let sentCount = 0;
  let failedCount = 0;

  const logoHtml = options?.logoUrl
    ? `<div style="text-align:center;margin-bottom:20px;"><img src="${options.logoUrl}" alt="Logo" style="max-height:80px;" /></div>`
    : '';

  for (const receiver of receivers) {
    // Personalize content by replacing {{name}} placeholder
    const personalizedHtml = htmlContent.replace(/\{\{name\}\}/g, receiver.name || 'there');
    const fullHtml = `${logoHtml}${personalizedHtml}`;

    try {
      const result = await sendEmail({
        to: receiver.email,
        subject,
        html: fullHtml,
        from: options?.from,
        attachments: options?.attachments,
      });

      if (result.success) {
        sentCount++;
        results.push({
          receiver: receiver.email,
          receiverName: receiver.name,
          status: 'SENT',
          errorMessage: '',
        });
      } else {
        failedCount++;
        results.push({
          receiver: receiver.email,
          receiverName: receiver.name,
          status: 'FAILED',
          errorMessage: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      failedCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        receiver: receiver.email,
        receiverName: receiver.name,
        status: 'FAILED',
        errorMessage,
      });
    }

    // Small delay between emails to avoid rate limiting
    if (options?.delay && options.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }
  }

  return { sentCount, failedCount, results };
}
