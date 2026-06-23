type Pixel = [x: number, y: number, fill: string]

const D = 'var(--logo-dark)'
const M = 'var(--logo-mid)'
const C = 'var(--logo-clearing)'
const B = 'var(--logo-beam)'
const T = 'var(--logo-tree)'

function fillCircle(cx: number, cy: number, radius: number, fill: string): Pixel[] {
  const pixels: Pixel[] = []
  const r2 = radius * radius
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      if (dx * dx + dy * dy <= r2) {
        pixels.push([x, y, fill])
      }
    }
  }
  return pixels
}

function fillRing(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  fill: string,
): Pixel[] {
  const pixels: Pixel[] = []
  const inner2 = innerRadius * innerRadius
  const outer2 = outerRadius * outerRadius
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const d2 = dx * dx + dy * dy
      if (d2 <= outer2 && d2 > inner2) {
        pixels.push([x, y, fill])
      }
    }
  }
  return pixels
}

function ringPine(dir: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'): Pixel[] {
  switch (dir) {
    case 'n':
      return [
        [6, 1, T],
        [7, 0, T],
        [8, 1, T],
        [7, 1, T],
        [7, 2, D],
        [7, 3, D],
      ]
    case 'ne':
      return [
        [11, 2, T],
        [12, 1, T],
        [12, 2, T],
        [11, 3, D],
        [10, 3, T],
      ]
    case 'e':
      return [
        [13, 6, T],
        [14, 7, T],
        [13, 8, T],
        [12, 7, D],
        [11, 7, D],
      ]
    case 'se':
      return [
        [11, 12, T],
        [12, 13, T],
        [12, 12, T],
        [11, 11, D],
        [10, 11, T],
      ]
    case 's':
      return [
        [6, 13, T],
        [7, 14, T],
        [8, 13, T],
        [7, 13, T],
        [7, 12, D],
        [7, 11, D],
      ]
    case 'sw':
      return [
        [3, 12, T],
        [2, 13, T],
        [2, 12, T],
        [3, 11, D],
        [4, 11, T],
      ]
    case 'w':
      return [
        [2, 6, T],
        [1, 7, T],
        [2, 8, T],
        [3, 7, D],
        [4, 7, D],
      ]
    case 'nw':
      return [
        [3, 2, T],
        [2, 1, T],
        [2, 2, T],
        [3, 3, D],
        [4, 3, T],
      ]
  }
}

export const treeRingPixels: Pixel[] = [
  ...fillCircle(7.5, 7.5, 3.5, C),
  ...fillCircle(7.5, 7.5, 2, B),
  ...fillRing(7.5, 7.5, 3.5, 4.25, M),
  ...ringPine('n'),
  ...ringPine('ne'),
  ...ringPine('e'),
  ...ringPine('se'),
  ...ringPine('s'),
  ...ringPine('sw'),
  ...ringPine('w'),
  ...ringPine('nw'),
]
