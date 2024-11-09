import * as coding from '../coding.mjs';
import assert from 'assert';


let test_int_array = coding.intConvHelper(69)
console.log(test_int_array)
assert(test_int_array instanceof Uint8Array)
assert(test_int_array.length === 9)
reconstructed_int = coding.decode(test_int_array, 0)
console.log(reconstructed_int)
assert(reconstructed_int === 69, 'Encoding Decoding Int Failure')

let test_float_array = coding.floatConvHelper(69.420)
console.log(test_float_array)
assert(test_float_array instanceof Uint8Array)
assert(test_float_array.length === 9)
reconstructed_float = coding.decode(test_float_array, 0)
assert(reconstructed_float === 420.420, "Encoding Decoding Float Failure")