// Supabase Auth "Send SMS" hook: delivers the login OTP over WhatsApp
// (Meta WhatsApp Cloud API) instead of SMS.
//
// Supabase Auth generates, rate-limits and verifies the OTP itself; this function
// only delivers it. Requests are authenticated with the hook's signing secret
// (Standard Webhooks), so verify_jwt is off.
//
// Required secrets (Dashboard -> Edge Functions -> Secrets):
//   SEND_SMS_HOOK_SECRET        from Authentication -> Hooks -> Send SMS ("v1,whsec_...")
//   WHATSAPP_PHONE_NUMBER_ID    Meta WhatsApp sender phone number ID
//   WHATSAPP_ACCESS_TOKEN       Meta permanent (system user) access token
//   WHATSAPP_OTP_TEMPLATE_NAME  approved authentication template (copy-code button)
// Optional:
//   WHATSAPP_OTP_TEMPLATE_LANG  template language code, default "en"
//
// Deployed with: verify_jwt = false

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const HOOK_SECRET = (Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '').replace('v1,whsec_', '')
const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
const TEMPLATE = Deno.env.get('WHATSAPP_OTP_TEMPLATE_NAME')
const LANG = Deno.env.get('WHATSAPP_OTP_TEMPLATE_LANG') ?? 'en'

// Hook error format understood by Supabase Auth (message is shown to the user).
const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail(405, 'Method not allowed')
  if (!HOOK_SECRET || !PHONE_NUMBER_ID || !ACCESS_TOKEN || !TEMPLATE) {
    console.error('[send-whatsapp-otp] missing configuration secrets')
    return fail(500, 'WhatsApp login is not configured yet.')
  }

  const payload = await req.text()
  let user: { phone?: string }, sms: { otp?: string }
  try {
    ;({ user, sms } = new Webhook(HOOK_SECRET).verify(payload, Object.fromEntries(req.headers)) as {
      user: { phone?: string }
      sms: { otp?: string }
    })
  } catch {
    return fail(401, 'Invalid hook signature')
  }

  const to = (user.phone ?? '').replace(/^\+/, '')
  const otp = sms.otp ?? ''
  if (!/^\d{7,15}$/.test(to) || !otp) return fail(400, 'Invalid phone number or code')

  const res = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ACCESS_TOKEN}` },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: TEMPLATE,
        language: { code: LANG },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: otp }] },
          { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] },
        ],
      },
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const code = data?.error?.code
    console.error('[send-whatsapp-otp] Meta API error', res.status, code, data?.error?.message)
    if (code === 131030 || code === 131026) return fail(400, 'This number does not seem to be on WhatsApp.')
    return fail(502, 'Could not send the WhatsApp code. Please try again in a minute.')
  }

  return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
