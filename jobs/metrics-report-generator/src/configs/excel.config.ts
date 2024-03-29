import ExcelJs from 'exceljs'

export const headerStyle: Partial<ExcelJs.Style> = {
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF90EE90' }, // lightgreen
  },
  font: {
    bold: true,
  },
  protection: {
    locked: true,
  },
  alignment: {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  },
  border: {
    bottom: {
      style: 'thin',
    },
    right: {
      style: 'thin',
    },
    top: {
      style: 'thin',
    },
    left: {
      style: 'thin',
    },
  },
}

export const rowStyle: Partial<ExcelJs.Style> = {
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' }, // white
  },
  alignment: {
    vertical: 'middle',
  },
  border: {
    bottom: {
      style: 'thin',
    },
    right: {
      style: 'thin',
    },
    top: {
      style: 'thin',
    },
    left: {
      style: 'thin',
    },
  },
}
