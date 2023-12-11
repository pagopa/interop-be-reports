import { ExternalId } from '@interop-be-reports/commons'
import { CsvRow } from './csv-row.model.js'

export type BatchParseResult = {
  processedRecordsCount: number
  records: CsvRow[]
}

export type AttributeIdentifiers = {
  id: string
  externalId: ExternalId
}

export type IvassAttributes = {
  ivassInsurances: AttributeIdentifiers
}
