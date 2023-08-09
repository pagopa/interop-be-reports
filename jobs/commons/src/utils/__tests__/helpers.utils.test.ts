import { SafeMap, toCSV, withExecutionTime } from '../helpers.utils.js'

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
