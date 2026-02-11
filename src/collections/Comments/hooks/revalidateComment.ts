import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Comment } from '../../../payload-types'

async function getPostSlug(
  postField: Comment['post'],
  payload: any,
): Promise<string | null> {
  const postId = typeof postField === 'object' ? postField.id : postField
  if (!postId) return null

  try {
    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      overrideAccess: true,
      select: { slug: true },
    })
    return post?.slug || null
  } catch {
    return null
  }
}

export const revalidateComment: CollectionAfterChangeHook<Comment> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  const isNowApproved = doc.status === 'approved'
  const wasApproved = previousDoc?.status === 'approved'

  // Revalidate when a comment becomes approved or stops being approved
  if (isNowApproved || wasApproved) {
    const slug = await getPostSlug(doc.post, payload)
    if (slug) {
      const path = `/posts/${slug}`
      payload.logger.info(`Revalidating post at path: ${path} (comment ${doc.id} ${isNowApproved ? 'approved' : 'unapproved'})`)
      revalidatePath(path)
    }
  }

  return doc
}

export const revalidateCommentDelete: CollectionAfterDeleteHook<Comment> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  if (doc?.status === 'approved') {
    const slug = await getPostSlug(doc.post, payload)
    if (slug) {
      const path = `/posts/${slug}`
      payload.logger.info(`Revalidating post at path: ${path} (comment ${doc.id} deleted)`)
      revalidatePath(path)
    }
  }

  return doc
}
