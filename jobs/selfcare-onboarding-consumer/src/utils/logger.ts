// TODO Logging must be improved with proper libraries. Delayed until we decide a common approach

const timestamp = (): string => new Date().toISOString()

export const info = (correlationId: string, message: string): void =>
  console.log(`${timestamp()} INFO [CID=${correlationId}] ${message}`)

export const warn = (correlationId: string, message: string): void =>
  console.log(`${timestamp()} WARN [CID=${correlationId}] ${message}`)

export const error = (correlationId: string, message: string): void =>
  console.log(`${timestamp()} ERROR [CID=${correlationId}] ${message}`)
