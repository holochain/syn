import type { HSL } from '@syn/store';

export function CSSifyHSL(hslArray: HSL) {
  const [h, s, l] = hslArray;
  return `hsl(${h} ${s}% ${l}%)`;
}
