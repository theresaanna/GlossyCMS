import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Comment } from '@/payload-types'

import { CommentThread } from './CommentThread'
import { CommentForm } from './CommentForm'
import type { CommentNode } from './CommentThread'

type CommentsSectionProps = {
  postId: string
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>()
  const roots: CommentNode[] = []

  for (const comment of comments) {
    map.set(String(comment.id), {
      id: String(comment.id),
      authorName: comment.authorName,
      body: comment.body,
      depth: comment.depth || 0,
      createdAt: comment.createdAt,
      children: [],
    })
  }

  for (const comment of comments) {
    const node = map.get(String(comment.id))!
    const parentId = typeof comment.parent === 'object' ? comment.parent?.id : comment.parent

    if (parentId && map.has(String(parentId))) {
      map.get(String(parentId))!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
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
