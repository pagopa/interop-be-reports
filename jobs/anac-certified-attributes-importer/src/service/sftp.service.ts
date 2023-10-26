import sftp from 'ssh2-sftp-client'
import { SftpConfig } from '../config/sftp.config.js'

export class SftpClient {
  constructor(private config: SftpConfig) {}

  public async downloadCSV(): Promise<string> {
    // Note: The file should be small enough to fit in memory

    const sftpClient = new sftp()

    await sftpClient.connect({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
    })

    const file = await sftpClient.get(this.config.filePath)

    await sftpClient.end()

    if (file instanceof Buffer)
      // TODO Is this ok?
      return file.toString()

    if (typeof file === 'string') return file

    throw Error('Unexpected stream returned from SFTP library')
  }
}
