type LogLevel = 'info' | 'warn' | 'error' | 'success'

export function log(module: string, level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${module}]`
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  data ? logFn(`${prefix} ${message}`, JSON.stringify(data, null, 2)) : logFn(`${prefix} ${message}`)
}
