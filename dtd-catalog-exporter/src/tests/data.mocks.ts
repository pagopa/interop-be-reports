import cloneDeep from "lodash/cloneDeep.js";
import merge from "lodash/merge.js";
import { EService, Attribute, Tenant } from "../models/index.js";

/**
 * Create and returns a mock factory function
 */
function createMockFactory<TDefaultValue>(defaultValue: TDefaultValue) {
  type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
  };
  return <T>(overwrites: RecursivePartial<TDefaultValue> = {}) => {
    return merge(cloneDeep(defaultValue), overwrites) as T;
  };
}

export const getEServiceMock = createMockFactory<EService>({
  attributes: {
    certified: [
      {
        ids: [
          {
            explicitAttributeVerification: false,
            id: "929188a4-bbc8-4509-8999-b2d424de3870",
          },
          {
            explicitAttributeVerification: false,
            id: "f9d7acb2-dc06-4ff2-be76-498179e7f2e9",
          },
        ],
      },
      {
        id: {
          explicitAttributeVerification: false,
          id: "c9b5542e-3890-4e04-85ae-27101a9e13f1",
        },
      },
    ],
    verified: [
      {
        ids: [
          {
            explicitAttributeVerification: false,
            id: "db7e7161-1fff-478a-9a1f-c095e195c732",
          },
          {
            explicitAttributeVerification: false,
            id: "40a01d40-acd0-4fde-8f8f-41f9fec593e1",
          },
        ],
      },
      {
        id: {
          explicitAttributeVerification: false,
          id: "77055d15-0bed-4ca4-a96c-0ecda4ca8613",
        },
      },
    ],
    declared: [
      {
        ids: [
          {
            explicitAttributeVerification: false,
            id: "036307c0-b621-4d08-99b1-c850acfce6fe",
          },
          {
            explicitAttributeVerification: false,
            id: "b77f0735-e024-4563-81a0-ec356b71bf1d",
          },
        ],
      },
      {
        id: {
          explicitAttributeVerification: false,
          id: "922dfb09-f979-42d5-b801-eb8fecedccef",
        },
      },
    ],
  },
  createdAt: "2023-03-23T13:45:26.256Z",
  description: "Questo è un e-service con tanti attributi",
  descriptors: [
    {
      activatedAt: "2023-03-23T13:47:25.045Z",
      agreementApprovalPolicy: "Manual",
      audience: ["kfn dfksndkflvn"],
      createdAt: "2023-03-23T13:45:41.448Z",
      dailyCallsPerConsumer: 10000,
      dailyCallsTotal: 100000,
      description: "Descrizione della versione corrente",
      docs: [
        {
          checksum: "333d41f0afa4c264fb10b51e3ca5687e",
          contentType: "application/pdf",
          id: "3fbc2f09-5c44-4c45-b980-8039184c05ff",
          name: "example_documentation_3.pdf",
          path: "eservices/docs/3fbc2f09-5c44-4c45-b980-8039184c05ff/example_documentation_3.pdf",
          prettyName: "Documento 03",
          uploadDate: "2023-03-23T13:47:23.164615Z",
        },
        {
          checksum: "52414f7a64f9d581cfce85d1534c83d3",
          contentType: "application/pdf",
          id: "b9bb9306-1116-4324-9ccb-ae92eeeb4cf7",
          name: "example_documentation_2.pdf",
          path: "eservices/docs/b9bb9306-1116-4324-9ccb-ae92eeeb4cf7/example_documentation_2.pdf",
          prettyName: "Documento 02",
          uploadDate: "2023-03-23T13:47:15.324304Z",
        },
        {
          checksum: "4b41a3475132bd861b30a878e30aa56a",
          contentType: "application/pdf",
          id: "a958b997-70ec-4573-af05-284452c844c5",
          name: "example_documentation_1.pdf",
          path: "eservices/docs/a958b997-70ec-4573-af05-284452c844c5/example_documentation_1.pdf",
          prettyName: "Documento 01",
          uploadDate: "2023-03-23T13:47:07.501Z",
        },
      ],
      id: "a9c705d9-ecdb-47ff-bcd2-667495b111f2",
      interface: {
        checksum: "5cf174add2b964012e53fa019af30908",
        contentType: "application/x-yaml",
        id: "95daf864-d8ab-439a-a4dc-7cb2f61475e0",
        name: "api.yaml",
        path: "eservices/docs/95daf864-d8ab-439a-a4dc-7cb2f61475e0/api.yaml",
        prettyName: "Specifica API",
        uploadDate: "2023-03-23T13:46:58.42932Z",
      },
      serverUrls: ["http://petstore.swagger.io/api/v1", "http://petstore.swagger.io/api/v2"],
      state: "Published",
      version: "1",
      voucherLifespan: 600,
    },
  ],
  id: "4747d063-0d9c-4a5d-b143-9f2fdc4d7f22",
  name: "Servizio con tanti attributi",
  producerId: "5ec5dd81-ff71-4af8-974b-4190eb8347bf",
  technology: "Rest",
});

export const getAttributeMock = createMockFactory<Attribute>({
  id: "929188a4-bbc8-4509-8999-b2d424de3870",
  name: "Nome attributo 1",
  description: "Descrizione attributo 1",
});

export const getProducerMock = createMockFactory<Tenant>({
  id: "5ec5dd81-ff71-4af8-974b-4190eb8347bf",
  name: "Nome produttore 1",
});
