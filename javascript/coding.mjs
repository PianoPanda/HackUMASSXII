import { param } from 'express/lib/request';
import {Magic} from './magic.mjs';

/**
 * Update the Unit8Array that carries binary info.
 * @param {Uint8Array} byte_array - The array containing all bytes we need to send.
 * @param {array} data - The data to be placed into byte_array.
 * @returns {Uint8Array} Updated byte_array.
 */
function updateByteArrray(byte_array, data) {

    let start_index = byte_array.length
    let new_byte_array = new Uint8Array(byte_array.length + data.length)
    new_byte_array.copy(byte_array)

    for (d in data) {
        new_byte_array.set([d], start_index)
        start_index += 1
    }

    return new_byte_array
}

function initFunCall(byte_array, id, ret) {
    place_holder = 0 // don't know byte_array length until end
    // split func id & ret id into two bytes
    let temp = new Uint16Array([id, ret])
    id0 = temp[0] & 0xFF00 // first 8 bits
    id1 = temp[0] & 0x00FF // last 8 bits
    ret0 = temp[1] & 0xFF00 // first 8 bits
    ret1 = temp[1] & 0x00FF // last 8 bits

    data = [Magic.FCALL, place_holder, id0, id1, ret0, ret1]
    return updateByteArrray(byte_array, data)
}

export function encoding(func, ...params) {
    
    let byte_array = new Uint8Array();
    // func is func obj
    param_types = func.types // strings of the type itself
    ret = func.ret
    id = func.id
    func_name = func.name 

    // count checking
    try {
        params.length === param_types.length
    } catch (_) {
        throw new Error("Parameter Count Mismatch.")
    }

    // encoding function headers & metadata & ids into byte_array
    byte_array = initFunCall(byte_array, id, ret)

    // encoding parameters into byteArra
    for (let i = 0; i < param_types.length; i++) {
        obj_run_param = params[i]
        func_param_type = param_types[i]
        encodeEachParam(obj_run_param, func_param_type)
    }
    encodeEachParam(params, param_types)

    return byte_array
}

/**
 * Fact checking & tries type conversion & updates byte_array within each case
 * @param {array} params - params from obj.run, what we want to pass into python.
 * @param {array} param_types - actual function parameter types specified by python.
 */
function encodeEachParam(obj_run_param, func_param_type) {
    switch (func_param_type) {
        case Magic.INT:
            if (!(typeof obj_run_param === 'number')) {
                throw new Error("Parameter Int Type Mismatch.")
            }
            data = intConvHelper(Math.floor(obj_run_param))
            byte_array = updateByteArrray(byte_array, Magic.INT, data)
            break;
        case Magic.FLOAT:
            if (!(typeof obj_run_param === 'number')) {
                throw new Error("Parameter Float Type Mismatch.")
            }
            data = floatConvHelper(Math.floor(obj_run_param))
            byte_array = updateByteArrray(byte_array, Magic.FLOAT, data)
            break;
        case Magic.STRING:
            if(!(typeof obj_run_param === 'string')) {
                throw new Error("Parameter String Type Mismatch.")
            }
            data = strConvHelper(obj_run_param)
            byte_array = updateByteArrray(byte_array, Magic.STRING, data)
            break;
        case Magic.ARRAY:
            recurArrHelper(obj_run_param, Magic.ARRAY)
            // selects part of params
            break;
        case Magic.OBJECT:
            break;
        default:
            throw new Error("Idk why tf ur here, this should not happen")
    }
}

/**
 * helper function for int conversion into bytes array 
 * @param {number} num - int from params
 * @returns {array} a byte array encoded with integer
 */
function intConvHelper(num) {
    // convert int into 64 bits (8 bytes)
    const temp = new BigInt64Array([num])
    int_arr = new Uint8Array(8)
    for (let i = 0; i < 64; i+=8) {
        // shift to right and mask to keep right most 8 bits
        int_arr[i/8] = Number(temp[0] >> (8 * i) & 0xFF) 
    }
    return int_arr
}

/**
 * helper function for float conversion into bytes array 
 * @param {number} num - float from params
 * @returns {array} a byte array encoded with float
 */
function floatConvHelper(num) {
    // convert float into 64 bits (8 bytes)
    const temp = new Float64Array([num])
    float_arr = new Uint8Array(8)
    for (let i = 0; i < 64; i+=8) {
        // shift to right and mask to keep right most 8 bits
        float_arr[i/8] = Number(temp[0] >> (8 * i) & 0xFF) 
    }
    return float_arr
}

/**
 * helper function for string conversion into bytes array 
 * @param {string} str - string from params
 * @returns {array} a byte array encoded with string
 */
function strConvHelper(str) {
    const temp = new Uint32Array([str.length])
    str_len = new Uint8Array(4) // srting length -> 4 bytes
    for (let i = 0; i < 32; i +=4) {
        str_len[i/4] = Number(temp[0] >> (4 * 1) & 0xFF)
    }
    let start_index = str_len.length
    str_arr = new Uint8Array(4 + str.length)
    for (char in str.split("")) {
        // PUMP into str_arr the 8-bits chars
        str_arr[start_index] = String.prototype.codePointAt(char)
        start_index += 1
    }
    return str_arr
}

    // this is so clumped up
function recurArrHelper(arr, magicNum) {
    magicNum = Magic.ARRAY
    // recurisvely tries to construct an array from the params
    // special case: empty array
    if (n.length === 0) {
        return updateByteArrray(byte_array, [0, 0, 0, 0])
    }
    // none empty array / element
    for (n in arr) {
        // singular element
        if (arr.length === undefined) { 
            // recognize array element data type
            if (isInt(n)) {
                return encodeEachParam(n, Magic.INT)
            } else if (isFloat(n)) {
                return encodeEachParam(n, Magic.FLOAT)
            } else if (typeof n === 'string') {
                return encodeEachParam(n, Magic.STRING)
            } else if (true) {
                // TODO 
                // object 
                break;
            } else {
                // TODO 
                // void type?
            }
        } else {
            return recurArrHelper(n, Magic.ARRAY)
        }
    }
}

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}







function decode(arr, s) {
    // get header
    const header = arr[s] << 8 + arr[++s]
    switch(header) {
        case Magic.INT:
            let int = 0
            for (let i=0; i<8; i++) {
                int += data[s+i] << 8*(8-i)
            }
            return int
        case Magic.FLOAT:
            let float = new UInt8Array(8)
            for (let i=0; i<8; i++) {
                float[i] = data[s+i]
            }
            return Float64Array.from(float)[0]
        case Magic.STRING:
            break
        case Magic.ARRAY:
            break
        case Magic.OBJECT:
            break
        case Magic.VOID:
            return undefined
        case Magic.ERR:
            throw new Error("runtime error")
        default:
            throw new Error(`invalid header for return packet ${header}`)
    }
}

