require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://jjrultpfgynxqowfnagu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

app.use(cors());
app.use(express.json());

// Health check for Render
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'ViralCraft AI Engine',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ViralCraft AI Engine' });
});

// Flutterwave Webhook
app.post('/api/payments/flutterwave-webhook', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== process.env.FLUTTERWAVE_SECRET_HASH) {
      return res.status(401).json({ error: 'Unauthorized signature' });
    }

    const payload = req.body;
    const { status, tx_ref, id: transaction_id, amount, currency, customer } = payload.data || payload;

    if (status === 'successful') {
      let creditsToAdd = 100;
      let planTier = 'starter';
      if (amount >= 50000 || amount >= 50) {
        creditsToAdd = 1200;
        planTier = 'agency_max';
      } else if (amount >= 15000 || amount >= 15) {
        creditsToAdd = 300;
        planTier = 'creator_pro';
      }

      const { data: user } = await supabase
        .from('users')
        .select('id, credit_balance')
        .eq('email', customer.email)
        .single();

      if (user) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          flutterwave_reference: tx_ref,
          flutterwave_transaction_id: String(transaction_id),
          amount,
          currency,
          credits_added: creditsToAdd,
          plan_tier: planTier,
          status: 'successful'
        });

        await supabase
          .from('users')
          .update({
            credit_balance: user.credit_balance + creditsToAdd,
            subscription_tier: planTier,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ðŸš€ ViralCraft AI Backend running on port ${PORT}`);
});
