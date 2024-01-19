import ExcelJs from 'exceljs'
import { headerStyle, rowStyle } from '../configs/excel.config.js'
import { z } from 'zod'

export class ExcelGenerator {
  private workbook: ExcelJs.Workbook

  constructor() {
    this.workbook = new ExcelJs.Workbook()
    this.workbook.creator = 'TODO'
    this.workbook.lastModifiedBy = 'TODO'
    this.workbook.created = new Date()
    this.workbook.modified = new Date()
  }

  public addWorksheetTable({ name, data }: { name: string; data: Record<string, string>[] }): ExcelGenerator {
    const worksheet = this.workbook.addWorksheet(name)

    this.validateWorksheetTableData(name, data)

    const header: string[] = Object.keys(data[0])
    const values: string[][] = data.map(Object.values)

    worksheet.addRow(header).eachCell((cell) => {
      cell.style = headerStyle
    })
    values.forEach((row) => {
      worksheet.addRow(row).eachCell((cell) => {
        cell.style = rowStyle
      })
    })

    this.adjustColumnWidths(worksheet)

    return this
  }

  public async generateExcelFile(): Promise<Buffer> {
    return (await this.workbook.xlsx.writeBuffer()) as Buffer
  }

  private adjustColumnWidths(worksheet: ExcelJs.Worksheet): void {
    worksheet.columns.forEach((column) => {
      let dataMax = 0
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        dataMax = cell.value ? cell.value.toString().length : 0
      })
      column.width = dataMax < 10 ? 10 : dataMax
    })
  }

  private validateWorksheetTableData(worksheet: string, data: unknown): asserts data is Record<string, string>[] {
    try {
      z.array(z.record(z.string())).parse(data)
    } catch {
      throw new Error(`Invalid data for worksheet ${worksheet}`)
    }
  }
}
