import type { PayloadHandler } from 'payload'

import { convertLexicalToHTML, defaultHTMLConverters } from '@payloadcms/richtext-lexical/html'

function wrapInEmailTemplate(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .content { padding: 32px 24px; color: #333333; line-height: 1.6; font-size: 16px; }
    .content h1, .content h2, .content h3, .content h4 { color: #111111; }
    .content a { color: #2563eb; }
    .footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      You received this email because you are subscribed to our newsletter.
    </div>
  </div>
</body>
</html>`
}

export const sendNewsletterHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.routeParams?.id as string
  if (!id) {
    return Response.json({ error: 'Newsletter ID is required' }, { status: 400 })
  }

  try {
    const newsletter = await req.payload.findByID({
      collection: 'newsletters',
      id,
      req,
    })

    if (newsletter.status === 'sent') {
      return Response.json({ error: 'Newsletter has already been sent' }, { status: 400 })
    }

    if (!newsletter.content) {
      return Response.json({ error: 'Newsletter has no content' }, { status: 400 })
    }

    const recipients = await req.payload.find({
      collection: 'newsletter-recipients',
      where: { status: { equals: 'subscribed' } },
      limit: 0,
      req,
    })

    if (recipients.totalDocs === 0) {
      return Response.json({ error: 'No subscribed recipients found' }, { status: 400 })
    }

    const bodyHtml = convertLexicalToHTML({
      converters: defaultHTMLConverters,
      data: newsletter.content,
    })

    const emailHtml = wrapInEmailTemplate(newsletter.subject, bodyHtml)

    let sentCount = 0
    const errors: string[] = []

    for (const recipient of recipients.docs) {
      try {
        await req.payload.sendEmail({
          to: recipient.email,
          subject: newsletter.subject,
          html: emailHtml,
        })
        sentCount++
      } catch (err) {
        errors.push(`Failed to send to ${recipient.email}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    await req.payload.update({
      collection: 'newsletters',
      id,
      data: {
        status: 'sent',
        sentAt: new Date().toISOString(),
        recipientCount: sentCount,
      },
      req,
    })

    return Response.json({
      success: true,
      sentCount,
      totalRecipients: recipients.totalDocs,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to send newsletter' },
      { status: 500 },
    )
  }
}
