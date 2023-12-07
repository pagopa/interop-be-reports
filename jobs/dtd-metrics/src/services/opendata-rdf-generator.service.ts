import { env } from '../configs/env.js'
import { Metric, MetricName, TimedMetricKey } from '../models/metrics.model.js'
import { toSnakeCase } from '../utils/helpers.utils.js'

/**
 * skos:Concept
 */
type SkosConcept = {
  about: string
  prefLabel?: string
  lang?: string
}

/**
 * dcatapit:Organization
 */
type Organization = {
  name: string
  email?: string
  url?: string
}

const GITHUB_REPO_URL = `https://github.com/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO}/tree/main/data#`
const GITHUB_RAW_CONTENT_URL = `https://raw.githubusercontent.com/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO}/main/data`
const CHARTS_PAGE = `https://www.interop.pagopa.it/numeri`

const OPENDATA_RDF_METADATA = {
  TITLE: 'PDND - Interoperabilità',
  DESCRIPTION: 'Dati aperti relativi a PDND - Interoperabilità',
  ISSUED: '2021-09-01',
  MODIFIED: '2021-09-01',
} as const

const SKOS_CONCEPT = [] as const satisfies ReadonlyArray<SkosConcept>

const ORGANIZATION = {
  name: 'PagoPA S.p.A.',
  email: undefined,
  url: CHARTS_PAGE,
} as const satisfies Organization

type MetricFileKey = {
  [TMetricName in MetricName]: Extract<Metric, { name: TMetricName }>['data'] extends Record<TimedMetricKey, unknown>
    ? `${TMetricName}${Capitalize<TimedMetricKey>}`
    : TMetricName
}[MetricName]

type MetricFile = {
  fileKey: MetricFileKey
  filename: string
  title: string
  description: string
  rightsHolder: string
  publisherName: string
  keywords: ReadonlyArray<string>
  modified: string // yyyy-mm-gg
  issued: string // yyyy-mm-gg
}

const getFilename = (fileKey: MetricFileKey): string => toSnakeCase(fileKey)

