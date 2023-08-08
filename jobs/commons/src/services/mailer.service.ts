import {
  type Transporter,
  createTransport,
  SentMessageInfo,
  SendMailOptions,
  createTestAccount,
} from 'nodemailer'
import * as SMTPTransport from 'nodemailer/lib/smtp-transport/index.js'

/**
 * A wrapper around nodemailer's Transporter.
 */
export class Mailer {
  private transporter: Transporter<SentMessageInfo>

  constructor(options: SMTPTransport.Options) {
    this.transporter = createTransport(options)
  }

  async sendMail(options: SendMailOptions) {
    return await this.transporter.sendMail(options)
  }

  /**
   * Creates a test account for testing purposes.
   * @see https://nodemailer.com/smtp/testing/
   */
  static async createTestAccount() {
    return new Promise((resolve, reject) => {
      createTestAccount((err, account) => {
        if (err) reject(err)
        else resolve(account)
      })
    })
  }
}
