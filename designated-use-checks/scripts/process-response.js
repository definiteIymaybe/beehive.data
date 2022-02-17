import { readJSON, writeCSV } from "https://deno.land/x/flat@0.0.14/mod.ts";

const jsonPath = Deno.args[0];

console.log("Deno args", Deno.args);
console.log("jsonPath", jsonPath);

const replaceMap = {
  notAllowed: {
    from: `Для проведения контрольных мероприятий по определению фактического использования объектов для целей налогообложения на объект допущены не были`,
    to: "⛔️",
  },
  doesntMeetDesignation: {
    from: "фактически не используется",
    to: "❌",
    or: "✅",
  },
};

const ensureFirstRowHasAllKeys = (arr) => {
  return arr.reduce((acc, row) => {
    if (acc.length) {
      Object.keys(row).forEach((key) => {
        if (!Object.hasOwn(acc[0], key)) acc[0][key] = "";
      });
    }
    return acc.concat(row);
  }, []);
};

const processComment = ({ comment = "", ...o }) => {
  if (!comment) return o;
  const { from, to } = replaceMap.notAllowed;
  if (comment === from) return { ...o, notAllowed: to };
  return { ...o, comment };
};

const processResult = ({ result = "", ...o }) => {
  const { from, to, or } = replaceMap.doesntMeetDesignation;
  o.meetsDesignation = result.includes(from) ? to : or;
  o.objectType = result.replace(/Объект \((.*?)\) факт(.*)/gm, `$1`);
  if (o.objectType.match(/\(/gm)) o.objectType += `)`;
  return { ...o, result };
};

const { ginObjects: rows } = await readJSON(jsonPath);

const arrayForCSV = ensureFirstRowHasAllKeys(
  rows.map((r) => processResult(processComment(r)))
);

const csvPath = jsonPath.replace(".json", ".csv");

await writeCSV(csvPath, arrayForCSV);
