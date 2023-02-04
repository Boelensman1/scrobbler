const getTextFromSelector = (selector: string, defaultValue = null) => {
  const elements = document.querySelectorAll(selector)

  if (elements) {
    if (elements.length === 1) {
      return elements[0].textContent
    }

    for (const element of Array.from(elements)) {
      const text = element.textContent
      if (text) {
        return text
      }
    }
  }

  return defaultValue
}

export default getTextFromSelector
