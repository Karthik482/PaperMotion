import { createHash } from "node:crypto";
import type { Scene } from "../scenes/schemas";
import { sceneProfiles } from "../scenes/profiles";
import {
  validateUniversalPlan,
  type TopicRecord,
  type TopicSummary,
} from "./schemas";
type Chapter = {
  title: string;
  scene: Scene;
  beginner: string;
  technical: string;
  question: string;
  options: string[];
  answer: number;
  feedback: string;
  misconception: string;
};
const gradient = (rate = 0.2, iterations = 5): Scene => ({
  type: "gradient-descent",
  title: "Follow the loss, not a decorative animation",
  description:
    "Change the learning rate, inspect individual updates, and compare the calculated loss.",
  assumptions: [
    "Scalar quadratic f(x)=x² with an exact derivative. This is not a trained neural network.",
  ],
  config: { a: 1, b: 0, c: 0, initialX: 4, learningRate: rate, iterations },
});
const scheduler = (
  partitions = 8,
  stages = 2,
): Extract<Scene, { type: "task-scheduler" }> => ({
  type: "task-scheduler",
  title: "From partitions to task waves",
  description:
    "Change executor capacity and dataset partitions. Step through running and completed task waves.",
  assumptions: [
    "Equal-duration tasks, sequential stage barriers, deterministic round-robin record distribution.",
    "No shuffle, I/O, locality, failures or speculative execution. Duration is a toy estimate, not a Spark benchmark.",
    "Records 1–24 are preserved between illustrative stages. The final operation sums them; extra stages do not add them again.",
  ],
  config: {
    partitions,
    executors: 2,
    slots: 1,
    taskDuration: 2,
    stages,
    records: 24,
    abstraction: "DataFrame",
  },
});
const economy = (demandShift = 0, supplyShift = 0): Scene => ({
  type: "supply-demand",
  title: "Find the intersection of two assumptions",
  description:
    "Shift demand or supply and watch both the curves and equilibrium recalculate.",
  assumptions: [
    "Inverse linear curves use illustrative price and quantity units, not an observed market.",
    "Static competitive model. No dynamics, policy, uncertainty or market power. A negative crossing is outside the feasible domain.",
  ],
  config: {
    demandIntercept: 100,
    demandSlope: 1,
    supplyIntercept: 20,
    supplySlope: 1,
    demandShift,
    supplyShift,
  },
});
const dna = (sequence = "ACGTACGT"): Scene => ({
  type: "dna-replication",
  title: "Watch a local replication fork change",
  description:
    "Step through separation, priming, extension and joining. Inspect complementary bases and toggle enzyme labels.",
  assumptions: [
    "Illustrative local fork, not molecular dynamics. Synthesized DNA grows 5′→3′ on both strands.",
    "Okazaki fragments, primers and enzyme positions are schematic. Primer replacement and joining are condensed into one stage.",
    "The complete mechanism involves more proteins, proofreading and origins than this diagram shows.",
  ],
  config: { sequence, showEnzymes: true },
});
const history = (
  eventIds: Extract<
    Scene,
    { type: "historical-timeline" }
  >["config"]["eventIds"],
  comparison = false,
): Scene => ({
  type: "historical-timeline",
  title: "Read events at their actual dates",
  description:
    "Select an Apollo milestone, inspect NASA evidence, and compare preparation with flight-test tracks.",
  assumptions: [
    "A curated subset of Apollo milestones, not a complete history.",
    "Dates use UTC calendar days. Temporal distance is computed; temporal order alone does not prove causation.",
    "No map is shown: this catalog does not contain reliable geographic reconstruction.",
  ],
  config: { eventIds, comparison },
});
function record(
  slug: string,
  title: string,
  domain: string,
  overview: string,
  chapters: Chapter[],
): TopicRecord {
  const id = createHash("sha256")
    .update(`papermotion-reference:v1:${slug}`)
    .digest("hex");
  const topic = title,
    plan = validateUniversalPlan(
      {
        title,
        domain,
        overview,
        prerequisites: [],
        objectives: chapters.map((c) => c.title),
        limitations: [
          ...new Set(chapters.flatMap((c) => c.scene.assumptions)),
        ].slice(0, 8),
        steps: chapters.map((c, i) => ({
          id: `step-${i + 1}`,
          title: c.title,
          dependsOn: i ? [`step-${i}`] : [],
          beginner: c.beginner,
          technical: c.technical,
          example:
            "Inspect the starting state and change the controls to compare outcomes.",
          misconception: c.misconception,
          experience: {
            templateId: "none",
            scene: c.scene,
            rationale: c.scene.description,
            suggestedInteraction: c.scene.description,
            intent: {
              objective: c.title,
              conceptType: c.scene.type,
              family: sceneProfiles[c.scene.type].families[0],
              fidelity: sceneProfiles[c.scene.type].fidelity,
              manipulation: c.scene.description,
              outcome: c.technical,
            },
          },
          check: {
            question: c.question,
            options: c.options,
            answer: c.answer,
            feedback: c.feedback,
          },
        })),
      },
      topic,
    );
  return {
    id,
    topic,
    createdAt: "2026-10-09T00:00:00.000Z",
    model: "PaperMotion authored reference",
    reference: true,
    version: 3,
    level: "beginner",
    plan,
  };
}
const lessons = [
  record(
    "gradient-descent",
    "Gradient descent",
    "Mathematics",
    "Explore the relationship between step size, convergence and loss in a fully computed one-dimensional model.",
    [
      {
        title: "Take five calculated steps",
        scene: gradient(),
        beginner:
          "Imagine walking downhill by checking the slope at your feet. The learning rate sets how far you move. Here the starting point is x=4 and the loss is x². Five updates at rate 0.2 reduce the loss to about 0.0967. Change the iteration slider to inspect each step.",
        technical:
          "For f(x)=x², ∇f=2x and xₙ₊₁=(1−2η)xₙ. At η=0.2, x₅=4(0.6)⁵=0.31104 and f(x₅)=0.0967458816.",
        question:
          "What changes when you increase the number of updates at learning rate 0.2?",
        options: [
          "Loss decreases toward zero",
          "The derivative becomes random",
          "The starting x changes",
        ],
        answer: 0,
        feedback:
          "Each update multiplies x by 0.6, so the squared loss decreases.",
        misconception:
          "The dot is computed from the update equation; it is not a suggested path drawn by AI.",
      },
      {
        title: "Cross the minimum without diverging",
        scene: gradient(0.6),
        beginner:
          "A larger step can overshoot the bottom and land on the other side. That does not always mean failure. With rate 0.6, x changes sign each step while its magnitude gets smaller.",
        technical:
          "At η=0.6, the update multiplier is −0.2. Its absolute value is less than one, so alternating iterates converge. Compare rate 0.2 with 0.6 at the same iteration count.",
        question: "Does crossing the minimum always imply divergence?",
        options: [
          "Yes, every overshoot diverges",
          "No, alternating updates can shrink",
          "Only the plotted color determines it",
        ],
        answer: 1,
        feedback:
          "A multiplier between −1 and 0 gives oscillating convergence.",
        misconception:
          "Overshoot and divergence are different: inspect the magnitude as well as the sign.",
      },
      {
        title: "Find the stability boundary",
        scene: gradient(1, 8),
        beginner:
          "At rate 1, the point bounces between 4 and −4 without improving its loss. Increase the rate slightly to see divergence, or lower it to restore convergence. Reset returns to this chapter’s starting settings.",
        technical:
          "The recurrence converges when |1−2η|<1, meaning 0<η<1 for this quadratic. At η=1 the loss remains 16; above 1 its magnitude grows. The renderer stops at a bounded numerical display limit.",
        question: "Which rate converges for this particular quadratic?",
        options: ["1.2", "1", "0.4"],
        answer: 2,
        feedback: "At rate 0.4 the multiplier is 0.2, so updates shrink.",
        misconception:
          "There is no universal good learning rate. The stability condition depends on curvature.",
      },
    ],
  ),
  record(
    "pyspark",
    "PySpark distributed execution",
    "Computer science",
    "Separate programming abstractions from runtime components, then execute a transparent local task model.",
    [
      {
        title: "Separate the driver from the workers",
        scene: scheduler(4, 1),
        beginner:
          "A DataFrame describes distributed data and operations. The Driver coordinates execution, the Cluster Manager allocates resources, and Executors run Tasks. Each partition becomes a task in this simplified stage. Click a partition to inspect its records.",
        technical:
          "Four partitions on two one-slot executors require ceil(4/2)=2 waves. With two-second tasks, one idealized stage takes four seconds. Assignment is deterministic here; real Spark also considers locality and available resources.",
        question: "Which runtime component runs a task?",
        options: ["Executor", "DataFrame", "Cluster Manager"],
        answer: 0,
        feedback:
          "Executors run tasks. A DataFrame is a programming abstraction, and the Cluster Manager allocates resources.",
        misconception:
          "A DataFrame or RDD is not an executor. Python API objects and runtime processes are different entities.",
      },
      {
        title: "Change capacity and cross a stage barrier",
        scene: scheduler(),
        beginner:
          "More available slots can run more partitions at the same time. Increase executor count or slots per executor and compare the estimated time. Step forward to watch tasks run, finish, and wait for the next stage.",
        technical:
          "For eight partitions, two executors, one slot each, two stages and two-second tasks, duration=2×ceil(8/2)×2=16 s. Four executors reduce it to eight seconds in this model. A stage barrier prevents dependent-stage tasks from starting early.",
        question:
          "With eight partitions and four parallel slots, how many waves does one stage need?",
        options: ["Eight", "Two", "Four"],
        answer: 1,
        feedback: "ceil(8/4)=2 waves per stage.",
        misconception:
          "Doubling executors does not always halve real job time. Shuffle, skew, I/O and overhead are deliberately omitted.",
      },
      {
        title: "Verify the result survives repartitioning",
        scene: {
          ...scheduler(6, 2),
          config: {
            ...(scheduler(6, 2) as Extract<Scene, { type: "task-scheduler" }>)
              .config,
            abstraction: "RDD",
          },
        },
        beginner:
          "Change the number of partitions, then run to completion. The records are still the integers 1 through 24. Scheduling changes how work is grouped and when it finishes; the final sum stays 300.",
        technical:
          "Round-robin partitioning preserves each input record exactly once. The toy final operation computes Σᵢ₌₁²⁴i=24×25/2=300. Intermediate stages preserve the input, so stage count changes task work rather than multiplying the result.",
        question: "What should repartitioning preserve for this sum?",
        options: [
          "The number of task waves",
          "The final sum of 300",
          "The assignment of every record to its old partition",
        ],
        answer: 1,
        feedback:
          "Repartitioning changes task grouping, not the records or their sum.",
        misconception:
          "An RDD is another distributed programming abstraction. This bounded local scheduler does not execute actual Spark code.",
      },
    ],
  ),
  record(
    "supply-demand",
    "Supply and demand",
    "Economics",
    "Move assumptions, inspect recalculated intersections, and distinguish demand shifts from supply shifts.",
    [
      {
        title: "Locate a market intersection",
        scene: economy(),
        beginner:
          "Demand slopes downward: fewer units are wanted at a higher price. Supply slopes upward: more units are offered at a higher price. Their intersection has Q=40 and P=60 in these illustrative units.",
        technical:
          "With Pᴅ=100−Q and Pˢ=20+Q, solve 100−Q=20+Q. Q*=40 and P*=60. The engine solves the configured linear equations whenever a slider changes.",
        question: "At the intersection, which two values agree?",
        options: [
          "The demand and supply prices at the same quantity",
          "The slopes of both curves",
          "The two intercepts",
        ],
        answer: 0,
        feedback:
          "Both inverse curves return the same price at equilibrium quantity.",
        misconception:
          "These are assumed curves, not fitted observations or a forecast of a real market.",
      },
      {
        title: "Shift demand and compare",
        scene: economy(20),
        beginner:
          "A demand shift changes how much buyers are willing to pay at every quantity. Here adding 20 to the demand curve moves the intersection to Q=50 and P=70. Change Demand shift and compare with the chapter’s starting curves.",
        technical:
          "Holding slopes and supply fixed, a +20 inverse-demand shift changes quantity by 20/(1+1)=10 and price by 10. Comparison uses this chapter’s configured baseline, not the preceding chapter.",
        question:
          "In this model, an upward demand shift changes equilibrium how?",
        options: [
          "Price and quantity both increase",
          "Price falls and quantity rises",
          "Both stay fixed",
        ],
        answer: 0,
        feedback:
          "With upward-sloping supply, higher demand raises both equilibrium price and quantity.",
        misconception:
          "Moving along a curve is not shifting the curve. The shift parameter changes its intercept.",
      },
      {
        title: "Interpret a supply shift correctly",
        scene: economy(0, 20),
        beginner:
          "Raising the inverse supply curve means a higher price is required to offer the same quantity. It is a contraction of supply, not an increase. Here Q falls to 30 while P rises to 70. Try a negative Supply shift for the opposite change.",
        technical:
          "Q*=(100−20−20)/(1+1)=30 and P*=20+20+30=70. A positive supply-shift parameter raises the inverse supply intercept; a negative shift lowers it. Negative-price or negative-quantity crossings are reported as infeasible.",
        question: "What does a positive inverse-supply shift mean here?",
        options: [
          "Supply expands at every price",
          "Offering the same quantity requires a higher price",
          "The demand slope becomes negative",
        ],
        answer: 1,
        feedback:
          "The model shifts inverse supply upward, representing contraction rather than expansion.",
        misconception:
          "The parameter sign is tied to the inverse-price equation. Read the equation before interpreting an economic shift.",
      },
    ],
  ),
  record(
    "dna-replication",
    "DNA replication",
    "Biology",
    "Follow a changing molecular schematic and inspect complementary pairing, enzyme roles, and semiconservative outcomes.",
    [
      {
        title: "Open the template and start synthesis",
        scene: dna(),
        beginner:
          "DNA strands are complementary: A pairs with T and C with G. Step forward to separate the templates, then add RNA primers. Click a base to highlight its complementary partner. Toggle enzyme annotations to focus on the strands.",
        technical:
          "Helicase separates the templates. Primase supplies RNA primers with a free 3′ end. DNA polymerases extend from that end by adding nucleotides, so new DNA is synthesized 5′→3′.",
        question: "What provides the starting 3′ end for DNA synthesis?",
        options: [
          "An RNA primer",
          "A completed daughter chromosome",
          "Ligase alone",
        ],
        answer: 0,
        feedback:
          "Primase produces an RNA primer that supplies a 3′ end for polymerase extension.",
        misconception:
          "Polymerase does not begin a new strand without a primer in this mechanism.",
      },
      {
        title: "Compare leading and lagging synthesis",
        scene: dna("GGCATTGC"),
        beginner:
          "The templates point in opposite directions. Both new strands still grow 5′→3′. One can extend continuously toward the fork; the other forms short Okazaki fragments. Advance to Extend strands to see the difference.",
        technical:
          "Antiparallel templates impose continuous leading-strand and discontinuous lagging-strand synthesis at a local fork. Fragment gaps in the schematic communicate discontinuity; they do not represent measured fragment lengths or 3′→5′ synthesis.",
        question: "In which direction is new DNA synthesized?",
        options: [
          "5′→3′ on both strands",
          "3′→5′ on the lagging strand",
          "Either direction randomly",
        ],
        answer: 0,
        feedback:
          "Both strands are synthesized 5′→3′; the lagging strand achieves this through separate fragments.",
        misconception:
          "Lagging-strand synthesis is discontinuous, not chemically reversed.",
      },
      {
        title: "Finish two semiconservative duplexes",
        scene: dna("ATGCCGTA"),
        beginner:
          "At the final stage, primers have been replaced and gaps sealed. Each daughter duplex contains one original strand and one newly synthesized strand. Step backward to compare the unjoined fragments with the completed state.",
        technical:
          "Primer removal and DNA replacement precede ligase-mediated sealing. This schematic combines those operations in its final stage. Semiconservative replication retains one parental strand in each of the two daughter duplexes.",
        question: "What does each daughter duplex contain?",
        options: [
          "Two entirely new strands",
          "One parental strand and one new strand",
          "Only the parental strands",
        ],
        answer: 1,
        feedback:
          "Each daughter duplex retains one old strand and includes one new strand.",
        misconception:
          "Semiconservative does not mean one old duplex and one entirely new duplex.",
      },
    ],
  ),
  record(
    "apollo",
    "Apollo: from preparation to landing",
    "History",
    "Explore six sourced milestones at their recorded dates, inspect evidence, and compare distinct mission tracks.",
    [
      {
        title: "Inspect preparation and its consequences",
        scene: history(["apollo1-fire", "apollo7-launch"]),
        beginner:
          "Select the Apollo 1 fire and read the NASA evidence. The ground-test tragedy was followed by redesigns before the successful Apollo 7 crewed flight. The timeline calculates the days between these recorded dates.",
        technical:
          "Dates and event descriptions resolve from an audited NASA catalog. The timeline separates chronological evidence from causal interpretation: the interval is calculable, while a full account of program changes requires the source narrative.",
        question: "What does an interval between events establish by itself?",
        options: [
          "That the earlier event caused every later change",
          "Their temporal separation",
          "That the events happened in the same place",
        ],
        answer: 1,
        feedback:
          "Calendar dates establish temporal separation. Causal claims require additional evidence.",
        misconception:
          "A timeline does not prove causality merely by placing an event earlier.",
      },
      {
        title: "Follow successive flight-test milestones",
        scene: history([
          "apollo7-launch",
          "apollo8-orbit",
          "apollo9-launch",
          "apollo10-launch",
        ]),
        beginner:
          "Select Earth-orbit and lunar milestones. Apollo 8 reached lunar orbit; Apollo 9 tested the lunar module in Earth orbit; Apollo 10 rehearsed landing procedures without landing. The evidence panel changes with the selected event.",
        technical:
          "These milestones are different operations, not interchangeable “launch” dates. Apollo 8 uses its lunar-orbit milestone date; other test missions use launch dates. Evidence labels and dates remain tied to the catalog entry.",
        question:
          "Which mission in this selection rehearsed landing without landing?",
        options: ["Apollo 10", "Apollo 9", "Apollo 7"],
        answer: 0,
        feedback:
          "Apollo 10 rehearsed lunar landing operations without a surface landing.",
        misconception:
          "Do not treat every mission date as a landing date; inspect the event label and evidence.",
      },
      {
        title: "Compare preparation, Earth orbit and lunar missions",
        scene: history(
          [
            "apollo1-fire",
            "apollo7-launch",
            "apollo8-orbit",
            "apollo9-launch",
            "apollo10-launch",
            "apollo11-landing",
          ],
          true,
        ),
        beginner:
          "Compare the preparation, Earth-orbit and lunar tracks, then select Apollo 11’s landing. Dates and descriptions come from NASA, not generated citations. No map is shown because this lesson has no reliable geographic dataset.",
        technical:
          "Track grouping is an authored categorization of sourced events. Selecting a milestone updates the source excerpt, date and elapsed-day calculation; it does not extrapolate unrecorded events or map locations.",
        question: "Why does this lesson avoid a historical map?",
        options: [
          "All events happened at one location",
          "The catalog contains no validated geographic reconstruction",
          "Maps cannot ever teach history",
        ],
        answer: 1,
        feedback:
          "Geographic claims need reliable data; a sourced timeline is the honest supported visualization here.",
        misconception:
          "A polished map would not make an unsupported location or reconstruction reliable.",
      },
    ],
  ),
];
export const referenceLessons = lessons;
export const referenceSummaries: TopicSummary[] = lessons.map((r) => ({
  id: r.id,
  topic: r.topic,
  title: r.plan.title,
  domain: r.plan.domain,
  stepCount: r.plan.steps.length,
  createdAt: r.createdAt,
  version: r.version,
  level: r.level,
}));
export function referenceLesson(id: string) {
  const lesson = lessons.find((r) => r.id === id);
  return lesson ? structuredClone(lesson) : null;
}
