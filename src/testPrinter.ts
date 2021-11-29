import { formatText } from './index'
import { readFileSync } from 'fs'

const file = readFileSync('test/lua-5.3.4-tests/calls.lua', {
  encoding: 'utf8',
})

const formatted = formatText(file, {
  lineWidth: 60,
  quotemark: 'single',
})

console.log(formatted)
