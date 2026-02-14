import type { CollectionBeforeChangeHook } from 'payload'

export const setSubscriptionDates: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  if (operation === 'create') {
    data.subscribedAt = new Date().toISOString()
    return data
  }

  if (operation === 'update' && originalDoc) {
    const statusChanged = data.status !== undefined && data.status !== originalDoc.status

    if (statusChanged) {
      if (data.status === 'unsubscribed') {
        data.unsubscribedAt = new Date().toISOString()
      } else if (data.status === 'subscribed') {
        data.unsubscribedAt = null
        data.subscribedAt = new Date().toISOString()
      }
    }
  }

  return data
}
