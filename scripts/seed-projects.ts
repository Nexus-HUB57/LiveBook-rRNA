import { db } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const SCRIPTS_DIR = path.join(process.cwd(), "scripts");
const JSON_PATH = path.join(SCRIPTS_DIR, "parsed-projects.json");
const DATA_REPO = path.join(process.cwd(), "chinese-independent-developer");

function ensureDataFile(): string {
  // If parsed JSON exists, use it
  if (fs.existsSync(JSON_PATH)) {
    console.log(`Using existing ${JSON_PATH}`);
    return JSON_PATH;
  }

  // If data repo exists, run parser
  if (fs.existsSync(DATA_REPO)) {
    console.log("Data repo found, running parser...");
    try {
      execSync(`python3 ${path.join(SCRIPTS_DIR, "parse-readme.py")}`, { stdio: "inherit" });
      if (fs.existsSync(JSON_PATH)) return JSON_PATH;
    } catch (e) {
      console.error("Parser failed:", e);
    }
  }

  // Try cloning the data repo
  console.log("Cloning data repo...");
  try {
    execSync(
      "git clone --depth 1 https://github.com/1c7/chinese-independent-developer.git " + DATA_REPO,
      { stdio: "inherit", cwd: process.cwd() }
    );
    execSync(`python3 ${path.join(SCRIPTS_DIR, "parse-readme.py")}`, { stdio: "inherit" });
    if (fs.existsSync(JSON_PATH)) return JSON_PATH;
  } catch (e) {
    console.error("Clone/parser failed:", e);
  }

  throw new Error("No project data available. Ensure parsed-projects.json exists or chinese-independent-developer is cloned.");
}

async function seed() {
  const dataPath = ensureDataFile();
  console.log(`Seeding from ${dataPath}...`);
  await db.project.deleteMany();
  
  const raw = require(dataPath) as Array<Record<string, string | null>>;

  let count = 0;
  for (const p of raw) {
    try {
      await db.project.create({
        data: {
          name: String(p.name || ""),
          url: String(p.url || ""),
          description: String(p.description || ""),
          author: String(p.author || ""),
          authorGithub: p.authorGithub || null,
          authorCity: p.authorCity || null,
          authorBlog: p.authorBlog || null,
          moreUrl: p.moreUrl || null,
          status: String(p.status || "active"),
          category: String(p.category || "其他"),
          dateAdded: String(p.dateAdded || ""),
          source: String(p.source || "main"),
        },
      });
      count++;
      if (count % 200 === 0) console.log(`  ${count}/${raw.length}`);
    } catch (e: any) {
      console.error(`  SKIP [${p.name}]: ${e.message?.slice(0, 80)}`);
    }
  }

  console.log(`Done: ${count} projects seeded`);
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });