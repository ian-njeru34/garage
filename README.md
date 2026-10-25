# Joe's Garage

A mobile-first Next.js + Supabase starter inspired by the supplied landing-page reference: black hero, warm yellow accents, clean white service sections, compact contact strip, and prominent appointment/quote calls to action.

## Included in this ZIP

- Responsive public landing page, services, contact page
- Booking request form
- Quote request form
- Supabase email/password sign-in and customer registration
- Customer dashboard listing the signed-in customer's booking requests
- Staff/admin booking queue
- Initial Supabase SQL schema with RLS policies
- Starter tables for vehicles, job cards, parts, invoices, payments, and audit logs
- Vercel-ready Next.js project structure

**Scope note:** This is a working starter, not a finished production garage-management platform. The customer dashboard currently covers booking requests; live job tracking, quotation approval, stock workflows, invoices, M-Pesa payments, automated messaging, and full audit logging still need their application workflows implemented and tested. Do not accept live payments until server-side payment verification and reconciliation have been implemented.

## 1. Create your Supabase project

1. Open https://supabase.com and create a project.
2. In **SQL Editor**, open a new query.
3. Copy all of `supabase/schema.sql` into the editor and run it.
4. Open **Project Settings → API** (or the project's API keys page).
5. Copy the Project URL and the publishable/anon key. Never use the `service_role` secret in browser code.

## 2. Run locally

Install Node.js 20 or newer. In this folder:

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` with your real Supabase values and garage contact information, then:

```bash
npm run dev
```

Open http://localhost:3000.

On Windows, copy `.env.example` to `.env.local` manually if `cp` is unavailable.

## 3. Create the first admin

1. Use the website's **Customer portal** to create an account.
2. In Supabase, open **Authentication → Users** and find that account's UUID.
3. In the SQL Editor, run this with your own UUID:

```sql
update public.profiles
set role = 'admin'
where id = 'PASTE_AUTH_USER_UUID_HERE';
```

Never expose your Supabase service-role key to the browser or commit it to GitHub. Only the project owner should run this promotion query. Staff can then open `/admin`.

## 4. Deploy to GitHub and Vercel

1. Create a GitHub repository named `joes-garage`.
2. Upload the contents of this folder to the repository root (the `package.json` should be at the root).
3. In Vercel, choose **Add New → Project**, import the repository, and deploy.
4. In Vercel **Project → Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GARAGE_PHONE`
   - `NEXT_PUBLIC_GARAGE_WHATSAPP`
   - `NEXT_PUBLIC_GARAGE_EMAIL`
   - `NEXT_PUBLIC_GARAGE_LOCATION`
5. Redeploy after adding environment variables.
6. In Supabase **Authentication → URL Configuration**, set your deployed Vercel URL as the Site URL and add it to Redirect URLs. Add your custom domain after connecting it to Vercel.

## 5. Customize the garage details and design

- Change the phone, WhatsApp number, email and location in `.env.local` / Vercel environment variables.
- The yellow accent is `#FFC400`, the main background is `#080808`, and content is white. Adjust CSS variables in `app/globals.css`.
- The landing page uses remote Unsplash photos as temporary visual assets. Replace these with authorized photos of the actual garage and work before production.
- Update opening hours and service descriptions to match the real business.

## 6. Important security notes

- Keep RLS enabled.
- Never place a Supabase service-role key, M-Pesa passkey, consumer secret, or other private secret in a `NEXT_PUBLIC_` variable.
- The first public booking/quote forms intentionally accept enquiries without an account. Add CAPTCHA/rate limiting and server-side validation before public production launch.
- Test customer data isolation with two different customer accounts.
- Admin role assignment is a manual owner-only step.
- Review the SQL policies and application permissions with a security-minded developer before handling sensitive customer or payment data.
- Public forms store contact details in Supabase; publish an appropriate privacy notice and retention policy.
- Do not use demo phone numbers or placeholder business details in production.

## 7. Planned next modules

1. Vehicle management UI
2. Job cards and workshop status timeline
3. Quotations, itemized customer approval, and revisions
4. Inventory, suppliers, stock movements and purchase orders
5. Invoices, M-Pesa callback verification and reconciliation
6. Email/SMS/WhatsApp notifications
7. Reports, audit event creation and backup/recovery testing
