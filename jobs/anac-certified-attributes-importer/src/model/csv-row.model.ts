import { z } from "zod";

export const PaRow = z.object({
  cf_gestore: z.string().min(1),
  denominazione: z.string().min(1),
  domicilio_digitale: z.string().min(1),
  codice_ipa: z.string().min(1),
  anac_incaricato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
  anac_abilitato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
  anac_in_convalida: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
});
export type PaRow = z.infer<typeof PaRow>

export const NonPaRow = z.object({
  cf_gestore: z.string().min(1),
  denominazione: z.string().min(1),
  domicilio_digitale: z.string().min(1),
  anac_incaricato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
  anac_abilitato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
  anac_in_convalida: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
});
export type NonPaRow = z.infer<typeof NonPaRow>

export const CsvRow = PaRow.or(NonPaRow)

export type CsvRow = z.infer<typeof CsvRow>
