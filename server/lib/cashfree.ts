import crypto from 'crypto';

// Cashfree API configuration
const CASHFREE_BASE_URL = process.env.CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const CLIENT_ID = process.env.CASHFREE_CLIENT_ID!;
const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET!;
const WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET!;

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
  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'x-client-secret': CLIENT_SECRET,
      'x-api-version': '2023-08-01',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cashfree API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Get order status from Cashfree
 */
export async function getCashfreeOrder(orderId: string): Promise<any> {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-client-id': CLIENT_ID,
      'x-client-secret': CLIENT_SECRET,
      'x-api-version': '2023-08-01',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`);
  }

  return await response.json();
}

/**
 * Verify Cashfree webhook signature
 */
export function verifyCashfreeWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('CASHFREE_WEBHOOK_SECRET not set, skipping verification');
    return true;
  }

  try {
    const dataToVerify = timestamp + payload;
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
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