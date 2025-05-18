// 用来保存当前正在执行的effect
export let activeSub

/**
 * effect先保存传入的fn，再执行fn,最后清空fn
 * fn会触发get,get中再保存fn到ref.subs
 * 当下次触发set时，再执行一遍fn
 * @param fn
 */
export function effect(fn) {
  activeSub = fn
  activeSub()
  activeSub = undefined
}
