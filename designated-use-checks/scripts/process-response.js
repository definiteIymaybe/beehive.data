import { readJSON, writeCSV } from 'https://deno.land/x/flat@0.0.13/mod.ts'

const NOT_ALLOWED = `Для проведения контрольных мероприятий по определению фактического использования объектов для целей налогообложения на объект допущены не были`

const DOSESNT_MEET_DESIGNATION = 'фактически не используется'

const ensureFirstRowHasAllKeys = (arr) => {
  return arr.reduce((acc, row) => {
    if (acc.length) {
      Object.keys(row).forEach((key) => {
        if (!Object.hasOwn(acc[0], key)) acc[0][key] = ''
      })
    }
    return acc.concat(row)
  }, [])
}

const processComment = ({ comment = '', ...o }) => {
  if (!comment) return o
  if (comment === NOT_ALLOWED) return { ...o, notAllowed: '⛔️' }
  return { ...o, comment }
}

const processResult = ({ result = '', ...o }) => {
  o.meetsDesignation = result.includes(DOSESNT_MEET_DESIGNATION) ? '❌' : '✅'
  o.objectType = result.replace(/Объект \((.*?)\) факт(.*)/gm, `$1`)
  if (o.objectType.match(/\(/gm)) o.objectType += `)`
  return { ...o, result }
}

const { ginObjects: rows } = await readJSON(Deno.args[0])

const arrayForCSV = ensureFirstRowHasAllKeys(
  rows.map((r) => processResult(processComment(r)))
)

writeCSV(Deno.args[0].replace('.json', '.csv'), arrayForCSV)
