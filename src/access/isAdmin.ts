import type { User } from '@/payload-types'

type IsAdmin = (args: { req: { user: User | null } } & Record<string, unknown>) => boolean

export const isAdmin: IsAdmin = ({ req: { user } }) => {
  return Boolean(user?.role === 'admin')
}
