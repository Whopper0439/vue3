import { hasChange, isFunction } from 'packages/shared/src/utils'
import { ReactiveFlags } from './ref'
import { Dependency, endTrack, link, Link, startTrack, Sub } from './system'
import { activeSub, setActiveSub } from './effect'

class ComputedRefImpl implements Dependency, Sub {
  // computed也是一个ref，通过 isRef 也返回true
  [ReactiveFlags.IS_REF] = true

  // 保存fn的返回值
  _value

  // 作为dep,要关联subs，等我更新了，通知他们重新执行
  subs: Link
  subsTail: Link

  // 作为sub，要知道哪些dep被我收集了
  deps: Link | undefined
  depsTail: Link | undefined
  tracking: boolean

  //计算属性为脏时，get value时，需要执行update
  dirty = true

  constructor(
    public fn, // getter
    private setter,
  ) {}

  get value() {
    // computed为脏时，执行update
    if (this.dirty) {
      this.update()
    }
    /**
     * 作为dep,要和sub做关联关系
     */
    if (activeSub) {
      link(this, activeSub)
    }
    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('我是只读的')
    }
  }

  update() {
    /**
     * 作为sub,为了在执行fn期间，收集fn执行过程中，访问到的响应式数据
     * 建立dep和sub的关联关系
     */
    // 先将当前的effect保存起来
    const prevSub = activeSub

    // activeSub从函数，修改为对象
    // 每次执行fn之前，把this放到activeSub上面
    setActiveSub(this)

    // deps链 -> 头节点有，尾节点undefined,说明之前 effect 被收集过依赖，尝试复用link
    startTrack(this)

    try {
      // 拿到老值
      const oldValue = this._value
      // 拿到新值
      this._value = this.fn()

      //如果值发生了变化，返回true
      return hasChange(oldValue, this._value)
    } finally {
      // 分支切换时，清理依赖
      endTrack(this)

      // fn执行完成后，把activeSub设置成undefined
      // activeSub = undefined
      // activeSub = prevSub // 执行完成后，恢复之前的 effect
      setActiveSub(prevSub)
      // console.log(this)
    }
  }
}

/**
 * 计算属性
 * @param gettersOrOptions 有可能是一个函数，也可能是一个对象，对象中有get和set属性
 */
export function computed(gettersOrOptions) {
  let getter
  let setter

  if (isFunction(gettersOrOptions)) {
    // const c = computed( ()=>{} )
    getter = gettersOrOptions
  } else {
    /**
     * const c = computed({
     *   get: () => {},
     *   set: (val) => {}
     * })
     */
    getter = gettersOrOptions.get
    setter = gettersOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
