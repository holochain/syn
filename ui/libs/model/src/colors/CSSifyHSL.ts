import type { HSL } from './HSL'
export function CSSifyHSL(hslArray:HSL) {
  const [h, s, l] = hslArray
  return `hsl(${h} ${s}% ${l}%)`
}
