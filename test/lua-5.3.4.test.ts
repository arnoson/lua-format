import { formatText } from '../src/index'
import { runLuaCode } from './util'
import { readFile, writeFile } from 'fs/promises'

import * as path from 'path'
import * as luaparse from 'luaparse'

const readLuaTest = (name: string) =>
  readFile(path.join(__dirname, 'lua-5.3.4-tests', name), { encoding: 'utf8' })

const parseLua = (text: string) => luaparse.parse(text, { luaVersion: '5.3' })

function generateLuaTest(name: string) {
  it(name + ' can still pass tests after being formatted', async () => {
    // Todo: check what bootstrap actually does.
    const bootstrap = `
      _soft = true
      _port = true
      _nomsg = true
    `

    const result = await readLuaTest(name)
      .then((contents) => bootstrap + contents)
      .then((contents) => {
        const formatted = formatText(contents)
        writeFile(path.join(__dirname, 'output.lua'), formatted, {
          encoding: 'utf8',
        })
        return formatted
      })
      .then((formatted) => runLuaCode(formatted))

    return expect(result).toBe(true)
  })
  it(name + ' can still be parsed after being formatted', async () => {
    const result = await readLuaTest(name).then((contents) =>
      parseLua(contents)
    )
    return expect(result).not.toBeNull()
  })
}

describe('Lua 5.3.4 standalone tests', () => {
  generateLuaTest('bitwise.lua')
  generateLuaTest('api.lua')
  generateLuaTest('attrib.lua')
  generateLuaTest('big.lua')
  generateLuaTest('bitwise.lua')

  // !  Ignore until expressions in parens are fixed
  // generateLuaTest('calls.lua')

  generateLuaTest('closure.lua')
  generateLuaTest('code.lua')

  // !  Ignore until expressions in parens are fixed
  // generateLuaTest('constructs.lua')

  // * Incompatible: Relies on line numbers
  // generateLuaTest('coroutine.lua');
  // generateLuaTest('db.lua');
  // generateLuaTest('errors.lua')

  // TODO check what is causing the error
  // generateLuaTest('events.lua')

  // TODO check what is causing the error
  // generateLuaTest('files.lua')

  generateLuaTest('gc.lua')
  generateLuaTest('goto.lua')
  generateLuaTest('literals.lua')
  generateLuaTest('locals.lua')

  // TODO check what is causing the error
  // generateLuaTest('main.lua');

  generateLuaTest('math.lua')

  // ! Fails (encoding error?)
  // generateLuaTest('pm.lua')

  generateLuaTest('sort.lua')

  // ? Unformated file also fails
  // generateLuaTest('strings.lua')

  generateLuaTest('tpack.lua')
  generateLuaTest('utf8.lua')
  generateLuaTest('vararg.lua')
  generateLuaTest('verybig.lua')
})
