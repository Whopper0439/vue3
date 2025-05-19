// 用来保存当前正在执行的effect
// 重构ReactiveEffect类，activeSub从函数，修改为对象
export let activeSub

export class ReactiveEffect {
  constructor(public fn) {}
  run() {
    // 优化：解决effect嵌套的问题 -> 先将当前的effect保存起来
    const prevSub = activeSub
    // activeSub从函数，修改为对象
    // 每次执行fn之前，把this放到activeSub上面
    activeSub = this
    try {
      return this.fn()
    } finally {
      // fn执行完成后，把activeSub设置成undefined
      // activeSub = undefined
      activeSub = prevSub // 执行完成后，恢复之前的 effect
    }
  }

  /**
   * 通知更新的方法，如果依赖的数据发生变化，会调用这个函数
   */
  notify() {
    this.scheduler()
  }

  /**
   * 默认调用run,如果用户传了，那以用户的为主，优先级：实例属性>原型属性
   */
  scheduler() {
    this.run()
  }
}

/**
 * effect先保存传入的fn，再执行fn,最后清空fn
 * fn会触发get,get中再保存fn到ref.subs
 * 当下次触发set时，再执行一遍fn
 * @param fn
 */
export function effect(fn, options) {
  // activeSub = fn
  // activeSub()
  // activeSub = undefined
  const e = new ReactiveEffect(fn)
  e.run()

  // scheduler
  Object.assign(e, options) // 添加原型属性scheduler()

  // 返回值
  // return e.run  // 丢失this
  // return () => e.run()  // 拿不到e对象

  // 官方写法：绑定函数的this
  // const runner = e.run.bind(e)  // bind创建一个新函数
  const runner = () => e.run()

  // 把effect的实例，放到函数属性中
  runner.effect = e
  return runner
}
