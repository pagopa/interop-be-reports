import { InteropToken, TokenGenerationConfig } from "@interop-be-reports/commons"
import { SelfcareTenantSeed, SelfcareUpsertTenantResponse } from "../model/tenant-process.models.js"
import { InteropContext } from "../model/InteropContext.js"
import { MessageSetEntry } from "kafkajs"

export const interopProductName = "test-interop-product"

export const interopToken: InteropToken = {
  header: {
    alg: '',
    use: '',
    typ: '',
    kid: '',
  },
  payload: {
    jti: '',
    iss: '',
    aud: [''],
    sub: '',
    iat: 0,
    nbf: 0,
    exp: 10,
    role: '',
  },
  serialized: 'the-token',
}
export const selfcareUpsertTenantMock = (seed: SelfcareTenantSeed, context: InteropContext): Promise<SelfcareUpsertTenantResponse> => Promise.resolve({ id: "tenant-id" })
export const generateInternalTokenMock = (): Promise<InteropToken> => Promise.resolve(interopToken)

export const tokenConfig: TokenGenerationConfig = {
  kid: 'a-kid',
  subject: 'the-subject',
  issuer: 'the-issuer',
  audience: ['aud1', 'aud2'],
  secondsDuration: 100
}

const correctSelfcareInstitutionMessage = {
  "id": "cfb4f57f-8d93-4e30-8c87-37a29c3c6dac",
  "internalIstitutionID": "b730fbb7-fffe-4090-a3ea-53ee7e07a4b9",
  "product": interopProductName,
  "state": "ACTIVE",
  "fileName": "",
  "contentType": "application/json",
  "onboardingTokenId": "8e73950f-b51d-46df-92a1-057907f2cb98",
  "institution": {
    "institutionType": "PA",
    "description": "Somewhere",
    "digitalAddress": "somewhere@wonderland",
    "address": "Piazza Cavicchioni, 8",
    "taxCode": "12345678987",
    "origin": "IPA",
    "originId": "ipa_code",
    "zipCode": "12345",
    "paymentServiceProvider": null,
    "istatCode": "123456",
    "city": "somewhere",
    "country": "wonderland",
    "county": "WL",
    "subUnitCode": null,
    "subUnitType": null,
    "rootParent": {
      "id": null,
      "description": null
    }
  },
  "billing": {
    "vatNumber": "12345678987",
    "recipientCode": "11111",
    "publicServices": false
  },
  "createdAt": "2023-08-04T09:08:09.723118Z",
  "updatedAt": "2023-08-04T09:08:09.723137Z",
  "notificationType": "ADD"
}

export const kafkaMessage: MessageSetEntry = {
  key: Buffer.from('kafka-message-key'),
  value: Buffer.from(JSON.stringify(correctSelfcareInstitutionMessage)),
  timestamp: "0",
  attributes: 0,
  offset: "10",
  size: 100
}

export const selfcareUpsertTenantSeed = {
  externalId: { origin: correctSelfcareInstitutionMessage.institution.origin, value: correctSelfcareInstitutionMessage.institution.originId },
  selfcareId: correctSelfcareInstitutionMessage.internalIstitutionID,
  name: correctSelfcareInstitutionMessage.institution.description
}

export const serviceInvocationContext = {
  correlationId: 'cid',
  bearerToken: interopToken.serialized
}
