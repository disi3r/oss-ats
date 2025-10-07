import type { NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import type { AuthenticatedNextApiRequest } from '../_utils/auth'
import { ensureMethod, withApiAuth } from '../_utils/auth'
import { CandidateStatus, UserRole } from '@prisma/client'

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  if (!ensureMethod(req, res, ['POST'])) {
    return
  }

  const {
    fullName,
    title,
    email,
    phone,
    location,
    resumeText,
    status,
    metadata,
    history,
    currentProcessId,
  } = req.body as {
    fullName?: string
    title?: string
    email?: string
    phone?: string
    location?: string
    resumeText?: string
    status?: CandidateStatus
    metadata?: Record<string, unknown>
    history?: unknown
    currentProcessId?: string | null
  }

  if (!fullName) {
    return res.status(400).json({ error: 'fullName is required' })
  }

  const candidate = await prisma.candidate.create({
    data: {
      fullName,
      title: title ?? null,
      email: email ?? null,
      phone: phone ?? null,
      location: location ?? null,
      resumeText: resumeText ?? null,
      status: status ?? CandidateStatus.BACKLOG,
      metadata: metadata ?? {},
      history: history ?? [],
      currentProcessId: currentProcessId ?? null,
    },
  })

  return res.status(201).json(candidate)
}

export default withApiAuth([UserRole.RECRUITER, UserRole.MANAGER], handler)
