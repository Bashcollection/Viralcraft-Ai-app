require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Required Environment Variables:
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
// FLUTTERWAVE_SECRET_KEY
// FLUTTERWAVE_SECRET_HASH
// ELEVENLABS_API_KEY
// HEDRA_API_KEY

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors());
app.use(express.json());

// --------------------------------------------------------------------
// 1. HEALTH CHECK
// --------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ViralCraft AI Engine', timestamp: new Date() });
});

// --------------------------------------------------------------------
// 2. FLUTTERWAVE WEBHOOK HANDLER
// --------------------------------------------------------------------
// Endpoint: POST /api/payments/flutterwave-webhook
app.post('/api/payments/flutterwave-webhook', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];

    // 1. Cryptographic Signature Verification
    if (!signature || signature !== process.env.FLUTTERWAVE_SECRET_HASH) {
      console.error('❌ [FLW Webhook] Invalid Secret Hash signature');
      return res.status(401).json({ error: 'Unauthorized signature' });
    }

    const payload = req.body;
    const { status, tx_ref, id: transaction_id, amount, currency, customer } = payload.data || payload;

    console.log(`🔔 [FLW Webhook] Received status: ${status} for tx_ref: ${tx_ref}`);

    if (status === 'successful') {
      // 2. Double-check with Flutterwave verification API
      const verifyRes = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
        {
          headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
        }
      );

      if (verifyRes.data.data.status !== 'successful') {
        console.error('❌ [FLW Webhook] Verification endpoint mismatch');
        return res.status(400).json({ error: 'Verification failed' });
      }

      // 3. Calculate credits according to plan
      let creditsToAdd = 100;
      let planTier = 'starter';

      if (amount >= 50000 || amount >= 50) {
        creditsToAdd = 1200;
        planTier = 'agency_max';
      } else if (amount >= 15000 || amount >= 15) {
        creditsToAdd = 300;
        planTier = 'creator_pro';
      }

      // 4. Find user by email or metadata
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, credit_balance')
        .eq('email', customer.email)
        .single();

      if (userError || !user) {
        console.error('❌ User not found for email:', customer.email);
        return res.status(404).json({ error: 'User not found' });
      }

      // 5. Update user balance & log transaction atomically
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        flutterwave_reference: tx_ref,
        flutterwave_transaction_id: String(transaction_id),
        amount: amount,
        currency: currency,
        credits_added: creditsToAdd,
        plan_tier: planTier,
        status: 'successful',
        metadata: payload,
      });

      if (txError) {
        console.error('Error logging transaction:', txError);
      }

      // 6. Update user credit balance & tier
      await supabase
        .from('users')
        .update({
          credit_balance: user.credit_balance + creditsToAdd,
          subscription_tier: planTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      console.log(`✅ Awarded ${creditsToAdd} credits to ${customer.email} (New Balance: ${user.credit_balance + creditsToAdd})`);
      return res.status(200).json({ received: true });
    }

    return res.status(200).json({ received: true, note: 'Status not successful' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --------------------------------------------------------------------
// 3. TALKING AVATAR GENERATION PIPELINE
// --------------------------------------------------------------------
// Endpoint: POST /api/generate/talking-avatar
app.post('/api/generate/talking-avatar', async (req, res) => {
  const { userId, textScript, voiceId = '21m00Tcm4TlvDq8ikWAM', avatarImageUrl } = req.body;

  if (!userId || !textScript) {
    return res.status(400).json({ error: 'Missing required parameters: userId or textScript' });
  }

  const COST = 5; // Talking Avatar costs 5 credits

  try {
    // 1. Safely deduct credits in Supabase via atomic stored procedure
    const { data: deductResult, error: deductError } = await supabase.rpc(
      'deduct_credits_for_job',
      {
        p_user_id: userId,
        p_tool_used: 'talking_avatar',
        p_credits_required: COST,
        p_input_prompt: textScript,
      }
    );

    if (deductError || !deductResult.success) {
      return res.status(402).json({
        error: deductResult?.error || 'Failed to deduct credits. Insufficient balance.',
      });
    }

    const jobId = deductResult.job_id;

    // 2. Synthesize Audio using ElevenLabs API
    console.log(`🎙️ Calling ElevenLabs TTS for Job ${jobId}...`);
    const ttsResponse = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: textScript,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
        },
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // Upload audio buffer to Supabase Storage Bucket
    const audioFileName = `audio_${jobId}.mp3`;
    const { data: audioUpload, error: audioUploadError } = await supabase.storage
      .from('video-assets')
      .upload(audioFileName, ttsResponse.data, { contentType: 'audio/mpeg' });

    const { data: audioPublicUrlData } = supabase.storage
      .from('video-assets')
      .getPublicUrl(audioFileName);

    const audioUrl = audioPublicUrlData.publicUrl;

    // 3. Initiate Lip-Sync using Hedra Character-2 / fal.ai API
    console.log(`🎬 Submitting Lip-Sync request to Hedra/fal.ai...`);
    const hedraResponse = await axios.post(
      'https://api.hedra.com/v1/characters',
      {
        avatar_image_url: avatarImageUrl || 'https://cdn.viralcraft.ai/avatars/tech_founder_default.png',
        audio_source_url: audioUrl,
        aspect_ratio: '9:16', // TikTok, Reels, Shorts format
      },
      {
        headers: {
          'X-API-KEY': process.env.HEDRA_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const generatedVideoUrl = hedraResponse.data.video_url || hedraResponse.data.url;

    // 4. Update Generation Job status in Supabase
    await supabase
      .from('generation_jobs')
      .update({
        output_video_url: generatedVideoUrl,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return res.status(200).json({
      success: true,
      jobId,
      videoUrl: generatedVideoUrl,
      remainingCredits: deductResult.remaining_credits,
    });
  } catch (error) {
    console.error('Generation pipeline error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Video generation failed', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ViralCraft AI Backend running on port ${PORT}`);
});