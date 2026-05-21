import crypto from 'crypto';

// Cashfree API configuration
const getCashfreeConfig = () => ({
  baseUrl: process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg',
  clientId: process.env.CASHFREE_CLIENT_ID || '',
  clientSecret: process.env.CASHFREE_CLIENT_SECRET || '',
  webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || '',
});

/**
 * Create a new order with Cashfree
 */
export async function createCashfreeOrder(params: {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_email: string;
    customer_phone?: string;
    customer_name?: string;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
  order_note?: string;
}): Promise<any> {
  const { baseUrl, clientId, clientSecret } = getCashfreeConfig();

  if (!clientId || !clientSecret) {
    throw new Error('Cashfree credentials are not configured in environment variables');
  }

  const controller = new AbortController();
  const timeoutMs = 9000; // 9 seconds - less than Vercel's 10s timeout
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cashfree API error: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Cashfree API request timed out after 9 seconds');
    }
    throw err;
  }
}

/**
 * Get order status from Cashfree
 */
export async function getCashfreeOrder(orderId: string): Promise<any> {
  const { baseUrl, clientId, clientSecret } = getCashfreeConfig();

  if (!clientId || !clientSecret) {
    throw new Error('Cashfree credentials are not configured');
  }

  const controller = new AbortController();
  const timeoutMs = 9000; // 9 seconds
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Cashfree API request timed out after 9 seconds');
    }
    throw err;
  }
}

/**
 * Verify Cashfree webhook signature
 */
export function verifyCashfreeWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
  const { webhookSecret } = getCashfreeConfig();

  if (!webhookSecret) {
    console.warn('CASHFREE_WEBHOOK_SECRET not set, skipping verification');
    return true;
  }

  try {
    const dataToVerify = timestamp + payload;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(dataToVerify)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Check if an order status indicates successful payment
 */
export function isPaymentSuccessful(status: string): boolean {
  return status === 'PAID' || status === 'COMPLETED';
}

/**
 * Check if an order status indicates failure
 */
export function isPaymentFailed(status: string): boolean {
  return status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED';
}