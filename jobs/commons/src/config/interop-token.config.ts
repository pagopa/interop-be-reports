export interface TokenGenerationConfig {
  kid: string
  subject: string
  issuer: string
  audience: string[]
  secondsDuration: number
}