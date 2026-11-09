export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-10-08'

// Public DhilTrip configuration; deployments can override it with environment variables.
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'packages'
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'rsnabcto'
