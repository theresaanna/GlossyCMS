'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  submitComment,
  requestCommentVerification,
} from '@/app/(frontend)/posts/[slug]/actions'

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
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('commentAuthorName')
    const savedEmail = localStorage.getItem('commentAuthorEmail')
    if (savedName) setAuthorName(savedName)
    if (savedEmail) setAuthorEmail(savedEmail)
  }, [])

  async function handleVerifyEmail() {
    if (!authorEmail?.trim()) {
      setMessage('Please enter your email address first.')
      setIsError(true)
      return
    }

    setIsSendingVerification(true)
    setMessage('')

    const result = await requestCommentVerification(authorEmail)

    setMessage(result.message)
    setIsError(!result.success)
    setIsSendingVerification(false)

    if (result.success) {
      if (result.message === 'Your email is already verified.') {
        setEmailVerified(true)
      } else {
        setVerificationSent(true)
      }
    }
  }

  async function handleCheckVerification() {
    setIsSendingVerification(true)
    setMessage('')

    // Re-request verification to check status — the server action returns
    // "Your email is already verified." when the token has been clicked.
    const result = await requestCommentVerification(authorEmail)

    setIsSendingVerification(false)

    if (result.success && result.message === 'Your email is already verified.') {
      setEmailVerified(true)
      setMessage('Email verified! You can now post your comment.')
      setIsError(false)
    } else {
      setMessage('Email not yet verified. Please check your inbox and click the verification link.')
      setIsError(true)
    }
  }

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
          <div className="flex gap-2">
            <Input
              id={`email-${parentId || 'root'}`}
              type="email"
              value={authorEmail}
              onChange={(e) => {
                setAuthorEmail(e.target.value)
                setEmailVerified(false)
                setVerificationSent(false)
              }}
              required
              placeholder="your@email.com"
              disabled={emailVerified}
            />
            {!emailVerified && !verificationSent && (
              <Button
                type="button"
                variant="outline"
                onClick={handleVerifyEmail}
                disabled={isSendingVerification}
                className="shrink-0"
              >
                {isSendingVerification ? 'Sending...' : 'Verify'}
              </Button>
            )}
            {!emailVerified && verificationSent && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckVerification}
                disabled={isSendingVerification}
                className="shrink-0"
              >
                {isSendingVerification ? 'Checking...' : "I've verified"}
              </Button>
            )}
            {emailVerified && (
              <span className="inline-flex items-center text-sm text-green-600 shrink-0 px-2">
                ✓ Verified
              </span>
            )}
          </div>
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
      <Button type="submit" disabled={isSubmitting || !emailVerified}>
        {isSubmitting ? 'Submitting...' : parentId ? 'Reply' : 'Post Comment'}
      </Button>
      {!emailVerified && (
        <p className="text-sm text-muted-foreground">
          You must verify your email before posting a comment.
        </p>
      )}
    </form>
  )
}
