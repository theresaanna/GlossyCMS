'use client'

import React, { useState } from 'react'
import { CommentForm } from './CommentForm'
import { ReplyButton } from './ReplyButton'

export type CommentNode = {
  id: string
  authorName: string
  body: string
  depth: number
  createdAt: string
  children: CommentNode[]
}

type CommentThreadProps = {
  comment: CommentNode
  postId: string
  maxDepth?: number
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  postId,
  maxDepth = 3,
}) => {
  const [replyOpen, setReplyOpen] = useState(false)

  const date = new Date(comment.createdAt)
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className={comment.depth > 0 ? 'ml-6 border-l border-border pl-4' : ''}>
      <div className="py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
        <div className="mt-2">
          {comment.depth < maxDepth && (
            <ReplyButton isOpen={replyOpen} onClick={() => setReplyOpen(!replyOpen)} />
          )}
        </div>
        {replyOpen && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSuccess={() => setReplyOpen(false)}
            />
          </div>
        )}
      </div>
      {comment.children.length > 0 && (
        <div>
          {comment.children.map((child) => (
            <CommentThread key={child.id} comment={child} postId={postId} maxDepth={maxDepth} />
          ))}
        </div>
      )}
    </div>
  )
}
