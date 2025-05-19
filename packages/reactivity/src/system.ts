import { ReactiveEffect } from './effect'

// 链表节点
export interface Link {
  sub: ReactiveEffect // 保存effect传入的fn, 之后重构为ReactiveEffect对象类型
  nextSub: Link | undefined // 下一个节点
  prevSub: Link | undefined // 上一个节点
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
  const newLink = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
  }

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
}
