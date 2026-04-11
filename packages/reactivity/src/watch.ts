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
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
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