const METRICS_FILES = [
  {
    fileKey: 'eservicesByMacroCategories',
    filename: getFilename('eservicesByMacroCategories'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'mostSubscribedEServicesLastSixMonths',
    filename: getFilename('mostSubscribedEServicesLastSixMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'mostSubscribedEServicesLastTwelveMonths',
    filename: getFilename('mostSubscribedEServicesLastTwelveMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'mostSubscribedEServicesFromTheBeginning',
    filename: getFilename('mostSubscribedEServicesFromTheBeginning'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'onboardedTenantsCount',
    filename: getFilename('onboardedTenantsCount'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'onboardedTenantsCountByMacroCategoriesLastSixMonths',
    filename: getFilename('onboardedTenantsCountByMacroCategoriesLastSixMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'onboardedTenantsCountByMacroCategoriesLastTwelveMonths',
    filename: getFilename('onboardedTenantsCountByMacroCategoriesLastTwelveMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'onboardedTenantsCountByMacroCategoriesFromTheBeginning',
    filename: getFilename('onboardedTenantsCountByMacroCategoriesFromTheBeginning'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'publishedEServices',
    filename: getFilename('publishedEServices'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'tenantDistribution',
    filename: getFilename('tenantDistribution'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'tenantSignupsTrendLastSixMonths',
    filename: getFilename('tenantSignupsTrendLastSixMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'tenantSignupsTrendLastTwelveMonths',
    filename: getFilename('tenantSignupsTrendLastTwelveMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'tenantSignupsTrendFromTheBeginning',
    filename: getFilename('tenantSignupsTrendFromTheBeginning'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'topProducersLastSixMonths',
    filename: getFilename('topProducersLastSixMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'topProducersLastTwelveMonths',
    filename: getFilename('topProducersLastTwelveMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'topProducersFromTheBeginning',
    filename: getFilename('topProducersFromTheBeginning'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'topProducersBySubscribersLastSixMonths',
    filename: getFilename('topProducersBySubscribersLastSixMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'topProducersBySubscribersLastTwelveMonths',
    filename: getFilename('topProducersBySubscribersLastTwelveMonths'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
  {
    fileKey: 'topProducersBySubscribersFromTheBeginning',
    filename: getFilename('topProducersBySubscribersFromTheBeginning'),
    title: 'TODO',
    description: 'TODO',
    rightsHolder: 'PagoPA S.p.A.',
    publisherName: 'PagoPA S.p.A.',
    keywords: ['TODO'],
    modified: 'TODO',
    issued: 'TODO',
  },
] as const satisfies ReadonlyArray<MetricFile>

export class MetricsOpenDataRdfGenerator {
  public produceOpenDataRDF(): string {
    return `
<?xml version="1.0" encoding="utf-8"?>
  <rdf:RDF xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:locn="http://www.w3.org/ns/locn#" xmlns:hydra="http://www.w3.org/ns/hydra/core#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dcat="http://www.w3.org/ns/dcat#" xmlns:dct="http://purl.org/dc/terms/" xmlns:dcatapit="http://dati.gov.it/onto/dcatapit#" xmlns:vcard="http://www.w3.org/2006/vcard/ns#" xmlns:adms="http://www.w3.org/ns/adms#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gsp="http://www.opengis.net/ont/geosparql#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
  ${this.produceRDFCatalog()}
  ${METRICS_FILES.map(this.produceRDFDataset).join('\n')}
  ${METRICS_FILES.map(this.produdeRDFDistribution).join('\n')}
  ${SKOS_CONCEPT.map(this.produceRDFConcept).join('\n')}
  ${this.produceRDFOrganization()}
</rdf:RDF>
`
  }

  private produceRDFCatalog(): string {
    return `
<dcatapit:Catalog rdf:about="${GITHUB_REPO_URL}">
  <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Catalog"/>
  <dct:title>${OPENDATA_RDF_METADATA.TITLE}</dct:title>
  <dct:publisher>
    <dcatapit:Agent rdf:about="mint">
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Organization"/>
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Agent"/>
      <dct:identifier>mint</dct:identifier>
      <foaf:name>${OPENDATA_RDF_METADATA.TITLE}</foaf:name>
    </dcatapit:Agent>
  </dct:publisher>
  <dct:description>${OPENDATA_RDF_METADATA.DESCRIPTION}</dct:description>
  <dct:language>it</dct:language>
  <foaf:homepage rdf:resource="${GITHUB_REPO_URL}"/>
  <dcat:themeTaxonomy>
    <skos:ConceptScheme rdf:about="http://publications.europa.eu/resource/authority/data-theme">
      <dct:title>Data Theme Vocabulary</dct:title>
    </skos:ConceptScheme>
  </dcat:themeTaxonomy>
  <dct:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${OPENDATA_RDF_METADATA.MODIFIED}</dct:modified>
  <dct:issued rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${OPENDATA_RDF_METADATA.ISSUED}</dct:issued>
  <dct:license rdf:resource="https://creativecommons.org/licenses/by/4.0/"/>
  ${METRICS_FILES.map(this.produceRDFCatalogDataset).join('\n')}
</dcatapit:Catalog>
  `
  }

  private produceRDFCatalogDataset({ filename }: MetricFile): string {
    return `<dcat:dataset rdf:resource="${GITHUB_REPO_URL}/${filename}"/>`
  }

  private produceRDFDataset(metricFile: MetricFile, index: number): string {
    const { fileKey, title, description, rightsHolder, publisherName, modified, issued, keywords } = metricFile

    return `
<dcatapit:Dataset rdf:about="${GITHUB_REPO_URL}/${fileKey}">
  <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Dataset"/>
  <dcat:theme rdf:resource="http://publications.europa.eu/resource/authority/data-theme/SOCI"/>
  <dct:license/>
  <dct:title>${title}</dct:title>
  <dct:landingpage>${GITHUB_REPO_URL}/${fileKey}</dct:landingpage>
  <dct:description>${description}</dct:description>
  <dct:identifier>mint:${fileKey}</dct:identifier>
  <dct:accrualPeriodicity rdf:resource="http://publications.europa.eu/resource/authority/frequency/DAILY"/>
  <dcat:contactPoint rdf:resource="${CHARTS_PAGE}"/>
  <dct:rightsHolder>
    <dcatapit:Agent rdf:about="mint">
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Agent"/>
      <dct:identifier>mint</dct:identifier>
      <foaf:name>${rightsHolder}</foaf:name>
    </dcatapit:Agent>
  </dct:rightsHolder>
  <dct:publisher>
    <dcatapit:Agent rdf:nodeID="Nd117aa7f2e7b47fb9481d4a8aca59c7d">
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Organization"/>
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Agent"/>
      <dct:identifier>mint</dct:identifier>
      <foaf:name>${publisherName}</foaf:name>
    </dcatapit:Agent>
  </dct:publisher>
  <dct:subject rdf:resource="http://eurovoc.europa.eu/100210"/>
  <dct:language rdf:resource="http://publications.europa.eu/resource/authority/language/ITA"/>
  <dct:license rdf:resource="https://creativecommons.org/licenses/by/4.0/"/>
  <dct:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${modified}</dct:modified>
  <dct:issued rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${issued}</dct:issued>
  <dcat:contactPoint rdf:resource="${CHARTS_PAGE}"/>
  ${keywords.map((keyword) => `<dcat:keyword>${keyword}</dcat:keyword>`).join('\n')}
  <dcat:distribution rdf:resource="${GITHUB_REPO_URL}/${fileKey}/csv${index + 2}"/>
  <dcat:distribution rdf:resource="${GITHUB_REPO_URL}/${fileKey}/json${index + 3}"/>
</dcatapit:Dataset>
    `
  }

  private produdeRDFDistribution(metricFile: MetricFile, index: number): string {
    const { fileKey, title, filename } = metricFile

    const csvfileUrl = encodeURIComponent(`${GITHUB_RAW_CONTENT_URL}/${filename}.csv`)
    const csvfileJSON = encodeURIComponent(`${GITHUB_RAW_CONTENT_URL}/${filename}.json`)

    return `
<dcatapit:Distribution rdf:about="${GITHUB_REPO_URL}/${fileKey}/csv${index + 2}">
  <dcat:accessURL rdf:resource="${csvfileUrl}"/>
  <dct:license>
    <dcatapit:LicenseDocument rdf:about="https://w3id.org/italia/controlled-vocabulary/licences/A11:CCO10">
      <rdf:type rdf:resource="dct:LicenseDocument"/>
      <dct:type rdf:resource="http://purl.org/adms/licencetype/Attribution"/>
      <foaf:name>Creative Commons CC0 1.0 Universale - Public Domain Dedication (CC0 1.0)</foaf:name>
    </dcatapit:LicenseDocument>
  </dct:license>
  <dct:format rdf:resource="CSV"/>
  <dct:description>File in formato CSV per l'interoperabilità</dct:description>
  <dct:title>${title} CSV</dct:title>
  <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Distribution"/>
</dcatapit:Distribution>
<dcatapit:Distribution rdf:about="${GITHUB_REPO_URL}/${fileKey}/json${index + 3}">
  <dcat:accessURL rdf:resource=${csvfileJSON}/>
  <dct:license>
    <dcatapit:LicenseDocument rdf:about="https://w3id.org/italia/controlled-vocabulary/licences/A11:CCO10">
      <rdf:type rdf:resource="dct:LicenseDocument"/>
      <dct:type rdf:resource="http://purl.org/adms/licencetype/Attribution"/>
      <foaf:name>Creative Commons CC0 1.0 Universale - Public Domain Dedication (CC0 1.0)</foaf:name>
    </dcatapit:LicenseDocument>
  </dct:license>
  <dct:format rdf:resource="JSON"/>
  <dct:description>File in formato JSON per l'interoperabilità</dct:description>
  <dct:title>${title} JSON</dct:title>
  <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Distribution"/>
</dcatapit:Distribution>

`
  }

  private produceRDFConcept({ about, prefLabel, lang }: SkosConcept): string {
    return `
<skos:Concept rdf:about="${about}">
  ${prefLabel && lang ? `<skos:prefLabel xml:lang="${lang}">${prefLabel}</skos:prefLabel>` : ''}
  ${prefLabel && !lang ? `<skos:prefLabel>${prefLabel}</skos:prefLabel>` : ''}
  ${!prefLabel && lang ? `<skos:prefLabel xml:lang="${lang}"/>` : ''}
</skos:Concept>`
  }

  private produceRDFOrganization(): string {
    const { name, url, email } = ORGANIZATION
    return `
<dcatapit:Organization rdf:about="${url}">
  <rdf:type rdf:resource="vcard:Organization"/>
  <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Organization"/>
  <rdf:type rdf:resource="http://www.w3.org/2006/vcard/ns#Kind"/>
  <rdf:type rdf:resource="http://www.w3.org/2006/vcard/ns#Organization"/>
  <rdf:type rdf:resource="vcard:Kind"/>
  <vcard:fn>${name}</vcard:fn>
  <vcard:hasEmail rdf:resource="${email}"/>
  <vcard:hasURL rdf:resource="${url}"/>
</dcatapit:Organization>
`
  }
}
