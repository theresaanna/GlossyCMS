'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitComment } from '@/app/(frontend)/posts/[slug]/actions'

type CommentFormProps = {
  postId: string
  parentId?: string
  onSuccess?: () => void
}

export const CommentForm: React.FC<CommentFormProps> = ({ postId, parentId, onSuccess }) => {
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [body, setBody] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('commentAuthorName')
    const savedEmail = localStorage.getItem('commentAuthorEmail')
    if (savedName) setAuthorName(savedName)
    if (savedEmail) setAuthorEmail(savedEmail)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const formData = new FormData()
    formData.set('authorName', authorName)
    formData.set('authorEmail', authorEmail)
    formData.set('body', body)
    formData.set('postId', postId)
    if (parentId) formData.set('parentId', parentId)

    const result = await submitComment(formData)

    setMessage(result.message)
    setIsError(!result.success)
    setIsSubmitting(false)

    if (result.success) {
      localStorage.setItem('commentAuthorName', authorName)
      localStorage.setItem('commentAuthorEmail', authorEmail)
      setBody('')
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`name-${parentId || 'root'}`}>Name</Label>
          <Input
            id={`name-${parentId || 'root'}`}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`email-${parentId || 'root'}`}>Email</Label>
          <Input
            id={`email-${parentId || 'root'}`}
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`body-${parentId || 'root'}`}>Comment</Label>
        <Textarea
          id={`body-${parentId || 'root'}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder="Write your comment..."
          maxLength={5000}
        />
      </div>
      {message && (
        <p className={isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {message}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : parentId ? 'Reply' : 'Post Comment'}
      </Button>
    </form>
  )
}
