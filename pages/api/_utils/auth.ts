import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import type { User, UserRole } from '@prisma/client'

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  user: User
}

const AUTH_COOKIE = 'ats-auth'

const respondWithError = (res: NextApiResponse, status: number, message: string) => {
  res.status(status).json({ error: message })
}

export const withApiAuth = (
  allowedRoles: UserRole[] | null,
  handler: (req: AuthenticatedNextApiRequest, res: NextApiResponse) => Promise<unknown> | unknown,
): NextApiHandler => {
  return async (req, res) => {
    try {
      if (!req.cookies?.[AUTH_COOKIE]) {
        return respondWithError(res, 401, 'Unauthenticated request')
      }

      const userIdHeader = req.headers['x-user-id']
      const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader

      if (!userId) {
        return respondWithError(res, 401, 'Missing user context')
      }

      const user = await prisma.user.findUnique({ where: { id: userId } })

      if (!user) {
        return respondWithError(res, 403, 'User not found or unauthorized')
      }

      if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return respondWithError(res, 403, 'Insufficient permissions')
      }

      return handler(Object.assign(req, { user }) as AuthenticatedNextApiRequest, res)
    } catch (error) {
      console.error('API auth error', error)
      return respondWithError(res, 500, 'Internal server error')
    }
  }
}

export const ensureMethod = (req: NextApiRequest, res: NextApiResponse, methods: string[]) => {
  if (!methods.includes(req.method ?? '')) {
    res.setHeader('Allow', methods)
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return false
  }

  return true
}
