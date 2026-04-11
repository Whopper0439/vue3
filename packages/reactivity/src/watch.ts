import { isRef } from './ref'
import { ReactiveEffect } from './effect'
import { isObject } from '@vue/shared'

export function watch(source, cb, options) {
  const { immediate, once, deep } = options || {}

  if (once) {
    // 如果once传了，那就保存一份，新的cb等于原来的，加上stop
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      stop()
    }
  }

  let getter

  if (isRef(source)) {
    getter = () => source.value
  }

  if (deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let oldValue

  function job() {
    // 执行effect.run 拿到getter 的返回值，不能直接执行 getter，因为要收集依赖
    const newValue = effect.run()

    // 执行用户回调，把newValue和oldValue传进去
    cb(newValue, oldValue)

    // 下一次的oldValue就等于这一次的newValue
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter)

  effect.scheduler = job

  if (immediate) {
    job()
  } else {
    // 拿到oldValue，并收集依赖
    oldValue = effect.run()
  }

  // 停止监听
  function stop() {
    effect.stop()
  }

  return stop
}

function traverse(value, seen = new Set()) {
  if (!isObject(value)) {
    return value
  }

  if (seen.has(value)) {
    return value
  }
  seen.add(value)

  for (const key in value) {
    traverse(value[key], seen)
  }
  return value
}
