'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

type SubmitCommentResult = {
  success: boolean
  message: string
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
