const CASHFREE_BASE_URL = import.meta.env.VITE_CASHFREE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

interface CashfreeCreateOrderRequest {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_email: string;
    customer_phone: string;
    customer_name: string;
  };
  order_meta?: {
    return_url: string;
    notify_url?: string;
  };
  order_note?: string;
}

interface CashfreeOrderResponse {
  cf_order_id: number;
  order_id: string;
  order_status: string;
  order_amount: string;
  order_currency: string;
  payment_session_id: string;
}

export interface CashfreePaymentSession {
  payment_session_id: string;
  cf_order_id: string;
}

export async function createCashfreeOrder(params: CashfreeCreateOrderRequest): Promise<CashfreePaymentSession> {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': import.meta.env.VITE_CASHFREE_CLIENT_ID!,
      'x-client-secret': import.meta.env.VITE_CASHFREE_CLIENT_SECRET!,
      'x-api-version': '2023-08-01',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create Cashfree order');
  }

  const data: CashfreeOrderResponse = await response.json();
  
  return {
    payment_session_id: data.payment_session_id,
    cf_order_id: String(data.cf_order_id),
  };
}

export async function getCashfreeOrderStatus(orderId: string): Promise<string> {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-client-id': import.meta.env.VITE_CASHFREE_CLIENT_ID!,
      'x-client-secret': import.meta.env.VITE_CASHFREE_CLIENT_SECRET!,
      'x-api-version': '2023-08-01',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get order status');
  }

  const data: CashfreeOrderResponse = await response.json();
  return data.order_status;
}

export type CashfreeOrderStatus = 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export function isPaymentSuccessful(status: string): boolean {
  return status === 'PAID';
}