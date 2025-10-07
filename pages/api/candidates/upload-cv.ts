import type { NextApiResponse } from 'next'
import { prisma } from '@/utils/db/prisma'
import type { AuthenticatedNextApiRequest } from '../_utils/auth'
import { ensureMethod, withApiAuth } from '../_utils/auth'
import { CandidateStatus, UserRole } from '@prisma/client'
import formidable, { type Fields, type Files } from 'formidable'
import fs from 'fs/promises'
import path from 'path'

type ParsedForm = {
  fields: Fields
  files: Files
}

const uploadDir = path.join(process.cwd(), 'tmp', 'uploads')

const parseMultipartForm = (req: AuthenticatedNextApiRequest): Promise<ParsedForm> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      uploadDir,
      keepExtensions: true,
      filename: (name, ext, part) => {
        const safeName = part.originalFilename ? part.originalFilename.replace(/\s+/g, '_') : 'cv.pdf'
        return `${Date.now()}-${safeName}`
      },
    })

    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error)
      } else {
        resolve({ fields, files })
      }
    })
  })
}

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  if (!ensureMethod(req, res, ['POST'])) {
    return
  }

  await fs.mkdir(uploadDir, { recursive: true })

  let parsed: ParsedForm

  try {
    parsed = await parseMultipartForm(req)
  } catch (error) {
    console.error('Failed to parse multipart form', error)
    return res.status(400).json({ error: 'Invalid upload payload' })
  }

  const fileEntry = Object.values(parsed.files)[0]

  if (!fileEntry) {
    return res.status(400).json({ error: 'CV file is required' })
  }

  const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry

  if (!file?.filepath) {
    return res.status(500).json({ error: 'Unable to access uploaded file' })
  }

  const storedFilePath = file.filepath
  const relativePath = path.relative(process.cwd(), storedFilePath)

  const candidate = await prisma.candidate.create({
    data: {
      fullName: (parsed.fields.fullName as string) || 'Perfil en procesamiento',
      email: (parsed.fields.email as string) || null,
      status: CandidateStatus.PROCESSING,
      cvFilePath: relativePath,
      history: [
        {
          type: 'cvUpload',
          uploadedBy: req.user.id,
          uploadedAt: new Date().toISOString(),
          filePath: relativePath,
        },
      ],
    },
  })

  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('N8N_WEBHOOK_URL is not configured; skipping webhook trigger')
  } else {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.N8N_WEBHOOK_TOKEN ?? '',
        },
        body: JSON.stringify({
          candidateId: candidate.id,
          cvFilePath: storedFilePath,
        }),
      })
    } catch (error) {
      console.error('Failed to notify n8n webhook', error)
    }
  }

  return res.status(202).json({
    candidateId: candidate.id,
    status: candidate.status,
  })
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default withApiAuth([UserRole.RECRUITER], handler)
