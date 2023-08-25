import { z } from "zod";

// export const CsvRow = z.object({
//   cf_gestore: z.string().min(1),
//   denominazione: z.string().min(1),
//   domicilio_digitale: z.string().min(1),
//   codice_IPA: z.string().optional().transform((value) => value === '' ? undefined : value),
//   anac_incaricato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
//   anac_abilitato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
// });

// export type CsvRow = z.infer<typeof CsvRow>

export const PaRow = z.object({
  cf_gestore: z.string().min(1),
  denominazione: z.string().min(1),
  domicilio_digitale: z.string().min(1),
  codice_IPA: z.string().min(1),
  anac_incaricato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
  anac_abilitato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
});
export type PaRow = z.infer<typeof PaRow>

export const NonPaRow = z.object({
  cf_gestore: z.string().min(1),
  denominazione: z.string().min(1),
  domicilio_digitale: z.string().min(1),
  anac_incaricato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
  anac_abilitato: z.string().transform((value) => value.toUpperCase() === 'TRUE'),
});
export type NonPaRow = z.infer<typeof NonPaRow>

// export const CsvRow = z.discriminatedUnion("codice_IPA", [
//   z.object({ codice_IPA: z.string().length(0).optional() }).transform(v => v.codice_IPA = undefined).merge(NonPaRow), 

//   // z.object({ codice_IPA: z.string().optional().length(0) }).merge(NonPaRow).transform(v => v.codice_IPA = undefined), //.omit({codice_IPA : true}) //
//   z.object({ codice_IPA: z.string().min(1) }).merge(PaRow),
// ]);

export const CsvRow = PaRow.or(NonPaRow)

export type CsvRow = z.infer<typeof CsvRow>
