import type { NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import type { AuthenticatedNextApiRequest } from '../_utils/auth'
import { ensureMethod, withApiAuth } from '../_utils/auth'

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  if (!ensureMethod(req, res, ['GET', 'POST'])) {
    return
  }

  if (req.method === 'GET') {
    const context = await prisma.strategicContext.findUnique({ where: { id: 1 } })

    return res.status(200).json({
      strategicVision: context?.strategicVision ?? '',
      companyMission: context?.companyMission ?? '',
      coreValues: context?.coreValues ?? [],
      communicationTone: context?.communicationTone ?? '',
      updatedAt: context?.updatedAt ?? null,
    })
  }

  if (req.user.role !== 'RECRUITER') {
    return res.status(403).json({ error: 'Only recruiters can update the strategic context' })
  }

  const {
    strategicVision,
    companyMission,
    coreValues,
    communicationTone,
  } = req.body as {
    strategicVision: string
    companyMission: string
    coreValues: string[]
    communicationTone: string
  }

  if (!strategicVision || !companyMission || !communicationTone) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const sanitizedCoreValues = Array.isArray(coreValues)
    ? coreValues.filter((value) => value && value.trim().length > 0).map((value) => value.trim())
    : []

  const strategicContext = await prisma.strategicContext.upsert({
    where: { id: 1 },
    update: {
      strategicVision,
      companyMission,
      coreValues: sanitizedCoreValues,
      communicationTone,
    },
    create: {
      strategicVision,
      companyMission,
      coreValues: sanitizedCoreValues,
      communicationTone,
    },
  })

  return res.status(200).json(strategicContext)
}

export default withApiAuth(null, handler)
