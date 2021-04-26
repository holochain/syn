import type { HSL } from '@syn-ui/zome-client'
export function CSSifyHSL(hslArray:HSL) {
  const [h, s, l] = hslArray
  return `hsl(${h} ${s}% ${l}%)`
}
