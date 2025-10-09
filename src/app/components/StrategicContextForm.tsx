'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { StrategicContextPayload } from '@/types/recruitment'

type StrategicContextFormProps = {
  currentUserId: string
}

const emptyContext: StrategicContextPayload = {
  strategicVision: '',
  companyMission: '',
  coreValues: [],
  communicationTone: '',
}

export const StrategicContextForm = ({ currentUserId }: StrategicContextFormProps) => {
  const [formValues, setFormValues] = useState(emptyContext)
  const [coreValuesInput, setCoreValuesInput] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const response = await fetch('/api/context', {
          headers: {
            'x-user-id': currentUserId,
          },
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('Failed to load strategic context')
        }

        const data = (await response.json()) as StrategicContextPayload
        setFormValues(data)
        setCoreValuesInput(data.coreValues.join('\n'))
      } catch (error) {
        console.error(error)
        setStatusMessage('No se pudo cargar el contexto estratégico actual.')
      }
    }

    if (currentUserId) {
      fetchContext()
    }
  }, [currentUserId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatusMessage(null)

    const payload: StrategicContextPayload = {
      strategicVision: formValues.strategicVision,
      companyMission: formValues.companyMission,
      communicationTone: formValues.communicationTone,
      coreValues: coreValuesInput
        .split('\n')
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    }

    try {
      const response = await fetch('/api/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save strategic context')
      }

      setFormValues(payload)
      setStatusMessage('Contexto estratégico actualizado correctamente.')
    } catch (error) {
      console.error(error)
      setStatusMessage('No fue posible guardar el contexto. Inténtalo nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentUserId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Iniciá sesión para editar el contexto estratégico.
      </div>
    )
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Contexto Estratégico</h2>
        <p className="mt-1 text-sm text-slate-500">
          Define la visión, misión, valores y tono que guiarán todas las automatizaciones de IA.
        </p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="strategicVision">
            Visión estratégica
          </label>
          <textarea
            id="strategicVision"
            className="w-full rounded-md border border-slate-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            rows={3}
            value={formValues.strategicVision}
            onChange={(event) =>
              setFormValues((previous) => ({ ...previous, strategicVision: event.target.value }))
            }
            placeholder="Ser líderes en..."
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="companyMission">
            Misión de la empresa
          </label>
          <textarea
            id="companyMission"
            className="w-full rounded-md border border-slate-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            rows={3}
            value={formValues.companyMission}
            onChange={(event) =>
              setFormValues((previous) => ({ ...previous, companyMission: event.target.value }))
            }
            placeholder="Nuestra misión es..."
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="coreValues">
            Valores fundamentales
          </label>
          <textarea
            id="coreValues"
            className="w-full rounded-md border border-slate-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            rows={4}
            value={coreValuesInput}
            onChange={(event) => setCoreValuesInput(event.target.value)}
            placeholder={'Innovación\nEnfoque en el cliente\nTransparencia'}
          />
          <p className="mt-1 text-xs text-slate-400">Ingresa un valor por línea.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="communicationTone">
            Tono de comunicación
          </label>
          <input
            id="communicationTone"
            className="w-full rounded-md border border-slate-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            value={formValues.communicationTone}
            onChange={(event) =>
              setFormValues((previous) => ({ ...previous, communicationTone: event.target.value }))
            }
            placeholder="Cercano y profesional"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar contexto'}
          </button>
        </div>
      </form>
    </section>
  )
}
