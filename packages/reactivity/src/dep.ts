import { link, Link, propagate } from './system'
import { activeSub } from './effect'
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

export function track(target, key) {
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

export function trigger(target, key) {
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
