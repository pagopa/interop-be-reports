import { Attribute as ReadModelAttribute } from '@interop-be-reports/commons'
import { z } from 'zod'

export const Attribute = ReadModelAttribute.pick({ id: true, name: true, description: true })

export type Attribute = z.infer<typeof Attribute>
