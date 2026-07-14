import { db } from "@/lib/db";

const PROJECTS_JSON = "/home/z/my-project/scripts/parsed-projects.json";

async function seed() {
  console.log("Seeding 2402 projects...");
  await db.project.deleteMany();
  
  const raw = require(PROJECTS_JSON) as Array<Record<string, string | null>>;

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