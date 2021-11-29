import { defineConfig } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'

const isProduction = process.env.BUILD === 'production'

const bundle = defineConfig({
  input: 'src/index.ts',
  output: { dir: 'dist', format: 'es' },
  plugins: [esbuild(), nodeResolve(), commonjs()],
})

const types = defineConfig({
  input: 'src/index.ts',
  output: { file: 'dist/index.d.ts', format: 'es' },
  plugins: [dts()],
})

export default isProduction ? [bundle, types] : bundle
