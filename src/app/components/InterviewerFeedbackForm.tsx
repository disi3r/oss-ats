'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { CandidateSummary } from '@/types/recruitment'

type InterviewerFeedbackFormProps = {
  processId: string
  candidateId: string
  stepId: string
  currentUserId: string
  onSubmitted?: () => void
}

type FeedbackPayload = {
  rating: number
  feedback: string
}

export const InterviewerFeedbackForm = ({
  processId,
  candidateId,
  stepId,
  currentUserId,
  onSubmitted,
}: InterviewerFeedbackFormProps) => {
  const [candidate, setCandidate] = useState<CandidateSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState<FeedbackPayload>({ rating: 3, feedback: '' })

  useEffect(() => {
    const fetchCandidate = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/candidates/${candidateId}`, {
          headers: {
            'x-user-id': currentUserId,
          },
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('Failed to load candidate')
        }

        const data = (await response.json()) as CandidateSummary
        setCandidate(data)
      } catch (error) {
        console.error(error)
        setStatusMessage('No fue posible cargar la información del candidato.')
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUserId) {
      fetchCandidate()
    }
  }, [candidateId, currentUserId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        credentials: 'include',
        body: JSON.stringify({
          processId,
          candidateId,
          stepId,
          rating: formData.rating,
          feedback: formData.feedback,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setStatusMessage('¡Gracias! Tu feedback fue registrado correctamente.')
      setFormData({ rating: 3, feedback: '' })
      onSubmitted?.()
    } catch (error) {
      console.error(error)
      setStatusMessage('Ocurrió un error al enviar el feedback. Inténtalo nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentUserId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Iniciá sesión como entrevistador para enviar feedback.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Cargando información del candidato...
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
        No se encontró el candidato solicitado.
      </div>
    )
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Feedback del entrevistador</h2>
        <p className="text-sm text-slate-500">
          Compartí tu evaluación para <span className="font-semibold">{candidate.fullName}</span>.
        </p>
      </header>

      <article className="mb-6 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-700">Resumen del perfil</p>
        {candidate.title && <p className="mt-1 text-slate-500">Rol objetivo: {candidate.title}</p>}
        {candidate.resumeText ? (
          <p className="mt-2 leading-relaxed text-slate-600">{candidate.resumeText}</p>
        ) : (
          <p className="mt-2 italic text-slate-400">La IA todavía está procesando el CV.</p>
        )}
      </article>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="rating">
            Calificación (1 - 5)
          </label>
          <input
            id="rating"
            type="number"
            min={1}
            max={5}
            value={formData.rating}
            onChange={(event) => setFormData((previous) => ({ ...previous, rating: Number(event.target.value) }))}
            className="w-24 rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="feedback">
            Feedback cualitativo
          </label>
          <textarea
            id="feedback"
            required
            rows={6}
            value={formData.feedback}
            onChange={(event) => setFormData((previous) => ({ ...previous, feedback: event.target.value }))}
            className="w-full rounded-md border border-slate-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Compartí tus observaciones, fortalezas y oportunidades de mejora."
          />
        </div>

        <div className="flex items-center justify-between">
          {statusMessage && <p className="text-sm text-slate-500">{statusMessage}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar feedback'}
          </button>
        </div>
      </form>
    </section>
  )
}
