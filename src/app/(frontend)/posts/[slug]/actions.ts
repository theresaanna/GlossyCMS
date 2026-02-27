'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { getServerSideURL } from '@/utilities/getURL'

type SubmitCommentResult = {
  success: boolean
  message: string
}

type RequestVerificationResult = {
  success: boolean
  message: string
}

/**
 * Sends a verification email to the commenter. They must click the link
 * before their comment will be accepted.
 */
export async function requestCommentVerification(
  email: string,
): Promise<RequestVerificationResult> {
  if (!email?.trim()) {
    return { success: false, message: 'Email is required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const payload = await getPayload({ config: configPromise })

  // Check if this email already has a valid (non-expired, verified) token
  const now = new Date().toISOString()
  const existing = await payload.find({
    collection: 'comment-verification-tokens',
    overrideAccess: true,
    where: {
      email: { equals: normalizedEmail },
      verified: { equals: true },
      expiresAt: { greater_than: now },
    },
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    return { success: true, message: 'Your email is already verified.' }
  }

  // Rate limit: max 3 verification emails per email per 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const recentTokens = await payload.find({
    collection: 'comment-verification-tokens',
    overrideAccess: true,
    where: {
      email: { equals: normalizedEmail },
      createdAt: { greater_than: tenMinutesAgo },
    },
    limit: 0,
  })

  if (recentTokens.totalDocs >= 3) {
    return {
      success: false,
      message: 'Too many verification requests. Please wait a few minutes.',
    }
  }

  // Generate a secure token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes

  await payload.create({
    collection: 'comment-verification-tokens',
    overrideAccess: true,
    data: {
      email: normalizedEmail,
      token,
      expiresAt,
      verified: false,
    },
  })

  // Send verification email
  const baseUrl = getServerSideURL()
  const verifyUrl = `${baseUrl}/verify-comment-email?token=${token}`

  try {
    await payload.sendEmail({
      to: normalizedEmail,
      subject: 'Verify your email to post a comment',
      html: buildVerificationEmailHtml(verifyUrl),
    })
  } catch (err) {
    payload.logger.error(`[comment-verify] Failed to send verification email to ${normalizedEmail}: ${err}`)
    return { success: false, message: 'Failed to send verification email. Please try again.' }
  }

  return {
    success: true,
    message: 'Verification email sent! Please check your inbox and click the link.',
  }
}

function buildVerificationEmailHtml(verifyUrl: string): string {
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
    .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="content">
      <p><strong>Verify your email address</strong></p>
      <p>Click the button below to verify your email and post your comment. This link expires in 30 minutes.</p>
      <p><a href="${verifyUrl}" class="button">Verify Email</a></p>
      <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`
}

export async function submitComment(formData: FormData): Promise<SubmitCommentResult> {
  const authorName = formData.get('authorName') as string | null
  const authorEmail = formData.get('authorEmail') as string | null
  const body = formData.get('body') as string | null
  const postId = formData.get('postId') as string | null
  const parentId = formData.get('parentId') as string | null

  if (!authorName?.trim() || !authorEmail?.trim() || !body?.trim()) {
    return { success: false, message: 'Name, email, and comment are required.' }
  }

  if (body.length > 5000) {
    return { success: false, message: 'Comment must be under 5000 characters.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(authorEmail)) {
    return { success: false, message: 'Please enter a valid email address.' }
  }

  if (!postId) {
    return { success: false, message: 'Post not found.' }
  }

  const numericPostId = Number(postId)
  if (Number.isNaN(numericPostId)) {
    return { success: false, message: 'Post not found.' }
  }

  const payload = await getPayload({ config: configPromise })

  // Verify the email has been verified
  const now = new Date().toISOString()
  const normalizedEmail = authorEmail.trim().toLowerCase()

  const verifiedToken = await payload.find({
    collection: 'comment-verification-tokens',
    overrideAccess: true,
    where: {
      email: { equals: normalizedEmail },
      verified: { equals: true },
      expiresAt: { greater_than: now },
    },
    limit: 1,
  })

  if (verifiedToken.totalDocs === 0) {
    return {
      success: false,
      message: 'Please verify your email address before posting a comment.',
    }
  }

  // Verify post exists and has comments enabled
  let post
  try {
    post = await payload.findByID({
      collection: 'posts',
      id: numericPostId,
      overrideAccess: true,
    })
  } catch {
    return { success: false, message: 'Post not found.' }
  }

  if (post.enableComments === false) {
    return { success: false, message: 'Comments are disabled on this post.' }
  }

  // Validate parent comment for replies
  if (parentId) {
    try {
      const parentComment = await payload.findByID({
        collection: 'comments',
        id: Number(parentId),
        overrideAccess: true,
      })

      const parentPostId = typeof parentComment.post === 'object' ? parentComment.post.id : parentComment.post
      if (String(parentPostId) !== String(postId)) {
        return { success: false, message: 'Invalid reply target.' }
      }

      if ((parentComment.depth || 0) >= 3) {
        return { success: false, message: 'Maximum reply depth reached.' }
      }
    } catch {
      return { success: false, message: 'Parent comment not found.' }
    }
  }

  // Rate limiting: max 5 comments per 10 minutes per IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const recentComments = await payload.find({
    collection: 'comments',
    overrideAccess: true,
    where: {
      ipAddress: { equals: ip },
      createdAt: { greater_than: tenMinutesAgo },
    },
    limit: 0,
  })

  if (recentComments.totalDocs >= 5) {
    return { success: false, message: 'Too many comments. Please wait a few minutes.' }
  }

  // Create the comment
  const comment = await payload.create({
    collection: 'comments',
    overrideAccess: true,
    data: {
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      body: body.trim(),
      post: numericPostId,
      ...(parentId ? { parent: Number(parentId) } : {}),
      ipAddress: ip,
    },
  })

  // Revalidate the post page if the comment was auto-approved
  if (comment.status === 'approved') {
    revalidatePath(`/posts/${post.slug}`)
  }

  const isApproved = comment.status === 'approved'
  return {
    success: true,
    message: isApproved
      ? 'Your comment has been posted!'
      : 'Your comment has been submitted and is awaiting moderation.',
  }
}
