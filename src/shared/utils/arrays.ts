export const getRandomArrayItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]!
