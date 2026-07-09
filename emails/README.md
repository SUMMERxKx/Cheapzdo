# Arcflow email templates

Branded, on-brand replacements for the plain default Supabase auth emails. The
repo is the source of truth. They are plain HTML, table based, with fully inlined
CSS and a web safe font stack, so they render the same in Gmail, Outlook, and
Apple Mail (emails cannot load the app's Space Grotesk font or external images).
Light by default with a dark mode hint for clients that honor it.

## What goes where

Supabase dashboard: **Authentication > Emails > Templates**. Pick the template on
the left, paste the file's contents into the message body, and set the subject.

| File | Supabase template | Variable | Suggested subject |
| --- | --- | --- | --- |
| `confirm-signup.html` | Confirm signup | `{{ .ConfirmationURL }}` | Confirm your Arcflow email |
| `reset-password.html` | Reset password | `{{ .ConfirmationURL }}` | Reset your Arcflow password |
| `change-email.html` | Change email address | `{{ .ConfirmationURL }}` | Confirm your new Arcflow email |
| `board-invite.html` | not wired yet, see below | `{{inviter_name}}`, `{{board_name}}`, `{{role}}`, `{{invite_url}}` | You are invited to a board on Arcflow |

`board-invite.html` is **not** a Supabase auth template. Invites today use a copy
link the owner shares by hand (ADR-0013). This file is ready for the future
invite-member Edge Function that will send through Resend and fill those four
placeholders itself. It is here so the look is done when that lands.

## Deliverability comes first

A pretty template that lands in spam is worthless, so set up real sending before
or alongside pasting these in. From DEPLOYMENT.md step 3:

1. Create a Resend account (or any SMTP provider) and verify a sending domain,
   including the SPF and DKIM DNS records Resend gives you. Without domain
   verification, mail from the default Supabase sender is rate limited and often
   lands in spam.
2. Supabase dashboard: **Authentication > Emails > SMTP Settings**, turn on
   custom SMTP, and fill in the host, port, user, and password from the provider.
3. Set the sender name to Arcflow and the sender address to something on the
   verified domain, for example no-reply@yourdomain.

## After pasting, test each flow

- Sign up with a fresh address and confirm the "Confirm signup" mail looks right
  and the button works.
- Use "Forgot password" on the login screen and check the reset mail.
- Change your email in the profile and check the confirmation mail.
- View each in at least Gmail and one Outlook or Apple Mail client. Check the
  button renders, the link is clickable, and nothing overflows on mobile.

## Editing

Keep the shell (header mark, button, footer) identical across the files so the
set stays consistent. If you change one, mirror the change in the others. The
accent is the Arcflow iris `#5C7EFA`. Do not add external images, inline
everything, and keep the width at 560px.
