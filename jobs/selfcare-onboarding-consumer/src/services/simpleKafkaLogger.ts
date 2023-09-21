import { logError, logInfo, logWarn } from '@interop-be-reports/commons'
import { LogEntry, logCreator, logLevel } from 'kafkajs'

export const SimpleKafkaLogCreator: logCreator = (requestedLogLevel: logLevel) => (entry: LogEntry) => {
    const { level, log } = entry
    const { message } = log

    if (requestedLogLevel >= level) {
        switch (level) {
            case logLevel.ERROR:
                logError('kafkajs-log', message)
                break
            case logLevel.WARN:
                logWarn('kafkajs-log', message)
                break
            case logLevel.INFO:
                logInfo('kafkajs-log', message)
                break
            case logLevel.DEBUG:
            case logLevel.NOTHING:
                break
        }
    }
}