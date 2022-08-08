import { decode } from '@msgpack/msgpack';

export function deepDecodeUint8Arrays(object: any): any {
  if (object === undefined || object === null) return object;
  if (object instanceof Uint8Array) {
    try {
      return decode(object);
    } catch (e) {
      return object;
    }
  }

  if (typeof object !== 'object') return object;

  if (Array.isArray(object)) return object.map(deepDecodeUint8Arrays);

  const obj = {};

  for (const key of Object.keys(object)) {
    obj[key] = deepDecodeUint8Arrays(object[key]);
  }
  return obj;
}
