import ExcelJs from 'exceljs'
import { headerStyle, rowStyle } from '../configs/excel.config.js'

export class ExcelGenerator {
  private workbook: ExcelJs.Workbook

  constructor() {
    this.workbook = new ExcelJs.Workbook()
    this.workbook.creator = 'TODO'
    this.workbook.lastModifiedBy = 'TODO'
    this.workbook.created = new Date()
    this.workbook.modified = new Date()
  }

  public addWorksheetTable({
    name,
    header,
    values,
  }: {
    name: string
    header: string[]
    values: string[][]
  }): ExcelGenerator {
    const worksheet = this.workbook.addWorksheet(name)

    worksheet.addRow(header).eachCell((cell) => {
      cell.style = headerStyle
    })
    values.forEach((row) => {
      worksheet.addRow(row).eachCell((cell) => {
        cell.style = rowStyle
      })
    })

    return this
  }

  public async generateExcelFile(): Promise<Buffer> {
    return (await this.workbook.xlsx.writeBuffer()) as Buffer
  }
}
