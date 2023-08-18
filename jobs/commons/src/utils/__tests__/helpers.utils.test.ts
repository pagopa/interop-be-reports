import { SafeMap, b64ByteUrlEncode, b64UrlEncode, toCSV, withExecutionTime } from '../helpers.utils.js'

describe('toCSV', () => {
  it('should return a CSV string from an array of objects', () => {
    const data = [
      { name: 'John', surname: 'Doe' },
      { name: 'Jane', surname: 'Doe' },
    ]

    const expected = 'name,surname\nJohn,Doe\nJane,Doe'

    expect(toCSV(data)).toEqual(expected)
  })

  it('should return an empty string if the array is empty', () => {
    expect(toCSV([])).toEqual('')
  })
})

describe('SafeMap', () => {
  it('should throw an error if the key is not found', () => {
    const map = new Map<string, string>([['key', 'value']])
    const safeMap = new SafeMap(map)

    expect(() => safeMap.get('key')).not.toThrow()
    expect(() => safeMap.get('wrongKey')).toThrow()
  })
})

describe('withExecutionTime', () => {
  const mockFn = vitest.fn()
  beforeAll(() => {
    vitest.spyOn(console, 'log').mockImplementation(mockFn)
  })

  afterAll(() => {
    vitest.restoreAllMocks()
  })

  it('should call the function and log the execution time', async () => {
    await withExecutionTime(mockFn)
    expect(mockFn).toHaveBeenCalledWith(expect.stringContaining('Execution time: '))
  })
})

describe('b64UrlEncode', () => {
  it('should encode and remove special characters', () => {
    const toEncode = 'hello'
    const expected = 'aGVsbG8'

    expect(b64UrlEncode(toEncode)).toEqual(expected)
  })
})

describe('b64ByteUrlEncode', () => {
  it('should encode and remove special characters', () => {

    const toEncode = new Uint8Array([26, 34, 59, 143, 108, 86, 56, 234, 32, 107, 53, 72, 204, 194, 210, 120, 94, 244, 139, 140, 93, 220, 94, 252, 39, 88, 84, 199, 141, 90, 230, 101, 43, 170, 58, 253, 45, 64, 118, 64, 223, 41, 56, 121, 214, 179, 185, 131, 154, 193, 218, 103, 231, 129, 1, 96, 102, 219, 151, 52, 254, 104, 201, 249, 51, 154, 163, 36, 250, 144, 219, 166, 144, 216, 76, 49, 99, 246, 127, 204, 109, 2, 83, 57, 232, 34, 83, 125, 182, 50, 10, 57, 1, 184, 179, 183, 76, 71, 187, 75, 18, 192, 62, 27, 196, 227, 127, 4, 107, 159, 209, 0, 5, 167, 3, 238, 36, 15, 42, 184, 151, 2, 219, 206, 161, 145, 19, 250, 23, 139, 232, 51, 43, 71, 108, 26, 21, 25, 94, 139, 152, 246, 100, 210, 31, 131, 78, 211, 122, 207, 36, 64, 45, 216, 185, 176, 139, 74, 99, 69, 230, 179, 117, 32, 105, 171, 204, 140, 24, 66, 169, 69, 76, 108, 23, 30, 126, 148, 155, 235, 92, 174, 103, 21, 222, 41, 26, 7, 127, 24, 128, 250, 179, 195, 83, 113, 123, 30, 44, 50, 165, 157, 27, 159, 219, 205, 180, 34, 42, 104, 159, 95, 174, 108, 2, 191, 39, 208, 230, 220, 89, 144, 62, 50, 168, 58, 136, 155, 63, 153, 39, 244, 173, 217, 94, 118, 136, 173, 80, 244, 36, 245, 226, 68, 89, 239, 54, 243, 241, 73, 209, 242, 249, 145, 30, 224])
    const expected = 'GiI7j2xWOOogazVIzMLSeF70i4xd3F78J1hUx41a5mUrqjr9LUB2QN8pOHnWs7mDmsHaZ-eBAWBm25c0_mjJ-TOaoyT6kNumkNhMMWP2f8xtAlM56CJTfbYyCjkBuLO3TEe7SxLAPhvE438Ea5_RAAWnA-4kDyq4lwLbzqGRE_oXi-gzK0dsGhUZXouY9mTSH4NO03rPJEAt2Lmwi0pjReazdSBpq8yMGEKpRUxsFx5-lJvrXK5nFd4pGgd_GID6s8NTcXseLDKlnRuf2820Iipon1-ubAK_J9Dm3FmQPjKoOoibP5kn9K3ZXnaIrVD0JPXiRFnvNvPxSdHy-ZEe4A'

    expect(b64ByteUrlEncode(toEncode)).toEqual(expected)
  })
})