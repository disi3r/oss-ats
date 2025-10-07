export type StrategicContextPayload = {
  strategicVision: string
  companyMission: string
  coreValues: string[]
  communicationTone: string
}

export type InterviewPlanStep = {
  stepId: string
  stepName: string
  assignedUserId?: string | null
}

export type CandidatePipelineState = {
  currentStepId: string
  status: string
  updatedAt?: string
}

export type CandidateSummary = {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  title?: string | null
  status: string
  resumeText?: string | null
  history?: unknown
}

export type ProcessView = {
  id: string
  title: string
  interviewPlan: InterviewPlanStep[]
  candidatesInProcess: Record<string, CandidatePipelineState>
  candidateAssignments: {
    id: string
    candidate: CandidateSummary
  }[]
}
