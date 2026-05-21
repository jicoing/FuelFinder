# FuelFinder Premium Setup Guide

## Overview

This guide explains how to set up Supabase for authentication and data storage, and Cashfree for payment processing to enable the freemium model.

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Copy the **Project URL** and **anon/public key** from Settings > API

### 2. Run Database Schema

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL to create all tables and policies

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Enable Email Auth (optional)

In Supabase Dashboard > Authentication > Providers:
- Enable Email provider (enabled by default)
- Configure email templates for password reset, confirmation, etc.

## Cashfree Setup (Payments)

### 1. Create Cashfree Account

1. Sign up at [cashfree.com](https://www.cashfree.com)
2. Complete merchant registration
3. Get your **Client ID** and **Client Secret** from Dashboard > Developers

### 2. Configure Webhook (optional)

For production, set up webhook to receive payment confirmation:
- URL: `https://your-domain.com/api/webhooks/cashfree`

### 3. Add Environment Variables

```env
VITE_CASHFREE_CLIENT_ID=your-client-id
VITE_CASHFREE_CLIENT_SECRET=your-client-secret
VITE_CASHFREE_ENV=sandbox  # or production
```

## Freemium Tiers

### Free Tier
- Search nearby fuel stations
- Basic trip calculator
- **10** saved trip calculations
- **5** favorite stations
- No data export
- No sync across devices

### Premium Tier ($4.99/month)
- Everything in Free
- **Unlimited** saved trip history
- **Unlimited** saved stations
- Export data to CSV
- Sync across devices
- Priority support
- Early access to new features

## API Endpoints (Server-side)

For security, sensitive operations should go through your Express server:

### POST /api/create-payment-session
Creates a Cashfree order for premium upgrade.

### POST /api/verify-payment
Verifies payment status and upgrades user tier.

### GET /api/user/subscription
Returns current user's subscription status.

### POST /api/webhooks/cashfree
Handles Cashfree payment webhooks.

## Security Notes

1. **Row Level Security (RLS)** is enabled on all tables
2. Service role key should only be used server-side
3. Payment verification happens server-side only
4. User can only access their own data

## Testing

For testing payments in sandbox:
- Use test credentials from Cashfree dashboard
- Use test card numbers provided by Cashfree

## Going to Production

1. Set `VITE_CASHFREE_ENV=production`
2. Enable email confirmations in Supabase Auth settings
3. Set up proper CORS rules for your domain
4. Configure production webhook URL
5. Review and adjust rate limiting