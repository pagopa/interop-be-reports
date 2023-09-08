import {
  InteropToken,
  MAX_EXP_SECONDS_DELAY_BEFORE_REFRESH,
  TokenGenerationConfig,
} from '../../index.js'

export const tokenConfig: TokenGenerationConfig = {
  kid: 'a-kid',
  subject: 'the-subject',
  issuer: 'the-issuer',
  audience: ['aud1', 'aud2'],
  secondsDuration: 100,
}

export const generateInternalTokenMock = (): Promise<InteropToken> => Promise.resolve(interopToken)

export const interopToken: InteropToken = {
  header: {
    alg: 'algorithm',
    use: 'use',
    typ: 'type',
    kid: 'key-id',
  },
  payload: {
    jti: 'token-id',
    iss: 'issuer',
    aud: ['audience1'],
    sub: 'subject',
    iat: 0,
    nbf: 0,
    exp: 10,
    role: 'role1',
  },
  serialized: 'the-token',
}

export const futureTimestamp = (): number => Date.now() / 1000 + 10000
export const pastTimestamp = (): number => Date.now() / 1000 - 10000
export const nearExpirationTimestamp = (): number =>
  Date.now() / 1000 + MAX_EXP_SECONDS_DELAY_BEFORE_REFRESH / 2
