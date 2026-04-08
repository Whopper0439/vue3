import { ReactiveEffect } from './effect'

interface Dep {
  // 订阅者链表的头节点
  subs: Link | undefined
  // 订阅者链表的尾节点
  subsTail: Link | undefined
}

interface Sub {
  // 订阅者链表的头节点
  deps: Link | undefined
  // 订阅者链表的尾节点
  depsTail: Link | undefined
}

// 链表节点
export interface Link {
  sub: Sub // 订阅者
  nextSub: Link | undefined // 下一个订阅者节点
  prevSub: Link | undefined // 上一个订阅者节点
  dep: Dep // 依赖项
  nextDep: Link | undefined // 下一个依赖项节点
}

/**
 * 传播更新的函数
 * @param subs ：dep.subs
 */
export function propagate(subs) {
  let link = subs // 记录当前节点
  let queuedEffect = []

  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }

  queuedEffect.forEach(effect => effect.notify()) // run / scheduler
}

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

  const newLink = {
    sub,
    dep,
    nextSub: undefined,
    prevSub: undefined,
    nextDep: undefined,
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
