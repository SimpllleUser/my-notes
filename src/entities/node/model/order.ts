export function assignOrders(
  blocks: { id: string }[],
  committed: ReadonlyMap<string, number>,
): Map<string, number> {
  const orders = new Map<string, number>()
  let prev: number | null = null

  const nextKept = (from: number) => {
    for (let i = from + 1; i < blocks.length; i++) {
      const saved = committed.get(blocks[i]!.id)
      if (saved !== undefined && (prev === null || saved > prev)) return saved
    }
    return null
  }

  blocks.forEach((block, index) => {
    const saved = committed.get(block.id)
    if (saved !== undefined && (prev === null || saved > prev)) {
      orders.set(block.id, saved)
      prev = saved
      return
    }
    const next = nextKept(index)
    const value =
      prev === null && next === null
        ? index
        : prev === null
          ? next! - 1
          : next === null
            ? prev + 1
            : (prev + next) / 2
    orders.set(block.id, value)
    prev = value
  })
  return orders
}
