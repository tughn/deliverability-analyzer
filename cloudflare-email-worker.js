/**
 * Cloudflare Email Worker
 * Intercepts emails sent to deliverabilityanalyzer.xyz and forwards to webhook for analysis
 */

export default {
  async email(message, env, ctx) {
    try {
      // Extract email details
      const from = message.from;
      const to = message.to;

      console.log(`📧 Processing email from ${from} to ${to}`);

      // Get raw email content
      const rawEmail = await streamToString(message.raw);

      // Parse headers
      const headers = {};
      for (const [key, value] of message.headers) {
        headers[key] = value;
      }

      // Prepare payload for webhook
      const payload = {
        from: from,
        to: to,
        subject: headers['subject'] || 'No Subject',
        headers: headers,
        raw: rawEmail,
        timestamp: new Date().toISOString()
      };

      // Send to webhook API
      const webhookUrl = 'https://deliverability-analyzer.vercel.app/api/webhook/email';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`❌ Webhook failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      } else {
        const result = await response.json();
        console.log('✅ Webhook succeeded:', result);
      }

      // Drop the email (don't forward it anywhere)
      // This prevents it from being forwarded to your personal email
      // Using setReject with a 250 code would be better, but we'll just drop it

    } catch (error) {
      console.error('❌ Email worker error:', error);
      // Drop the email even on error
    }
  }
};

/**
 * Helper function to convert ReadableStream to string
 */
async function streamToString(stream) {
  const chunks = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const uint8Array = new Uint8Array(
    chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  );

  let offset = 0;
  for (const chunk of chunks) {
    uint8Array.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(uint8Array);
}
