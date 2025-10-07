import type { NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import type { AuthenticatedNextApiRequest } from '../_utils/auth'
import { ensureMethod, withApiAuth } from '../_utils/auth'

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  if (!ensureMethod(req, res, ['GET'])) {
    return
  }

  const {
    query: { id },
  } = req

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid candidate id' })
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id },
  })

  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' })
  }

  return res.status(200).json(candidate)
}

export default withApiAuth(null, handler)
