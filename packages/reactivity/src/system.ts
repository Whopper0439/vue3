import { ReactiveEffect } from './effect'

export interface Dependency {
  // 订阅者链表的头节点
  subs: Link | undefined
  // 订阅者链表的尾节点
  subsTail: Link | undefined
}

export interface Sub {
  // 订阅者链表的头节点
  deps: Link | undefined
  // 订阅者链表的尾节点
  depsTail: Link | undefined

  tracking: boolean
}

// 链表节点
export interface Link {
  sub: Sub // 订阅者
  nextSub: Link | undefined // 下一个订阅者节点
  prevSub: Link | undefined // 上一个订阅者节点
  dep: Dependency // 依赖项
  nextDep: Link | undefined // 下一个依赖项节点
}

function processComputedUpdate(sub) {
  /**
   * 更新计算属性
   * 1.调用update
   * 2.通知subs链表上所有的sub重新执行
   */
  sub.update()
  propagate(sub.subs)
}

/**
 * 传播更新的函数
 * @param subs ：dep.subs
 */
export function propagate(subs) {
  let link = subs // 记录当前节点
  let queuedEffect = []

  while (link) {
    //触发effect更新时,先判断是否在依赖收集状态，避免无限循环递归
    const sub = link.sub
    if (!sub.tracking) {
      if ('update' in sub) {
        processComputedUpdate(sub)
      } else {
        queuedEffect.push(sub)
      }
    }

    link = link.nextSub
  }

  queuedEffect.forEach(effect => effect.notify()) // run / scheduler
}

//保存已经清理的节点，留着复用
let linkPool: Link
/**
 * 链接链表关系
 * @param dep :依赖项，当前ref对象,this
 * @param sub :activeSub
 */
export function link(dep, sub) {
  // region 添加新节点前，deps链 -> 尝试复用链表节点link
  const currentDep = sub.depsTail // 拿到尾节点
  /**
   * 两种情况：
   * 1.如果头节点有，尾节点没有，尝试复用头节点
   * 2.如果尾节点还有nextDep,尝试复用尾节点的nextDep
   */
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep //nextDep为下一个可能复用的节点
  if (nextDep && nextDep.dep === dep) {
    // console.log('复用节点：', nextDep)
    sub.depsTail = nextDep // 相同的依赖项复用
    return
  }
  // endregion

  /**
   * 看一下linkPool中有没有link节点，有就复用，没有再创建新的节点
   */
  let newLink

  if (linkPool) {
    //console.log('复用了linkPool')

    newLink = linkPool
    linkPool = linkPool.nextDep

    //newLink赋值
    newLink.sub = sub
    newLink.dep = dep
    newLink.nextDep = nextDep
  } else {
    newLink = {
      sub,
      dep,
      nextSub: undefined,
      prevSub: undefined,
      nextDep,
    }
  }

  // region 将链表节点和dep建立关联关系,双向链表插入
  /**
   * 关联链表关系，即链表插入，传入函数类型的链表节点
   * 1.尾节点有，直接往尾节点后面插入
   * 2.尾节点没有，则表示第一次关联，往头节点后面加，头尾相同
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }
  // endregion

  // region 将链表节点和sub建立关联关系,单向链表插入
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
  }
  // endregion
}

/**
 * 开始追踪依赖，将尾节点设置为undefined
 * @param sub
 */
export function startTrack(sub) {
  sub.tracking = true
  sub.depsTail = undefined
}

/**
 * 结束追踪，找到需要清理的依赖，断开关联关系
 * @param sub
 */

export function endTrack(sub) {
  sub.tracking = false
  const depsTail = sub.depsTail
  /**
   * 情况一：depsTail有，且depsTail还有nextDep,从depsTail.nextDep开始清除依赖
   * 情况二：depsTail没有，且头节点有，那就从头节点sub.deps开始把所有的依赖都清除
   */
  if (depsTail) {
    if (depsTail.nextDep) {
      // console.log('把它移除：', depsTail.nextDep)
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    // console.log('从头开始删除依赖：', sub.deps)
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}

/**
 * 清理依赖关系
 * @param link
 */

export function clearTracking(link: Link) {
  while (link) {
    const { prevSub, nextSub, dep, nextDep } = link

    /**
     * 删除节点操作，注意两条链，deps/subs
     */

    // subs链
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }

    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep.subsTail = prevSub
    }

    link.sub = undefined

    // deps链
    link.dep = undefined

    // link.nextDep = undefined
    // 清理掉的链表节点给linkPool复用,头插法
    link.nextDep = linkPool
    linkPool = link
    //console.log('保存到linkPool')

    // while下一个节点清理
    link = nextDep
  }
}
