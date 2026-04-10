import { isObject, hasChange } from '@vue/shared'
import { Link, link, propagate } from './system'
import { activeSub } from './effect'
import { isRef } from './ref'

export function reactive(target) {
  return createReactiveObject(target)
}

const mutableHandlers = {
  get(target, key, receiver) {
    /**
     * 收集依赖，绑定target中某一个key和sub之间的关系
     */
    //TODO,receiver先留着
    //console.log('get  target key:', target, key)
    track(target, key)

    /**
     * 如果target.a是一个ref，直接把值给他，不需要 .value
     */
    const res = Reflect.get(target, key, receiver) //返回target[key]
    if (isRef(res)) {
      return res.value
    }

    // console.log(receiver === proxy)

    // receiver即传给count的this,使访问器中的this指向proxy代理对象
    return res //返回target[key]
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key]

    /**
     * 触发更新，set时通知之前收集的依赖，重新执行
     */
    // console.log('set  target key newValue:', target, key, newValue)

    // 先更新set，再通知重新执行
    const res = Reflect.set(target, key, newValue, receiver)

    /**
     * 如果更新了state.a，他之前是一个ref,那么会修改原始的ref.value的值为newValue
     * 如果newValue是一个ref,那就不需要同步
     * const a = ref(0)
     * target = { a }
     * 更新了target.a = 1,就等于更新了 a.value = 1
     */
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue
      return res
    }

    //如果set新值和老值不一样，触发更新
    if (hasChange(newValue, oldValue)) {
      trigger(target, key)
    }

    return res //返回target[key]=newValue
  },
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
 * 绑定target[key]关联的所有Dep
 * obj = { a:0, b:1 }
 * targetMap = {
 *   obj: {
 *     a: Dep,
 *     b: Dep
 *   }
 * }
 * @param target
 * @param key
 */
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeSub) {
    return
  }
  // console.log(target, key)

  /**
   * 找depsMap = {
   *     a: Dep,
   *     b: Dep
   *   }
   */
  let depsMap = targetMap.get(target)

  if (!depsMap) {
    /**
     * 没有depsMap => 之前没有收集过这个对象的任何key
     * 那就创建一个新的放进target
     * target -> depsMap
     */
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  /**
   * 找dep => Dep
   */
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Dep()
    depsMap.set(key, dep)
  }

  link(dep, activeSub)

  // console.log('dep:', dep)
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    /**
     * depsMap没有，表示这个对象从没有任何属性在sub中访问过，即没和effect建立过依赖
     */
    return
  }

  const dep = depsMap.get(key)
  if (!dep) {
    /**
     * dep没有，表示这个key从没有在sub中访问过，即没和effect建立过依赖
     */
    return
  }

  //找到dep的subs，通知他们重新执行
  propagate(dep.subs)
}

class Dep {
  subs: Link
  subsTail: Link
  constructor() {}
}

/**
 * 判断target是不是响应式对象，只要在reactiveSet中即可
 * @param target
 * @return
 */
export function isReactive(target) {
  return reactiveSet.has(target)
}
