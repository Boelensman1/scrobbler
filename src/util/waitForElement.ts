const waitForElement = async <T extends HTMLElement = HTMLElement>(
  selector: string,
  base: Element | Document = document,
  maxDelay = 5000,
  delay = 500,
  totalTime = 0,
): Promise<T> => {
  if (totalTime > maxDelay) {
    throw new Error(`Element "${selector}" not found after ${totalTime}`)
  }
  const el = base.querySelector<T>(selector)
  if (el) {
    return el
  } else {
    // sleep 2s
    await new Promise((resolve) => setTimeout(resolve, delay))
    return waitForElement(selector, base, maxDelay, delay, totalTime + delay)
  }
}

export default waitForElement
