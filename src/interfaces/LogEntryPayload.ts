interface LogEntryPayload {
  identifier: string
  level: number
  msg: string
  data: string
  ts: number
}
export default LogEntryPayload
