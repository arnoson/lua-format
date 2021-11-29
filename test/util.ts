import { spawn } from 'child_process'
import { readFile, readFileSync, readdirSync } from 'fs'
import * as path from 'path'

import { formatText } from '../src/index'
import { UserOptions } from '../src/options'

export function runLuaCode(code: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const process = spawn('lua5.3', ['-'])
    try {
      process.stdin.write(code, 'utf-8')
      process.stdin.end()
    } catch (e) {
      reject(e)
    }

    process.stderr.on('data', (data: Buffer) => {
      const str = data.toString()

      return reject(new Error(str))
    })

    process.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolve(true)
      }
    })

    process.on('error', (err) => {
      reject(err)
    })
  })
}

export function runTest(dirName: string, userOptions?: UserOptions) {
  test(path.basename(dirName), () => {
    readdirSync(dirName).forEach((fileName) => {
      if (!fileName.endsWith('.lua')) {
        return
      }

      const filePath = path.join(dirName, fileName)
      const text = readFileSync(filePath, 'utf-8')
      const formatted = formatText(text, userOptions)

      expect(formatted).toMatchSnapshot(fileName)
    })
  })
}
