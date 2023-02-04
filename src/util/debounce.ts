const debounce = (func: Function, timeout = 1000) => {
  let timer: NodeJS.Timeout | undefined
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

export default debounce
