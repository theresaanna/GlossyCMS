import type { CollectionBeforeValidateHook } from 'payload'
import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  SUBDOMAIN_MIN_LENGTH,
  SUBDOMAIN_MAX_LENGTH,
} from '../constants'

export const validateSubdomain: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data?.subdomain) return data

  // Normalize: lowercase and trim
  const subdomain = data.subdomain.toLowerCase().trim()
  data.subdomain = subdomain

  // Only validate on create, or on update if subdomain changed
  if (operation === 'update' && originalDoc?.subdomain === subdomain) {
    return data
  }

  // Length check
  if (subdomain.length < SUBDOMAIN_MIN_LENGTH || subdomain.length > SUBDOMAIN_MAX_LENGTH) {
    throw new Error(
      `Subdomain must be between ${SUBDOMAIN_MIN_LENGTH} and ${SUBDOMAIN_MAX_LENGTH} characters.`,
    )
  }

  // Format check
  if (!SUBDOMAIN_REGEX.test(subdomain)) {
    throw new Error(
      'Subdomain can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.',
    )
  }

  // Reserved words check
  if ((RESERVED_SUBDOMAINS as readonly string[]).includes(subdomain)) {
    throw new Error(`The subdomain "${subdomain}" is reserved and cannot be used.`)
  }

  // Uniqueness check
  const existing = await req.payload.find({
    collection: 'provisioned-sites',
    overrideAccess: true,
    where: {
      subdomain: { equals: subdomain },
    },
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    // Allow if the existing doc is the same one being updated
    const existingDoc = existing.docs[0]
    if (operation === 'update' && existingDoc && existingDoc.id === originalDoc?.id) {
      return data
    }
    throw new Error(`The subdomain "${subdomain}" is already taken.`)
  }

  return data
}
