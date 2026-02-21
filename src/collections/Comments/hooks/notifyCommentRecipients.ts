import type { CollectionAfterChangeHook } from 'payload'

import type { Comment } from '../../../payload-types'
import { getServerSideURL } from '../../../utilities/getURL'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildEmailHtml({
  commentAuthor,
  commentBody,
  postTitle,
  commentUrl,
  isReply,
}: {
  commentAuthor: string
  commentBody: string
  postTitle: string
  commentUrl: string
  isReply: boolean
}): string {
  const heading = isReply
    ? `${escapeHtml(commentAuthor)} replied to your comment`
    : `New comment from ${escapeHtml(commentAuthor)}`

  const truncatedBody =
    commentBody.length > 300 ? commentBody.slice(0, 300) + '…' : commentBody

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .content { padding: 32px 24px; color: #333333; line-height: 1.6; font-size: 16px; }
    .content a { color: #2563eb; }
    .quote { border-left: 3px solid #e5e7eb; padding-left: 12px; margin: 16px 0; color: #555555; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="content">
      <p><strong>${heading}</strong> on <em>${escapeHtml(postTitle)}</em></p>
      <div class="quote"><p>${escapeHtml(truncatedBody)}</p></div>
      <p><a href="${commentUrl}">View comment</a></p>
    </div>
  </div>
</body>
</html>`
}

export const notifyCommentRecipients: CollectionAfterChangeHook<Comment> = async ({
  doc,
  operation,
  req: { payload },
}) => {
  if (operation !== 'create') return doc

  const postId = typeof doc.post === 'object' ? doc.post.id : doc.post
  let post: { slug?: string; title?: string; authors?: (number | { id: number; email: string })[] | null }

  try {
    post = await payload.findByID({
      collection: 'posts',
      id: postId,
      overrideAccess: true,
      depth: 0,
      select: { slug: true, title: true, authors: true },
    })
  } catch {
    return doc
  }

  if (!post?.slug) return doc

  const baseUrl = getServerSideURL()
  const commentUrl = `${baseUrl}/posts/${post.slug}#comment-${doc.id}`
  const postTitle = post.title || 'Untitled Post'
  const commentAuthorEmail = doc.authorEmail?.toLowerCase()

  // Collect post author emails
  const postAuthorEmails = new Set<string>()
  if (post.authors && Array.isArray(post.authors)) {
    const authorIds = post.authors.map((a) => (typeof a === 'object' ? a.id : a))
    for (const authorId of authorIds) {
      try {
        const user = await payload.findByID({
          collection: 'users',
          id: authorId,
          overrideAccess: true,
          select: { email: true },
        })
        if (user?.email) {
          postAuthorEmails.add(user.email.toLowerCase())
        }
      } catch {
        // skip if user not found
      }
    }
  }

  // Collect parent comment author email (for replies)
  let parentAuthorEmail: string | undefined
  if (doc.parent) {
    const parentId = typeof doc.parent === 'object' ? doc.parent.id : doc.parent
    try {
      const parentComment = await payload.findByID({
        collection: 'comments',
        id: parentId,
        overrideAccess: true,
        select: { authorEmail: true },
      })
      if (parentComment?.authorEmail) {
        parentAuthorEmail = parentComment.authorEmail.toLowerCase()
      }
    } catch {
      // skip if parent not found
    }
  }

  // Send to post authors (excluding the comment author themselves)
  for (const email of postAuthorEmails) {
    if (email === commentAuthorEmail) continue
    try {
      await payload.sendEmail({
        to: email,
        subject: `New comment on "${postTitle}" from ${doc.authorName}`,
        html: buildEmailHtml({
          commentAuthor: doc.authorName,
          commentBody: doc.body,
          postTitle,
          commentUrl,
          isReply: false,
        }),
      })
    } catch (err) {
      payload.logger.error(`Failed to send comment notification to ${email}: ${err}`)
    }
  }

  // Send to parent comment author (if it's a reply and not already notified as post author)
  if (parentAuthorEmail && parentAuthorEmail !== commentAuthorEmail && !postAuthorEmails.has(parentAuthorEmail)) {
    try {
      await payload.sendEmail({
        to: parentAuthorEmail,
        subject: `${doc.authorName} replied to your comment on "${postTitle}"`,
        html: buildEmailHtml({
          commentAuthor: doc.authorName,
          commentBody: doc.body,
          postTitle,
          commentUrl,
          isReply: true,
        }),
      })
    } catch (err) {
      payload.logger.error(`Failed to send reply notification to ${parentAuthorEmail}: ${err}`)
    }
  }

  return doc
}
