# Vercel deployment requirements

Set these Environment Variables in the Vercel project before deploying:

VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY

Then redeploy the project.

IMPORTANT:
- Do NOT add SUPABASE_SERVICE_ROLE_KEY to Vercel for this frontend.
- Do NOT commit .env.local.
- If a service-role key was previously exposed, rotate it in Supabase.
