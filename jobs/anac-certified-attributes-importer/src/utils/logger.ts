// TODO Logging must be improved with proper libraries. Delayed until we decide a common approach

const timestamp = () => new Date().toISOString()

export const info = (correlationId: string, message: string) : void => console.log(`${timestamp()} INFO [CID=${correlationId}] ${message}`)

export const warn = (correlationId: string, message: string) : void => console.log(`${timestamp()} WARN [CID=${correlationId}] ${message}`)

export const error = (correlationId: string, message: string, reason: any | undefined = undefined) : void => console.error(`${timestamp()} ERROR [CID=${correlationId}] ${message}`, reason)
