import { isRef } from './ref'
import { ReactiveEffect } from './effect'
import { isFunction, isObject } from '@vue/shared'
import { isReactive } from './reactive'

export function watch(source, cb, options) {
  let { immediate, once, deep } = options || {}

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
    // 如果是ref,访问.value收集依赖
    getter = () => source.value
  } else if (isReactive(source)) {
    // reactive解构，且reactive默认deep为true
    getter = () => source
    if (!deep) {
      deep = true
    }
  } else if (isFunction(source)) {
    // 如果是函数，直接作为getter
    getter = source
  }

  if (deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  let oldValue

  let cleanup = null
  function onCleanup(cb) {
    cleanup = cb
  }

  function job() {
    if (cleanup) {
      // 清理上一次的副作用
      cleanup()
      cleanup = null
    }

    // 执行effect.run 拿到getter 的返回值，不能直接执行 getter，因为要收集依赖
    const newValue = effect.run()

    // 执行用户回调，把newValue和oldValue传进去
    cb(newValue, oldValue, onCleanup)

    // 下一次的oldValue就等于这一次的newValue
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter)

  effect.scheduler = job

  if (immediate) {
    // 如果传了immediate，先cb一次
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

/**
 * 递归触发getter
 * @param value
 * @param depth
 * @param seen
 * @returns
 */
function traverse(value, depth = Infinity, seen = new Set()) {
  // 如果不是对象或者深度已经到达，直接返回
  if (!isObject(value) || depth <= 0) {
    return value
  }

  // 如果之前访问过，收集过依赖，直接返回，解决循环引用问题
  if (seen.has(value)) {
    return value
  }

  // if (depth <= 0) {  // 合并到上方,监听层级到了，直接返回
  //   return value
  // }

  // 每收集一层，depth--
  depth--
  // 没有收集过，添加到Set()
  seen.add(value)

  for (const key in value) {
    // 递归触发getter
    traverse(value[key], depth, seen)
  }
  return value
}
