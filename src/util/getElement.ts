const getElement = (selector: string): Element => {
  const el = document.querySelector(selector)
  if (!el) {
    throw new Error(`Could not get element ${selector}`)
  }
  return el
}

export default getElement
