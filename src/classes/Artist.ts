export class Artist {
  name: string
  listeners: number
  plays: number

  constructor({
    name,
    listeners,
    plays,
  }: {
    name: string
    listeners: number
    plays: number
  }) {
    this.name = name
    this.listeners = listeners
    this.plays = plays
  }
}

export default Artist
