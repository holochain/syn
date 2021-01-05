// JSON parsing for code with arrays
// Thanks to: https://gist.github.com/jonathanlurie/04fa6343e64f750d03072ac92584b5df
const FLAG_TYPED_ARRAY = 'FLAG_TYPED_ARRAY'

export function decodeJson(jsonStr) {
  return JSON.parse( jsonStr, function( key, value ){
    // the receiver function looks for the typed array flag
    try{
      if( 'flag' in value && value.flag === FLAG_TYPED_ARRAY){
        // if found, we convert it back to a typed array
        return new window[ value.constructor ]( value.data )
      }
    }catch(e){}

    // if flag not found no conversion is done
    return value
  })
}

export function encodeJson(obj) {
  return JSON.stringify( obj , function( key, value ){
    // the replacer function is looking for some typed arrays.
    // If found, it replaces it by a trio
    if ( value instanceof Int8Array         ||
         value instanceof Uint8Array        ||
         value instanceof Uint8ClampedArray ||
         value instanceof Int16Array        ||
         value instanceof Uint16Array       ||
         value instanceof Int32Array        ||
         value instanceof Uint32Array       ||
         value instanceof Float32Array      ||
         value instanceof Float64Array       )
    {
      var replacement = {
        constructor: value.constructor.name,
        data: Array.apply([], value),
        flag: FLAG_TYPED_ARRAY
      }
      return replacement
    }
    return value
  })
}
