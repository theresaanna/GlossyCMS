import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'

type Args = {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyCommentEmailPage({ searchParams }: Args) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-semibold mb-4">Invalid Link</h1>
        <p className="text-muted-foreground">No verification token provided.</p>
      </div>
    )
  }

  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  // Find the token
  const tokenResult = await payload.find({
    collection: 'comment-verification-tokens',
    overrideAccess: true,
    where: {
      token: { equals: token },
    },
    limit: 1,
  })

  const tokenDoc = tokenResult.docs[0]

  if (!tokenDoc) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-semibold mb-4">Invalid Link</h1>
        <p className="text-muted-foreground">
          This verification link is not valid. Please request a new one.
        </p>
      </div>
    )
  }

  if (tokenDoc.expiresAt < now) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-semibold mb-4">Link Expired</h1>
        <p className="text-muted-foreground">
          This verification link has expired. Please request a new one.
        </p>
      </div>
    )
  }

  if (tokenDoc.verified) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-semibold mb-4">Already Verified</h1>
        <p className="text-muted-foreground">
          Your email has already been verified. You can close this tab and post your comment.
        </p>
        <Link href="/" className="text-primary underline mt-4 inline-block">
          Go to homepage
        </Link>
      </div>
    )
  }

  // Mark as verified
  await payload.update({
    collection: 'comment-verification-tokens',
    id: tokenDoc.id,
    overrideAccess: true,
    data: {
      verified: true,
    },
  })

  return (
    <div className="container py-20 text-center">
      <h1 className="text-2xl font-semibold mb-4">Email Verified!</h1>
      <p className="text-muted-foreground">
        Your email has been verified. You can close this tab and post your comment.
      </p>
      <Link href="/" className="text-primary underline mt-4 inline-block">
        Go to homepage
      </Link>
    </div>
  )
}
