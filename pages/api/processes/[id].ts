import type { NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import type { AuthenticatedNextApiRequest } from '../_utils/auth'
import { ensureMethod, withApiAuth } from '../_utils/auth'
import { CandidateStatus } from '@prisma/client'

type CandidateProcessState = {
  currentStepId: string
  status: string
  updatedAt: string
}

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  if (!ensureMethod(req, res, ['GET', 'PUT'])) {
    return
  }

  const {
    query: { id },
  } = req

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid process id' })
  }

  if (req.method === 'GET') {
    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        candidateAssignments: {
          include: {
            candidate: true,
          },
        },
        owner: true,
      },
    })

    if (!process) {
      return res.status(404).json({ error: 'Process not found' })
    }

    return res.status(200).json(process)
  }

  if (req.user.role === 'INTERVIEWER') {
    return res.status(403).json({ error: 'Interviewers cannot update processes' })
  }

  const {
    candidateId,
    targetStepId,
    candidateStatus,
    interviewPlan,
    candidatesInProcess,
    interviewFeedback,
    stage,
  } = req.body as {
    candidateId?: string
    targetStepId?: string
    candidateStatus?: CandidateStatus | string
    interviewPlan?: unknown
    candidatesInProcess?: unknown
    interviewFeedback?: unknown
    stage?: number
  }

  const updateData: Record<string, unknown> = {}

  if (typeof stage === 'number') {
    updateData.stage = stage
  }

  if (typeof interviewPlan !== 'undefined') {
    updateData.interviewPlan = interviewPlan
  }

  if (typeof candidatesInProcess !== 'undefined') {
    updateData.candidatesInProcess = candidatesInProcess
  }

  if (typeof interviewFeedback !== 'undefined') {
    updateData.interviewFeedback = interviewFeedback
  }

  if (candidateId && targetStepId) {
    const process = await prisma.process.findUnique({ where: { id } })

    if (!process) {
      return res.status(404).json({ error: 'Process not found' })
    }

    const state = (process.candidatesInProcess as Record<string, CandidateProcessState>) ?? {}

    state[candidateId] = {
      ...(state[candidateId] ?? { status: 'Active' }),
      currentStepId: targetStepId,
      status: (candidateStatus as string | undefined) ?? state[candidateId]?.status ?? 'Active',
      updatedAt: new Date().toISOString(),
    }

    updateData.candidatesInProcess = state

    if (candidateStatus && Object.values(CandidateStatus).includes(candidateStatus as CandidateStatus)) {
      const candidateRecord = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { history: true },
      })

      if (candidateRecord) {
        const historyEntries = Array.isArray(candidateRecord.history) ? [...candidateRecord.history] : []

        historyEntries.push({
          type: 'statusChange',
          processId: id,
          status: candidateStatus,
          occurredAt: new Date().toISOString(),
        })

        await prisma.candidate.update({
          where: { id: candidateId },
          data: {
            status: candidateStatus as CandidateStatus,
            history: historyEntries,
          },
        })
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' })
  }

  const updatedProcess = await prisma.process.update({
    where: { id },
    data: updateData,
  })

  return res.status(200).json(updatedProcess)
}

export default withApiAuth(null, handler)
