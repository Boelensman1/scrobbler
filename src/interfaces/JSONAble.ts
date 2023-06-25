type JSONAble =
  | string
  | number
  | boolean
  | null
  | undefined
  | JSONAble[]
  | { [key: string]: JSONAble }

export default JSONAble
