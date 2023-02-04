const getElement = <T = Element>(selector: string): T => {
  const el = document.querySelector(selector) as T
  if (!el) {
    throw new Error(`Could not get element ${selector}`)
  }
  return el
}

export default getElement
