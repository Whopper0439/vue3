/**
 * 1.测试包名引入项目中的工具函数shared
 * @vue/shared
 * ../../shared/src
 * 在monorepo中给reactivity模块安装shared
 * pnpm install @vue/shared --filter @vue/reactivity  安装官方的shared
 * pnpm install @vue/shared --workspace --filter @vue/reactivity  安装自己的shared
 */

// import { isObject } from '@vue/shared'
// isObject({})

export * from './ref'
export * from './effect'
