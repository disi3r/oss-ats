'use client'

import type { DragEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CandidatePipelineState, ProcessView } from '@/types/recruitment'

type KanbanBoardProps = {
  processId: string
  currentUserId: string
}

type ColumnDefinition = {
  stepId: string
  stepName: string
}

export const KanbanBoard = ({ processId, currentUserId }: KanbanBoardProps) => {
  const [processData, setProcessData] = useState<ProcessView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProcess = useCallback(
    async (showLoader = true) => {
      if (!currentUserId) {
        return
      }

      if (showLoader) {
        setIsLoading(true)
      }
      setError(null)
      try {
        const response = await fetch(`/api/processes/${processId}`, {
          headers: {
            'x-user-id': currentUserId,
          },
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch process data')
        }

        const data = await response.json()
        const normalized: ProcessView = {
          id: data.id,
          title: data.title,
          interviewPlan: Array.isArray(data.interviewPlan) ? data.interviewPlan : [],
          candidatesInProcess: (data.candidatesInProcess as Record<string, CandidatePipelineState>) ?? {},
          candidateAssignments: Array.isArray(data.candidateAssignments) ? data.candidateAssignments : [],
        }

        setProcessData(normalized)
      } catch (err) {
        console.error(err)
        setError('No fue posible cargar el proceso. Actualiza la página o inténtalo más tarde.')
      } finally {
        if (showLoader) {
          setIsLoading(false)
        }
      }
    },
    [currentUserId, processId],
  )

  useEffect(() => {
    if (currentUserId) {
      fetchProcess(true)
    }
  }, [fetchProcess, currentUserId])

  const interviewPlan = useMemo<ColumnDefinition[]>(() => {
    if (!processData) {
      return []
    }

    return processData.interviewPlan.map((step) => ({
      stepId: step.stepId,
      stepName: step.stepName,
    }))
  }, [processData])

  const candidatesByStep = useMemo(() => {
    if (!processData) {
      return {}
    }

    const state = processData.candidatesInProcess || {}
    const grouped: Record<string, string[]> = {}

    Object.entries(state).forEach(([candidateId, candidateState]) => {
      const targetStepId = (candidateState as CandidatePipelineState).currentStepId
      const bucket = targetStepId ?? 'unassigned'
      if (!grouped[bucket]) {
        grouped[bucket] = []
      }
      grouped[bucket].push(candidateId)
    })

    return grouped
  }, [processData])

  const candidateDetails = useMemo(() => {
    if (!processData) {
      return new Map<string, CandidatePipelineState>()
    }

    const state = processData.candidatesInProcess || {}
    return new Map(
      Object.entries(state).map(([candidateId, candidateState]) => [
        candidateId,
        candidateState as CandidatePipelineState,
      ]),
    )
  }, [processData])

  const candidateDirectory = useMemo(() => {
    if (!processData) {
      return new Map<string, string>()
    }

    return new Map(
      processData.candidateAssignments.map((assignment) => [
        assignment.candidate.id,
        assignment.candidate.fullName,
      ]),
    )
  }, [processData])

  const handleDrop = useCallback(
    async (candidateId: string, targetStepId: string) => {
      if (!candidateId || !currentUserId) {
        return
      }

      setIsSyncing(true)
      setError(null)

      try {
        const response = await fetch(`/api/processes/${processId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUserId,
          },
          credentials: 'include',
          body: JSON.stringify({
            candidateId,
            targetStepId,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update candidate position')
        }

        await fetchProcess(false)
      } catch (err) {
        console.error(err)
        setError('No se pudo actualizar el candidato. Inténtalo nuevamente.')
      } finally {
        setIsSyncing(false)
      }
    },
    [currentUserId, fetchProcess, processId],
  )

  if (!currentUserId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Iniciá sesión para ver y actualizar el tablero de entrevistas.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
        Cargando tablero de entrevistas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
        {error}
      </div>
    )
  }

  if (!processData) {
    return null
  }

  const onDragStart = (event: DragEvent<HTMLDivElement>, candidateId: string) => {
    event.dataTransfer.setData('candidateId', candidateId)
  }

  const buildColumn = (column: ColumnDefinition) => {
    const candidates = candidatesByStep[column.stepId] ?? []

    return (
      <div
        key={column.stepId}
        className="flex h-full min-h-[16rem] w-full flex-1 flex-col rounded-lg border border-slate-200 bg-slate-50"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const candidateId = event.dataTransfer.getData('candidateId')
          handleDrop(candidateId, column.stepId)
        }}
      >
        <header className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700">{column.stepName}</h3>
          <p className="text-xs text-slate-400">{candidates.length} candidatos</p>
        </header>
        <div className="flex flex-1 flex-col gap-3 p-4">
          {candidates.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-400">
              Arrastra aquí a un candidato
            </div>
          )}
          {candidates.map((candidateId) => {
            const candidateName = candidateDirectory.get(candidateId) ?? 'Candidato sin nombre'
            const candidateState = candidateDetails.get(candidateId)

            return (
              <div
                key={candidateId}
                className="cursor-move rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow"
                draggable
                onDragStart={(event) => onDragStart(event, candidateId)}
              >
                <p className="text-sm font-semibold text-slate-800">{candidateName}</p>
                {candidateState?.status && (
                  <p className="mt-1 text-xs uppercase tracking-wide text-indigo-500">{candidateState.status}</p>
                )}
                {candidateState?.updatedAt && (
                  <p className="mt-2 text-xs text-slate-400">
                    Actualizado {new Date(candidateState.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const unassignedCandidates = candidatesByStep['unassigned'] ?? []

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Tablero de entrevistas</h2>
          <p className="text-sm text-slate-500">Arrastra candidatos entre etapas para reflejar su avance.</p>
        </div>
        {isSyncing && <span className="text-xs text-slate-400">Sincronizando cambios...</span>}
      </header>

      <div className="flex gap-4">
        {interviewPlan.map((column) => buildColumn(column))}
      </div>

      {unassignedCandidates.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">Sin etapa asignada</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {unassignedCandidates.map((candidateId) => {
              const candidateName = candidateDirectory.get(candidateId) ?? 'Candidato sin nombre'
              return (
                <span
                  key={candidateId}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 shadow"
                  draggable
                  onDragStart={(event) => onDragStart(event, candidateId)}
                >
                  {candidateName}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
