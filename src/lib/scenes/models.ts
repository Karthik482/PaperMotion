import type { Scene } from "./schemas";
import type { SceneState } from "./simulation";
import { dnaStages, historicalEvents } from "./catalog";
export function schedule(
  partitions: number,
  executors: number,
  slots: number,
  duration: number,
  stages: number,
  step: number,
  records: number,
) {
  if (
    ![partitions, executors, slots, duration, stages, step, records].every(
      Number.isInteger,
    ) ||
    partitions < 1 ||
    partitions > 24 ||
    executors < 1 ||
    executors > 6 ||
    slots < 1 ||
    slots > 4 ||
    duration < 1 ||
    duration > 8 ||
    stages < 1 ||
    stages > 3 ||
    records < 1 ||
    records > 240
  )
    throw new Error("Invalid scheduler parameters");
  const capacity = executors * slots,
    waves = Math.ceil(partitions / capacity),
    max = stages * waves * 2;
  if (step < 0 || step > max) throw new Error("Invalid scheduler step");
  const stage = Math.min(stages - 1, Math.floor(step / (waves * 2))),
    local = step - stage * waves * 2,
    done = Math.min(partitions, Math.floor(local / 2) * capacity),
    active = local % 2 === 1;
  const tasks = Array.from({ length: partitions }, (_, i) => ({
    id: `task-${i}`,
    executor: Math.floor((i % capacity) / slots),
    slot: i % slots,
    status:
      i < done
        ? "complete"
        : active && i < done + capacity
          ? "running"
          : "queued",
    records: Array.from({ length: records }, (_, j) => j + 1).filter(
      (_, j) => j % partitions === i,
    ),
  }));
  return {
    capacity,
    waves,
    max,
    stage,
    tasks,
    completed: stage * partitions + done,
    total: stages * partitions,
    elapsed: Math.floor(step / 2) * duration,
    estimatedTime: stages * waves * duration,
    result: step === max ? (records * (records + 1)) / 2 : null,
  };
}
export function equilibrium(
  a: number,
  b: number,
  c: number,
  d: number,
  shiftD = 0,
  shiftS = 0,
) {
  if (![a, b, c, d, shiftD, shiftS].every(Number.isFinite) || b <= 0 || d <= 0)
    throw new Error("Invalid equilibrium");
  const q = (a + shiftD - c - shiftS) / (b + d),
    p = c + shiftS + d * q;
  return {
    quantity: q,
    price: p,
    feasible: q >= 0 && p >= 0,
    demand: (quantity: number) => a + shiftD - b * quantity,
    supply: (quantity: number) => c + shiftS + d * quantity,
  };
}
export function dataTrace(
  scene: Extract<Scene, { type: "data-explorer" }>,
  state: SceneState,
) {
  const rows = scene.config.rows.map((r) => ({
    ...r,
    value: state.parameters[`row-${r.id}`] ?? r.value,
  }));
  if (scene.config.operation === "bubble-sort") {
    const frames: { rows: typeof rows; note: string; active: string[] }[] = [
      {
        rows: structuredClone(rows),
        note: "Start with the input order.",
        active: [],
      },
    ];
    const working = [...rows];
    for (let pass = 0; pass < rows.length - 1; pass++)
      for (let i = 0; i < rows.length - pass - 1; i++) {
        const active = [working[i].id, working[i + 1].id],
          swapped = working[i].value > working[i + 1].value;
        if (swapped)
          [working[i], working[i + 1]] = [working[i + 1], working[i]];
        frames.push({
          rows: structuredClone(working),
          note: `Compare positions ${i + 1} and ${i + 2}: ${swapped ? "swap because the left value is larger" : "keep their order"}.`,
          active,
        });
      }
    const frame = frames[Math.min(state.step, frames.length - 1)];
    return {
      ...frame,
      max: frames.length - 1,
      output: frame.rows.map((r) => ({ ...r, joined: null as string | null })),
    };
  }
  const inspected = rows.slice(0, state.step),
    output = inspected.flatMap((r) => {
      if (scene.config.operation === "filter")
        return r.value >= state.parameters.threshold
          ? [{ ...r, joined: null as string | null }]
          : [];
      const matches = scene.config.lookup.filter((l) => l.key === r.key);
      return matches.length
        ? matches.map((l) => ({ ...r, joined: l.label }))
        : [{ ...r, joined: null as string | null }];
    });
  return {
    rows,
    max: rows.length,
    output,
    active:
      state.step > 0 ? [rows[Math.min(state.step, rows.length) - 1].id] : [],
    note:
      state.step === 0
        ? "No rows processed yet. Step forward to execute the operation."
        : scene.config.operation === "filter"
          ? `Processed ${state.step} rows using value ≥ ${state.parameters.threshold}.`
          : `Processed ${state.step} left rows; unmatched keys produce SQL NULL, and multiple right matches produce multiple rows.`,
  };
}
export const complement = (base: string) =>
  ({ A: "T", T: "A", C: "G", G: "C" })[base] || "";
export function dnaState(sequence: string, step: number) {
  if (
    !/^[ACGT]{6,16}$/.test(sequence) ||
    !Number.isInteger(step) ||
    step < 0 ||
    step > 4
  )
    throw new Error("Invalid DNA state");
  return {
    sequence,
    complement: sequence.split("").map(complement).join(""),
    stage: dnaStages[step],
    opened: step >= 1,
    primed: step >= 2,
    extended: step >= 3,
    sealed: step === 4,
  };
}
export function timelineEvents(
  scene: Extract<Scene, { type: "historical-timeline" }>,
) {
  return scene.config.eventIds
    .map((id) => ({ id, ...historicalEvents[id] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function spatialDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
