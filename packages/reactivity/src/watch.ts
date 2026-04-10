import { isRef } from './ref'
import { ReactiveEffect } from './effect'

export function watch(source, cb, options) {
  let getter

  if (isRef(source)) {
    getter = () => source.value
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

  oldValue = effect.run()

  // 停止监听
  function stop() {
    effect.stop()
  }

  return stop
}
