// 打包开发环境
// console.log(111); // 测试

/**
 * esbuild打包配置
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import esbuild from 'esbuild'
import { createRequire } from 'node:module'

/**
 * 1.解析命令行参数：
 * node scripts/dev.js --format esm
 * node scripts/dev.js --format cjs
 * 获取到执行脚本的参数 esm/cjs/iife
 */
// console.log(`process.argv:${process.argv}`)

// parseArgs重新组织数据格式
const {
  values: { format }, // 解构两次
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'esm',
    },
  },
})
console.log(format, positionals)

/**
 * 2.指定打包的入口文件 package文件夹 reactivity/vue src/index.ts
 * __dirname是cjs中的, esm中不存在，需自己创建
 */

// 创建esm中的__dirname  __filename  require
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

const target = positionals.length ? positionals[0] : 'vue' // 源码中数组遍历
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
console.log(entry)

// 打包成js文件，且根据format格式区分，esm/cjs
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`,
)
// 补充：entry.lg 快捷键

const pkg = require(`../packages/${target}/package.json`)
console.log(pkg)
/**
 * 3.esbuild的配置
 * --format cjs or esm
 * cjs => reactivity.cjs.js
 * esm => reactivity.esm.js
 */

esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile, // 输出文件
    format, // 打包格式 cjs esm iife
    platform: format === 'cjs' ? 'node' : 'browser', // 打包平台 node browser
    sourcemap: true, // 开启sourcemap，方便调试
    bundle: true, // 把所有的依赖打包到一个文件夹
    globalName: pkg.buildOptions.name,
  })
  .then(ctx => ctx.watch()) // 监听文件变化，实时打包
