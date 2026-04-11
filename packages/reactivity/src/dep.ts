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

  // /**
  //  * 更新数组的 length
  //  * 更新前：length = 4 => ['a', 'b', 'c', 'd']
  //  * 更新后：length = 2 => ['a', 'b']
  //  * 得出结论：要通知 访问了 c 和 d 的 effect 重新执行，就是访问了大于等于 length 的索引
  //  * depsMap={  针对数组
  //  *   0:dep
  //  *   1:dep
  //  *   2:dep
  //  *   length:dep
  //  *}
  //  */
  const targetIsArray = Array.isArray(target)
  if (targetIsArray && key === 'length') {
    // 处理数组的 length 更新
    const length = target.length
    depsMap.forEach((dep, depKey) => {
      /**
       * 通知 访问了 >= length 的 effect 重新执行
       * 通知 访问了 length 属性的 effect 重新执行
       */
      if (depKey >= length || depKey === 'length') {
        propagate(dep.subs)
      }
    })
  } else {
    // 不是 数组 ，或者 更新的不是数组length属性
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
}

class Dep {
  subs: Link
  subsTail: Link
  constructor() {}
}
