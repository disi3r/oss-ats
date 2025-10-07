import type { NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import type { AuthenticatedNextApiRequest } from './_utils/auth'
import { ensureMethod, withApiAuth } from './_utils/auth'
import { UserRole } from '@prisma/client'

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  if (!ensureMethod(req, res, ['POST'])) {
    return
  }

  const { processId, candidateId, stepId, rating, feedback } = req.body as {
    processId?: string
    candidateId?: string
    stepId?: string
    rating?: number
    feedback?: string
  }

  if (!processId || !candidateId || !stepId) {
    return res.status(400).json({ error: 'processId, candidateId and stepId are required' })
  }

  const process = await prisma.process.findUnique({ where: { id: processId } })

  if (!process) {
    return res.status(404).json({ error: 'Process not found' })
  }

  const feedbackRegistry = (process.interviewFeedback as Record<string, Record<string, unknown>>) ?? {}
  const candidateFeedback = (feedbackRegistry[candidateId] as Record<string, unknown>) ?? {}

  candidateFeedback[stepId] = {
    interviewerId: req.user.id,
    rating: rating ?? null,
    feedback: feedback ?? '',
    submittedAt: new Date().toISOString(),
  }

  feedbackRegistry[candidateId] = candidateFeedback

  await prisma.process.update({
    where: { id: processId },
    data: {
      interviewFeedback: feedbackRegistry,
    },
  })

  const candidateRecord = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { history: true },
  })

  if (candidateRecord) {
    const historyEntries = Array.isArray(candidateRecord.history) ? [...candidateRecord.history] : []

    historyEntries.push({
      type: 'interviewFeedback',
      processId,
      stepId,
      interviewerId: req.user.id,
      rating: rating ?? null,
      feedback: feedback ?? '',
      submittedAt: new Date().toISOString(),
    })

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { history: historyEntries },
    })
  }

  return res.status(201).json({ success: true })
}

export default withApiAuth([UserRole.INTERVIEWER], handler)
