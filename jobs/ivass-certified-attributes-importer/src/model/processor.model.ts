import { CsvRow } from './csv-row.model.js'
import { PersistentExternalId } from './tenant.model.js'

export type BatchParseResult = {
  processedRecordsCount: number
  records: CsvRow[]
}

export type AttributeIdentifiers = {
  id: string
  externalId: PersistentExternalId
}

export type IvassAttributes = {
  ivassInsurances: AttributeIdentifiers
}
