import { filenameFromDate } from "../utils.js"

describe('filenameFromDate', () => {
  it('should create the expected file name based on the time', () => {
    const now = new Date(2023, 8, 5)
    const filename = filenameFromDate('prefix', now)

    expect(filename).toEqual('prefix-20230905.csv')
  })
})