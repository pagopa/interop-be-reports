import { filenameFromDate } from "../utils.js"

describe('filenameFromDate', () => {
  it('should create the expected file name based on the time', () => {
    const now = new Date(2023, 8, 5)
    const filename = filenameFromDate(now)

    expect(filename).toEqual('2023-09-05.csv')
  })
})