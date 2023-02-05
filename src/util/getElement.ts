const getElement = <T extends Element = Element>(selector: string): T => {
  const el = document.querySelector<T>(selector)
  if (!el) {
    throw new Error(`Could not get element ${selector}`)
  }
  return el
}

export default getElement
