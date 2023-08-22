import { InteropTokenGenerator } from "../../index.js"
import { RefreshableInteropToken } from "../refreshable-interop-token.service.js"
import { futureTimestamp, generateInternalTokenMock, interopToken, nearExpirationTimestamp, pastTimestamp, tokenConfig } from "./helpers.js"

describe('Refreshable Interop Token', () => {

  const tokenGeneratorMock = new InteropTokenGenerator(tokenConfig)

  const generateInternalTokenSpy = vi.spyOn(tokenGeneratorMock, 'generateInternalToken').mockImplementation(generateInternalTokenMock)

  afterEach(() => {
    vitest.clearAllMocks()
  })

  it('should init a token', async () => {

    await new RefreshableInteropToken(tokenGeneratorMock).init()

    expect(generateInternalTokenSpy).toBeCalledTimes(1)

  })

  it('should init a token with the first get', async () => {

    await new RefreshableInteropToken(tokenGeneratorMock).get()

    expect(generateInternalTokenSpy).toBeCalledTimes(1)

  })

  it('should not generate a token if the current is not expired', async () => {

    const refreshableInteropToken = new RefreshableInteropToken(tokenGeneratorMock)

    generateInternalTokenSpy.mockImplementationOnce(() => Promise.resolve({ ...interopToken, payload: { ...interopToken.payload, exp: futureTimestamp() } }))

    await refreshableInteropToken.init()
    await refreshableInteropToken.get()

    expect(generateInternalTokenSpy).toBeCalledTimes(1)

  })

  it('should generate a token if the current is expired', async () => {

    const refreshableInteropToken = new RefreshableInteropToken(tokenGeneratorMock)

    generateInternalTokenSpy.mockImplementationOnce(() => Promise.resolve({ ...interopToken, payload: { ...interopToken.payload, exp: pastTimestamp() } }))

    await refreshableInteropToken.init()
    await refreshableInteropToken.get()

    expect(generateInternalTokenSpy).toBeCalledTimes(2)

  })

  it('should generate a token if the current is near expiration', async () => {

    const refreshableInteropToken = new RefreshableInteropToken(tokenGeneratorMock)

    generateInternalTokenSpy.mockImplementationOnce(() => Promise.resolve({ ...interopToken, payload: { ...interopToken.payload, exp: nearExpirationTimestamp() } }))

    await refreshableInteropToken.init()
    await refreshableInteropToken.get()

    expect(generateInternalTokenSpy).toBeCalledTimes(2)

  })

})