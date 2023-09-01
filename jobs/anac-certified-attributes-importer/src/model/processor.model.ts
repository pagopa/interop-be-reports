import { CsvRow, PersistentExternalId } from "./index.js"

export type BatchParseResult = {
  processedRecordsCount: number
  records: CsvRow[]
}

export type AttributeIdentifiers = {
  id: string
  externalId: PersistentExternalId
}

export type AnacAttributes = {
  anacAbilitato: AttributeIdentifiers,
  anacInConvalida: AttributeIdentifiers,
  anacIncaricato: AttributeIdentifiers
}
