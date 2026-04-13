export function isObject(value) {
  return typeof value === 'object' && value !== null
}

/**
 * 判断值是否发生变化
 * @param newValue
 * @param oldValue
 * @returns
 */
export function hasChange(newValue, oldValue) {
  return !Object.is(newValue, oldValue)
}

export function isFunction(value) {
  return typeof value === 'function'
}

export function isOn(key) {
  return /^on[A-Z]/.test(key)
}

export function isString(value) {
  return typeof value === 'string'
}

export function isArray(value) {
  return Array.isArray(value)
}
