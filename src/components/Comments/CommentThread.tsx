'use client'

import React, { useEffect, useState } from 'react'
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
  const [highlighted, setHighlighted] = useState(false)
  const anchorId = `comment-${comment.id}`

  useEffect(() => {
    if (window.location.hash === `#${anchorId}`) {
      const el = document.getElementById(anchorId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlighted(true)
        const timer = setTimeout(() => setHighlighted(false), 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [anchorId])

  const date = new Date(comment.createdAt)
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      id={anchorId}
      className={`${comment.depth > 0 ? 'ml-6 border-l border-border pl-4' : ''} transition-colors duration-700 ${highlighted ? 'bg-accent/50' : ''}`}
    >
      <div className="py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.authorName}</span>
          <a
            href={`#${anchorId}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {formattedDate}
          </a>
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
