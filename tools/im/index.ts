import path from 'path'
import fs from 'fs-extra'
import consola from 'consola'
import list from '../../instruments.json'
import { downloadAndUnzip } from './downloader'
import { transform } from './transform'

export async function main() {
  function dir(d: string, ext: string): string[] {
    return fs
      .readdirSync(d)
      .map((l) => path.join(d, l))
      .map((l) => (fs.statSync(l).isDirectory() ? dir(l, ext) : [l]))
      .flat()
      .filter((f) => f.endsWith(ext))
      .map((p) => p.replace(/^static/, '').replace(/\\/g, '/'))
  }

  consola.info('Preparing instruments...')
  await Promise.all(
    list.map(async (inst) => {
      await downloadAndUnzip(inst.url, inst.name)
    })
  )

  consola.info('Transforming data...')
  const sfzs = dir(path.resolve(__dirname, './instruments'), '.sfz')
  await Promise.all(
    sfzs.map(async (sfz) => {
      consola.info(`Transforming ${sfz}`)
      await transform(sfz)
    })
  )

  const jsfzs = dir(
    path.resolve(__dirname, './instruments'),
    '.jsfz'
  ).map((p) => path.relative(__dirname, p).replace(/\\/g, '/'))

  await fs.writeFile(
    path.resolve(__dirname, './instruments/instruments.json'),
    JSON.stringify(jsfzs)
  )

  fs.copy(
    path.resolve(__dirname, './instruments'),
    path.resolve(__dirname, '../../static/instruments/')
  )
  consola.info(`Instruments ready`)
}