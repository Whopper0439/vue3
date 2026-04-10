import { track, trigger } from './dep'
import { isRef } from './ref'
import { hasChange, isObject } from '@vue/shared'
import { reactive } from './reactive'

export const mutableHandlers = {
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

    // 如果res是一个对象，将其转换为响应式对象,解决target是多重对象，深层修改响应式问题
    if (isObject(res)) {
      return reactive(res)
    }
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
