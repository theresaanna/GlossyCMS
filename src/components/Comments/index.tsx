import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { CommentThread } from './CommentThread'
import { CommentForm } from './CommentForm'
import { buildCommentTree } from './buildCommentTree'

type CommentsSectionProps = {
  postId: string
}

export const CommentsSection: React.FC<CommentsSectionProps> = async ({ postId }) => {
  const payload = await getPayload({ config: configPromise })

  const { docs: comments } = await payload.find({
    collection: 'comments',
    where: {
      post: { equals: postId },
    },
    sort: 'createdAt',
    limit: 500,
    overrideAccess: false,
    depth: 0,
  })

  const tree = buildCommentTree(comments)
  const count = comments.length

  return (
    <div className="max-w-[48rem] mx-auto mt-12 border-t border-border pt-8">
      <h2 className="text-xl font-semibold mb-6">
        {count === 0 ? 'Leave a Comment' : `Comments (${count})`}
      </h2>

      {tree.length > 0 && (
        <div className="mb-8 divide-y divide-border">
          {tree.map((comment) => (
            <CommentThread key={comment.id} comment={comment} postId={postId} />
          ))}
        </div>
      )}

      <CommentForm postId={postId} />
    </div>
  )
}
