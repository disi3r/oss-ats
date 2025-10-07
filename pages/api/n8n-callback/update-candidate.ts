import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import { CandidateStatus } from '@prisma/client'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const apiKey = req.headers['x-api-key']
  const normalizedApiKey = Array.isArray(apiKey) ? apiKey[0] : apiKey

  if (!normalizedApiKey || normalizedApiKey !== process.env.N8N_CALLBACK_SECRET) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }

  const {
    candidateId,
    status,
    resumeText,
    parsedData,
    analysis,
  } = req.body as {
    candidateId?: string
    status?: CandidateStatus | string
    resumeText?: string
    parsedData?: Record<string, unknown>
    analysis?: Record<string, unknown>
  }

  if (!candidateId) {
    return res.status(400).json({ error: 'candidateId is required' })
  }

  const candidateRecord = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { history: true, metadata: true },
  })

  if (!candidateRecord) {
    return res.status(404).json({ error: 'Candidate not found' })
  }

  const historyEntries = Array.isArray(candidateRecord.history) ? [...candidateRecord.history] : []

  historyEntries.push({
    type: 'aiUpdate',
    occurredAt: new Date().toISOString(),
    payload: {
      status,
      parsedData,
      analysis,
    },
  })

  const metadata = {
    ...(candidateRecord.metadata as Record<string, unknown>),
    aiAnalysis: analysis ?? null,
    parsedData: parsedData ?? null,
  }

  const updateData: Record<string, unknown> = {
    history: historyEntries,
    metadata,
  }

  if (typeof resumeText === 'string') {
    updateData.resumeText = resumeText
  }

  if (status && Object.values(CandidateStatus).includes(status as CandidateStatus)) {
    updateData.status = status
  } else if (!status) {
    updateData.status = CandidateStatus.ACTIVE
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: updateData,
  })

  return res.status(200).json({ success: true })
}

export default handler
