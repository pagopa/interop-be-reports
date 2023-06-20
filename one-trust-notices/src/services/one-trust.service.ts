import axios, { AxiosInstance } from 'axios'
import { env, ONE_STRUST_API_ENDPOINT } from '../config/index.js'
import {
  GetNoticeContentResponseData,
  getNoticeContentResponseDataSchema,
  oneTrustNoticeVersion,
} from '../models/index.js'

export class OneTrustClient {
  private otAxiosInstance: AxiosInstance

  private constructor(sessionToken: string) {
    this.otAxiosInstance = axios.create({
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
    })
  }

  /**
   * Retrives the OneTrust session token and creates a new OneTrustClient instance.
   * @returns A new OneTrustClient instance.
   */
  public static async connect() {
    const form = new FormData()
    form.append('client_id', env.ONE_TRUST_CLIENT_ID)
    form.append('client_secret', env.ONE_TRUST_CLIENT_SECRET)
    form.append('grant_type', 'client_credentials')
    try {
      const response = await axios.post(`${ONE_STRUST_API_ENDPOINT}/access/v1/oauth/token`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          accept: 'application/json',
        },
      })
      return new OneTrustClient(response.data.access_token)
    } catch (error) {
      console.error(error)
      throw new Error('Error while connecting to OneTrust')
    }
  }

  /**
   * Get the list of all the notices.
   * @returns The list of all the notices.
   * */
  public async getNotices() {
    const url = `${ONE_STRUST_API_ENDPOINT}/privacynotice/v2/privacynotices`
    const response = await this.otAxiosInstance.get(url)

    return response.data
  }

  /**
   * Get the active version of the notice with the given id.
   * @param noticeId The id of the notice.
   * @returns The active version of the notice with the given id.
   * */
  public async getNoticeActiveVersion(noticeId: string) {
    // Date iso format without seconds
    const date = new Date().toISOString().slice(0, -5)
    const url = `${ONE_STRUST_API_ENDPOINT}/privacynotice/v2/privacynotices/${noticeId}?date=${date}`
    const response = await this.otAxiosInstance.get(url)
    return oneTrustNoticeVersion.parse(response.data)
  }

  /**
   * Get the OneTrust notice data from the given URL.
   * @param url The URL to get the OneTrust notice data from.
   * @returns The OneTrust notice content.
   */
  public async getNoticeContent(
    noticeId: string,
    lang: string
  ): Promise<GetNoticeContentResponseData> {
    const url = `https://privacyportalde-cdn.onetrust.com/77f17844-04c3-4969-a11d-462ee77acbe1/privacy-notices/${noticeId}-${lang}.json`
    const response = await axios.get(url, {
      /**
       * OneTrust returns an encoded response by default.
       * This header is required to get the response without encoding.
       */
      headers: { 'Accept-Encoding': 'identity' },
    })
    return getNoticeContentResponseDataSchema.parse(response.data)
  }
}
