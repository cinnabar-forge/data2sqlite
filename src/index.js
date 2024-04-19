/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-object-injection */
import cfSqlite3 from "@cinnabar-forge/cf-sqlite3";
import fs from "fs";
import xml2js from "xml2js";

import cinnabarData from "./cinnabar.js";

console.log(
  `\n${cinnabarData.stack.nodejs.package}@${cinnabarData.version.text}\n`,
);

const args = process.argv.slice(2);

const AVAILABLE_MODES = ["xml"];

let databaseFile;
let sourceFile;
let mode;
let table;
let columns;

let keyValues;

let xmlNode;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--database") {
    databaseFile = args[i + 1];
    i++;
  } else if (args[i] === "--source") {
    sourceFile = args[i + 1];
    i++;
  } else if (args[i] === "--table") {
    table = args[i + 1];
    i++;
  } else if (args[i] === "--columns") {
    columns = args[i + 1].split(",");
    i++;
  } else if (args[i] === "--mode") {
    mode = args[i + 1];
    i++;
  } else if (args[i] === "--keyValues") {
    keyValues = args[i + 1].split(",");
    i++;
  } else if (args[i] === "--xmlNode") {
    xmlNode = args[i + 1];
    i++;
  }
}

if (!fs.existsSync(databaseFile)) {
  throw new Error(`SQLite file does not exist: ${databaseFile}`);
}

if (!table) {
  throw new Error("Table name is required");
}

if (!columns) {
  throw new Error("Columns are required");
}

if (!mode || !AVAILABLE_MODES.includes(mode)) {
  throw new Error("Possible modes: " + AVAILABLE_MODES.join(", "));
}

if (!sourceFile) {
  throw new Error("This type needs data source");
} else if (!fs.existsSync(sourceFile)) {
  throw new Error(`Data file does not exist: ${sourceFile}`);
}

if (mode === "xml" && !xmlNode) {
  throw new Error("xmlNode is required");
}

const sqliteColumns = [];
const columnDict = {};
const staticValues = {};

columns.forEach((column) => {
  let parts = column.split("=");
  if (parts.length == 2) {
    columnDict[parts[0]] = parts[1];
  } else {
    columnDict[parts[0]] = parts[0];
  }
  sqliteColumns.push(parts[0]);
});

if (keyValues) {
  keyValues.forEach((keyValue) => {
    let parts = keyValue.split("=");
    if (parts.length == 2) {
      staticValues[parts[0]] = parts[1];
    }
  });
}

/**
 * Find XML node in object
 * @param {object} obj - Object to search
 * @param {string} key - XML node name
 * @returns {object|undefined} - Found node
 */
function findXmlNode(obj, key) {
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
  for (let i in obj) {
    if (typeof obj[i] === "object") {
      let found = findXmlNode(obj[i], key);
      if (found) return found;
    }
  }
}

const db = cfSqlite3(databaseFile);

await db.beginTransaction();

if (mode === "xml") {
  const data = fs.readFileSync(sourceFile, "utf-8");

  const xml = await new Promise((resolve) => {
    xml2js.parseString(data, (err, result) => {
      if (err) {
        throw new Error(`Error parsing XML file: ${err.message}`);
      }
      resolve(result);
    });
  });

  const nodes = findXmlNode(xml, xmlNode);

  if (!nodes) {
    throw new Error(`XML node ${xmlNode} not found`);
  }

  const columnsJoined = sqliteColumns.join(", ");
  const valuesJoined = new Array(sqliteColumns.length).fill("?").join(", ");

  await nodes.forEach(async (node) => {
    const dict = node["$"];
    let values = [];
    sqliteColumns.forEach((column) => {
      values.push(dict[columnDict[column]] || staticValues[column]);
    });
    await db.run(
      `INSERT INTO ${table} (${columnsJoined}) VALUES (${valuesJoined}) ON CONFLICT DO NOTHING;`,
      values,
    );
  });
}

await db.commitTransaction();
