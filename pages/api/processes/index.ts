import type { NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import type { AuthenticatedNextApiRequest } from '../_utils/auth'
import { ensureMethod, withApiAuth } from '../_utils/auth'
import { UserRole } from '@prisma/client'

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  if (!ensureMethod(req, res, ['POST'])) {
    return
  }

  const {
    title,
    jobDescription,
    ownerId,
    collaboratorIds,
    interviewPlan,
    candidatesInProcess,
    interviewFeedback,
    hiredCandidateId,
  } = req.body as {
    title?: string
    jobDescription?: string
    ownerId?: string
    collaboratorIds?: string[]
    interviewPlan?: unknown
    candidatesInProcess?: unknown
    interviewFeedback?: unknown
    hiredCandidateId?: string | null
  }

  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  const process = await prisma.process.create({
    data: {
      title,
      jobDescription: jobDescription ?? null,
      ownerId: ownerId ?? req.user.id,
      collaboratorIds: collaboratorIds ?? [],
      interviewPlan: interviewPlan ?? [],
      candidatesInProcess: candidatesInProcess ?? {},
      interviewFeedback: interviewFeedback ?? {},
      hiredCandidateId: hiredCandidateId ?? null,
    },
  })

  return res.status(201).json(process)
}

export default withApiAuth([UserRole.RECRUITER, UserRole.MANAGER], handler)
