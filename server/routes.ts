import express from "express";
import type { Request, Response } from "express";
import { createServer, type Server } from "http";
import { supabaseAdmin } from "./lib/supabase";
import { createCashfreeOrder, getCashfreeOrder, verifyCashfreeWebhookSignature, isPaymentSuccessful, isPaymentFailed } from "./lib/cashfree";

// Helper: Verify JWT token and get user
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }
  
  if (!supabaseAdmin) {
    return { user: null, error: 'Server configuration error: Supabase Admin not initialized' };
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: 'Invalid token' };
  }
  return { user };
}

export function registerRoutes(
  httpServer: Server,
  app: express.Express
): Server {
  // Prefix all API routes
  const api = express.Router();

   // POST /api/create-payment-session
   // Creates a new Cashfree order for premium one-time payment
   api.post('/create-payment-session', async (req: Request, res: Response) => {
     const { user, error: authError } = await getUserFromRequest(req);
     if (authError || !user) {
       return res.status(401).json({ error: 'Unauthorized' });
     }

     if (!supabaseAdmin) {
       return res.status(500).json({ error: 'Server configuration error: Supabase Admin not initialized' });
     }

     // Check if user already has premium
     const { data: profile } = await supabaseAdmin
       .from('profiles')
       .select('subscription_tier, subscription_status')
       .eq('id', user.id)
       .single();

     if (profile?.subscription_tier === 'premium' && profile?.subscription_status === 'active') {
       return res.status(400).json({ error: 'User already has premium access' });
     }

     const { order_amount = 400, order_currency = 'INR' } = req.body; // ₹400 one-time payment (~$4.99)

     const orderId = `order_${Date.now()}_${user.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');

     try {
       // Debug logs for environment variables (safely checked)
       console.log('Payment session creation started');
       console.log('SUPABASE_URL:', !!process.env.SUPABASE_URL);
       console.log('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
       console.log('CASHFREE_CLIENT_ID:', !!process.env.CASHFREE_CLIENT_ID);
       console.log('CASHFREE_CLIENT_SECRET:', !!process.env.CASHFREE_CLIENT_SECRET);

       let frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5001}`;
       // Cashfree Production mode strictly mandates secure HTTPS URLs for redirecting
       if (process.env.CASHFREE_ENV === 'production' && frontendUrl.startsWith('http://')) {
         frontendUrl = frontendUrl.replace('http://', 'https://');
       }

       const session = await createCashfreeOrder({
         order_id: orderId,
         order_amount,
         order_currency,
         customer_details: {
           customer_id: user.id,
           customer_email: user.email || '',
           customer_name: user.user_metadata?.full_name || user.email || '',
           customer_phone: user.phone || user.user_metadata?.phone || '9999999999',
         },
         order_meta: {
           return_url: `${frontendUrl}/payment-success?order_id=${orderId}`,
           notify_url: `${frontendUrl.replace(/\/$/, '')}/api/webhooks/cashfree`,
         },
         order_note: 'FindMyFuel Premium - One-time payment',
       });

       return res.json({
         cf_order_id: session.cf_order_id,
         order_id: orderId,
         payment_session_id: session.payment_session_id,
       });
     } catch (err: any) {
       console.error('Error creating Cashfree order:', err.message || err);
       return res.status(500).json({ 
         error: 'Failed to create payment session',
         details: err.message || 'Unknown error'
       });
     }
   });

  // POST /api/verify-payment
  // Verifies order status and upgrades user to premium if payment succeeded
  api.post('/verify-payment', async (req: Request, res: Response) => {
    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server configuration error: Supabase Admin not initialized' });
    }

    try {
      const order = await getCashfreeOrder(order_id);
      const { order_status } = order;

      if (isPaymentSuccessful(order_status)) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Failed to update profile:', updateError);
          return res.status(500).json({ error: 'Payment successful but failed to activate subscription' });
        }

        return res.json({ success: true, subscription: { tier: 'premium', status: 'active' } });
      }

      if (order_status === 'FAILED' || order_status === 'EXPIRED' || order_status === 'CANCELLED') {
        return res.status(400).json({ success: false, status: order_status, error: 'Payment failed or was cancelled' });
      }

      // Other statuses (CREATED, ACTIVE, etc.)
      return res.json({ success: false, status: order_status, error: 'Payment not completed yet' });
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      return res.status(500).json({ error: 'Failed to verify payment' });
    }
  });

  // GET /api/user/subscription
  // Returns current user's subscription status
  api.get('/user/subscription', async (req: Request, res: Response) => {
    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server configuration error: Supabase Admin not initialized' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    return res.json({
      tier: profile.subscription_tier,
      status: profile.subscription_status,
    });
  });

   // POST /api/webhooks/cashfree
   // Handles Cashfree order status updates via webhook
   app.post('/api/webhooks/cashfree', async (req: Request, res: Response) => {
     const signature = req.headers['x-cf-signature'] as string;
     const timestamp = req.headers['x-cf-timestamp'] as string;

     if (!signature || !timestamp) {
       return res.status(400).send('Missing signature headers');
     }

     // Get raw body from verify function in server/index.ts
     const rawBodyBuffer = (req as any).rawBody;
     if (!rawBodyBuffer) {
       return res.status(400).send('Missing raw body');
     }
     const payload = rawBodyBuffer.toString();

     if (!verifyCashfreeWebhookSignature(payload, signature, timestamp)) {
       return res.status(401).send('Invalid signature');
     }

     try {
       const event = JSON.parse(payload);
       const { order, order_status } = event;

       if (isPaymentSuccessful(order_status)) {
         const customerId = order?.customer_details?.customer_id;

         if (customerId && supabaseAdmin) {
           const { error: updateError } = await supabaseAdmin
             .from('profiles')
             .update({
               subscription_tier: 'premium',
               subscription_status: 'active',
             })
             .eq('id', customerId);

           if (updateError) {
             console.error('Failed to activate subscription for user', customerId, updateError);
           } else {
             console.log(`Premium activated for user ${customerId}`);
           }
         } else if (customerId && !supabaseAdmin) {
           console.error('Cannot activate subscription: Supabase Admin not initialized');
         }
       }

       res.status(200).send('OK');
     } catch (err: any) {
       console.error('Webhook processing error:', err);
       res.status(500).send('Error processing webhook');
     }
   });

  app.use('/api', api);

  return httpServer;
}
