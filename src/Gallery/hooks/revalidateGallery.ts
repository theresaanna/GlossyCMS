import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'
import { revalidatePath } from 'next/cache'

export const revalidateGallery: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating gallery settings`)

    revalidateTag('global_gallery-settings', 'max')
    revalidatePath('/gallery')
  }

  return doc
}
