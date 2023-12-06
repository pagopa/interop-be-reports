export type SftpConfig = {
  host: string
  port: number
  username: string
  password: string
  fileNamePrefix: string
  folderPath: string
  forceFileName?: string
}
