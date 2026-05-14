import Papa from 'papaparse';

export interface CSVReceiver {
  name: string;
  email: string;
}

/**
 * Parse a CSV buffer and extract receivers with name and email fields.
 * Supports various column names: name/Name/Full Name/full_name, email/Email/E-mail/email_address
 */
export function parseCSV(buffer: Buffer): CSVReceiver[] {
  const csvString = buffer.toString('utf-8');

  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
    trimHeaders: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parsing errors: ${result.errors.map((e) => e.message).join(', ')}`);
  }

  const receivers: CSVReceiver[] = [];

  for (const row of result.data) {
    // Try to find the name field
    const name =
      row['name'] ||
      row['Name'] ||
      row['Full Name'] ||
      row['full_name'] ||
      row['fullName'] ||
      row['first_name'] ||
      row['First Name'] ||
      '';

    // Try to find the email field
    const email =
      row['email'] ||
      row['Email'] ||
      row['E-mail'] ||
      row['email_address'] ||
      row['Email Address'] ||
      row['emailAddress'] ||
      '';

    if (email && isValidEmail(email.trim())) {
      receivers.push({
        name: name.trim() || email.trim().split('@')[0],
        email: email.trim(),
      });
    }
  }

  return receivers;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
