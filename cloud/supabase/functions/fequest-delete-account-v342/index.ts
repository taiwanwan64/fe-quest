// FE QUEST v342 account lifecycle endpoint.
// Authenticated users may delete only their own Supabase Auth account. The linked
// public.user_profiles row is removed by ON DELETE CASCADE. Local FE QUEST data is
// intentionally outside this endpoint and remains on the device unless the learner
// separately clears it from FE QUEST data management.
import { withSupabase } from 'npm:@supabase/server@1.4.1'

const CONFIRM_VALUE = 'delete-fequest-account'

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  })
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return json({ ok: false, status: 'method-not-allowed' }, 405, { Allow: 'POST' })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return json({ ok: false, status: 'invalid-request' }, 400)
    }

    if (!body || typeof body !== 'object' || (body as { confirm?: unknown }).confirm !== CONFIRM_VALUE) {
      return json({ ok: false, status: 'confirmation-required' }, 400)
    }

    const { data, error: userError } = await ctx.supabase.auth.getUser()
    const userId = data?.user?.id
    if (userError || !userId) {
      return json({ ok: false, status: 'authentication-required' }, 401)
    }

    const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('FEQUEST_ACCOUNT_DELETE_FAILED', {
        status: deleteError.status ?? null,
        code: deleteError.code ?? null,
      })
      return json({ ok: false, status: 'delete-failed' }, 500)
    }

    return json({ ok: true, status: 'deleted' })
  }),
}
