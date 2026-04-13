import { isObject } from 'packages/shared/src/utils'
import { mutableHandlers } from './baseHandlers'

export function reactive(target) {
  return createReactiveObject(target)
}

/**
 * 保存 target 和 proxy响应式对象 之间的关联关系
 * target -> proxy
 */
const reactiveMap = new WeakMap()

/**
 * 保存所有使用reactive创建出来的响应式对象
 */

const reactiveSet = new WeakSet()

function createReactiveObject(target) {
  /**
   * reactive必须接受一个对象
   */

  // target不是一个对象，直接不处理，返回
  if (!isObject(target)) {
    return target
  }

  /**
   * 获取到之前被代理过的响应式对象，直接返回，不需要重新代理
   */
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  /**
   * 检查target是否已经是响应式对象,存入到了reactiveSet，直接返回
   */
  if (reactiveSet.has(target)) {
    return target
  }

  // target是一个对象，创建target的代理对象
  const proxy = new Proxy(target, mutableHandlers)

  //保存 target 和 proxy响应式对象 之间的关联关系
  reactiveMap.set(target, proxy)

  //保存响应式对象到reactiveSet
  reactiveSet.add(proxy)

  return proxy
}

/**
 * 判断target是不是响应式对象，只要在reactiveSet中即可
 * @param target
 * @return
 */
export function isReactive(target) {
  return reactiveSet.has(target)
}
