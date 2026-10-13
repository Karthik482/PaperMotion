import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
  open,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { dataDirectory } from "@/lib/papers/storage";
import { PaperError } from "@/lib/papers/errors";
import { referenceLesson } from "./references";
import {
  validateTopicPlan,
  validateInteractivePlan,
  validateUniversalPlan,
  type TopicRecord,
  type TopicSummary,
} from "./schemas";
const directory = () =>
  path.join(/*turbopackIgnore: true*/ dataDirectory(), "topics");
export function topicId(
  topic: string,
  level: "beginner" | "technical" = "beginner",
  version: 1 | 2 | 3 = 1,
) {
  return createHash("sha256")
    .update(
      (version === 1 ? "v1:" : `v${version}:${level}:`) +
        topic.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase(),
    )
    .digest("hex");
}
function file(id: string, ext = "json") {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new PaperError("Invalid lesson ID.");
  return path.join(/*turbopackIgnore: true*/ directory(), `${id}.${ext}`);
}
export async function getTopic(id: string): Promise<TopicRecord> {
  const reference = referenceLesson(id);
  if (reference) return reference;
  try {
    const record: TopicRecord = JSON.parse(
      await readFile(/*turbopackIgnore: true*/ file(id), "utf8"),
    );
    if (record.version === 3)
      record.plan = validateUniversalPlan(record.plan, record.topic);
    else if (record.version === 2)
      record.plan = validateInteractivePlan(record.plan, record.topic);
    else record.plan = validateTopicPlan(record.plan, record.topic);
    return record;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT")
      throw new PaperError("Lesson not found.", 404);
    throw e;
  }
}
export async function saveTopic(record: TopicRecord) {
  if (record.version === 3)
    record.plan = validateUniversalPlan(record.plan, record.topic);
  else if (record.version === 2)
    record.plan = validateInteractivePlan(record.plan, record.topic);
  else record.plan = validateTopicPlan(record.plan, record.topic);
  await mkdir(directory(), { recursive: true });
  const destination = file(record.id),
    temp = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(record), "utf8");
  await rename(temp, destination);
}
export async function listTopics(): Promise<TopicSummary[]> {
  await mkdir(directory(), { recursive: true });
  const names = await readdir(/*turbopackIgnore: true*/ directory());
  const result: TopicSummary[] = [];
  for (const name of names.filter((n) => /^[a-f0-9]{64}\.json$/.test(n))) {
    const r = await getTopic(name.slice(0, -5));
    result.push({
      id: r.id,
      topic: r.topic,
      title: r.plan.title,
      domain: r.plan.domain,
      stepCount: r.plan.steps.length,
      createdAt: r.createdAt,
      level: r.level,
      version: r.version,
    });
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function withTopicLock<T>(
  id: string,
  fn: () => Promise<T>,
): Promise<T> {
  await mkdir(directory(), { recursive: true });
  const lock = file(id, "lock");
  let handle;
  try {
    handle = await open(lock, "wx");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST")
      throw new PaperError(
        "This topic is already being planned. Wait, then try again to open the saved lesson.",
        409,
      );
    throw e;
  }
  try {
    return await fn();
  } finally {
    await handle.close();
    await unlink(lock);
  }
}
