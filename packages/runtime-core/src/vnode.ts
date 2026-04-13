import { isArray, isString, ShapeFlags } from '@vue/shared'

/**
 * 判断是不是一个虚拟节点，根据 __v_isVNode 属性
 * @param value
 */
export function isVNode(value) {
  return value?.__v_isVNode
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function createVNode(type, props?, children?) {
  let shapeFlag

  //region 处理 type 的 shapeFlag
  if (isString(type)) {
    // div span p h1
    shapeFlag = ShapeFlags.ELEMENT
  }
  //endregion

  if (isString(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  const vnode = {
    // 证明我是一个虚拟节点
    __v_isVNode: true,
    // div p span
    type,
    props,
    // hello world
    children: null,
    // 做 diff 用的
    key: props?.key,
    // 虚拟节点要挂载的元素
    el: null,
    // 如果是9 => 代表type是dom，children是字符串
    shapeFlag,
  }

  return vnode
}
