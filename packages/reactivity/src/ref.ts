import { isObject, hasChange } from '@vue/shared'
import { activeSub, effect } from './effect'
import { Dependency, Link, link, propagate } from './system'
import { reactive } from './reactive'

// ref 标记 ， 证明是一个ref
export enum ReactiveFlags {
  IS_REF = '__v_isRef',
}

/**
 * Ref的类
 */
class RefImpl implements Dependency {
  _value // 保存实际的值
  // 保存和effect之间的关联关系
  subs: Link // 订阅者链表的头节点,即head
  subsTail: Link; // 订阅者链表的尾节点，即tail
  [ReactiveFlags.IS_REF] = true // ref 标记 ， 证明是一个ref

  constructor(value) {
    //如果value是对象，reactive包裹成响应式
    this._value = isObject(value) ? reactive(value) : value
  }

  get value() {
    // 收集依赖
    // console.log('有人访问我了', activeSub)
    // 如果activesub 有，即effect中传入的fn,那就保存起来，等我更新的时候触发
    // if (activeSub) {
    // 1.只有一个fn时的情况，直接传入函数
    // this.subs = activeSub
    // 2.trackRef(dep)抽取，dep->this 当前的ref对象
    trackRef(this)
    return this._value
  }

  set value(newValue) {
    const oldValue = this._value
    // 触发更新
    // console.log('我的值变了')
    this._value = isObject(newValue) ? reactive(newValue) : newValue

    // 通知effect重新执行，获取到最新值
    // 1.只有一个fn时的情况
    // this.subs?.()
    // 2.triggerRef(dep) 抽取，dep->this 当前的ref对象
    if (hasChange(newValue, oldValue)) {
      // set 新值和老值不一样，才触发更新
      triggerRef(this)
    }
  }
}

export function ref(value) {
  return new RefImpl(value)
}

/**
 * 判断是不是一个ref
 * @param value
 * @returns
 */
export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

/**
 * 收集依赖，建立 ref 和 effect 之间的链表关系
 * 如果 activesub 有，即effect中传入的fn,那就保存起来，等我更新的时候触发
 * @param dep ：当前的ref对象,this
 */
export function trackRef(dep) {
  // link(dep, sub)抽取，dep -> ref对象, sub -> activeSub
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发ref关联的effect，重新执行
 * 依次取出链表中的函数，存入数组，再依次执行函数
 * @param dep :当前ref对象,this
 */
export function triggerRef(dep) {
  // propagate(subs)抽取，subs -> dep.subs
  if (dep.subs) {
    propagate(dep.subs)
  }
}

class ObjectRefImpl {
  [ReactiveFlags.IS_REF] = true
  constructor(
    public _object,
    public _key,
  ) {}

  get value() {
    return this._object[this._key]
  }

  set value(newValue) {
    this._object[this._key] = newValue
  }
}

export function toRef(target, key) {
  return new ObjectRefImpl(target, key)
}

export function toRefs(target) {
  // target一定是一个reactive对象
  const refs = {}
  for (const key in target) {
    refs[key] = new ObjectRefImpl(target, key)
  }
  return refs
}

export function unref(value) {
  return isRef(value) ? value.value : value
}

export function proxyRefs(target) {
  return new Proxy(target, {
    get(...args) {
      /**
       * 自动解包
       * 如果target[key]是一个ref,那就返回 ref.value ，否则返回target[key]
       */
      const res = Reflect.get(...args)
      return unref(res)
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key]
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue
        return true
      }
      return Reflect.set(target, key, newValue, receiver)
    },
  })
}
