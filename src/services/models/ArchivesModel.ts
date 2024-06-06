export const StepIds = [
  "water",
  "migration",
  "butterfly",
  "conclusion"
] as const

export type StepId = typeof StepIds[number]