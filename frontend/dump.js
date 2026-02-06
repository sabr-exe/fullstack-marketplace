import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Куда сохраняем дамп
const OUTPUT = "frontend_dump.txt";

// Игнорируемые директории
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  ".turbo",
  ".cache",
  "dump_output",
]);

// Разрешённые расширения
const ALLOWED_EXT = [
  ".js", ".jsx",
  ".ts", ".tsx",
  ".json",
  ".css", ".scss",
  ".html",
  ".md",
];

// Рекурсивный обход
function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        walk(fullPath, out);
      }
      continue;
    }

    const ext = path.extname(entry.name);
    if (!ALLOWED_EXT.includes(ext)) continue;

    const relative = path.relative(__dirname, fullPath);

    out.write(`\n===== ${relative} =====\n`);

    try {
      const content = fs.readFileSync(fullPath, "utf8");
      out.write(content + "\n");
    } catch {
      out.write("[binary file skipped]\n");
    }
  }
}

// Запуск дампа
function dump() {
  const out = fs.createWriteStream(path.join(__dirname, OUTPUT), {
    encoding: "utf8",
  });

  out.write("=== FRONTEND PROJECT DUMP ===\n");

  walk(__dirname, out);

  out.end();
  console.log(`Dump saved to ${OUTPUT}`);
}

dump();
