const waitForElement = async (
  selector: string,
  maxDelay = 5000,
  delay = 500,
  totalTime = 0,
): Promise<Element> => {
  if (totalTime > maxDelay) {
    throw new Error(`Element "${selector}" not found after ${totalTime}`)
  }
  const el = document.querySelector(selector)
  if (el) {
    return el
  } else {
    // sleep 2s
    await new Promise((resolve) => setTimeout(resolve, delay))
    return waitForElement(selector, maxDelay, delay, totalTime + delay)
  }
}

export default waitForElement
