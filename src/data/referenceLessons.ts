import { lessonSchema } from '@/lib/lessonSchemas';
export const taskSchedulerLesson = lessonSchema.parse({
  title: 'How does a CPU work?',
  modules: [
    {
      id: 'overview',
      title: 'CPU Architecture',
      eyebrow: '01 / TASK SCHEDULER',
      visualization: 'task-scheduler',
      description:
        'A driver plans tasks across a cluster. Executors run jobs in parallel. Tasks progress through stages and execute records.',
      takeaway:
        'Spark-style scheduling splits data into partitions. Drivers distribute tasks over executors with limited slots. Equal-duration tasks run concurrently.',
      question: 'What best describes how tasks are distributed?',
      options: [
        'Randomly to any executor',
        'In order by partition index',
        'Based on data locality only',
        'Sequentially to first available slot',
      ],
      answer: 1,
      feedback: 'Partitions become one task per stage. The driver assigns tasks across executors respecting slot limits.',
    },
    {
      id: 'executors',
      title: 'Cluster Management',
      eyebrow: '02 / EXECUTORS',
      visualization: 'task-scheduler',
      description:
        'The cluster manager allocates executor resources. Each executor runs multiple concurrent task slots. Slot capacity varies by configuration.',
      takeaway:
        'Executors provide parallel processing power. Slots limit concurrent tasks per executor. Capacity = executors × slots.',
      question: 'What is the maximum tasks running simultaneously?',
      options: [
        'Number of partitions',
        'Number of executors',
        'Number of slots per executor',
        'Executors × slots',
      ],
      answer: 3,
      feedback: 'Maximum concurrent tasks equals total executor slots, not just executors or partitions.',
    },
    {
      id: 'tasks',
      title: 'Task Execution',
      eyebrow: '03 / TASKS',
      visualization: 'task-scheduler',
      description:
        'Tasks execute in waves. Each wave has stages: prepare, run, complete. Tasks move through status changes: queued → running → complete.',
      takeaway:
        'Tasks progress through waves and stages. Each stage processes all partitions. Task status tracks progress from queued to running to complete.',
      question: 'Which task status indicates active work?',
      options: ['queued', 'running', 'complete', 'idle'],
      answer: 1,
      feedback: 'Running tasks are currently executing; queued tasks wait for their turn; complete tasks have finished.',
    },
    {
      id: 'comparison',
      title: 'Baseline Comparison',
      eyebrow: '04 / COMPARISON',
      visualization: 'task-scheduler',
      description:
        'Compare current configuration with baseline. The comparison view shows performance differences. Adjust partitions, executors, and slots to optimize.',
      takeaway:
        'Comparison highlights efficiency gains. Equal-duration tasks, no shuffle overhead, and balanced loading improve throughput.',
      question: 'What enables equal-duration tasks without network overhead?',
      options: [
        'Shared memory architecture',
        'Static task assignment',
        'No shuffle or network transfer',
        'Pre-scheduled task routes',
      ],
      answer: 2,
      feedback: 'The simplified model uses no shuffle overhead. Tasks execute locally on partitions without data transfer between executors.',
    },
    {
      id: 'check',
      title: 'Bring it together',
      eyebrow: '05 / KNOWLEDGE CHECK',
      visualization: 'check',
      description:
        'Connect the concepts: drivers plan stages, cluster managers allocate resources, tasks execute in parallel with status tracking. Understand distributed task scheduling.',
      takeaway:
        'Task scheduling distributes work across a cluster. Drivers plan stages, cluster managers allocate resources, tasks execute in parallel with status tracking.',
      question: 'Which component plans stages and schedules tasks?',
      options: [
        'Cluster Manager',
        'Executor',
        'Driver',
        'Scheduler',
      ],
      answer: 2,
      feedback: 'The Driver plans stages and distributes tasks across executors respecting slot limits.',
    },
  ],
});
export const supplyDemandLesson = lessonSchema.parse({
  title: 'Supply and Demand Equilibrium',
  modules: [
    {
      id: 'overview',
      title: 'Market Basics',
      eyebrow: '01 / SUPPLY-DEMAND',
      visualization: 'supply-demand',
      description:
        'Linear demand: P = a − bQ + shiftD. Linear supply: P = c + dQ + shiftS. Curves intersect at equilibrium price and quantity.',
      takeaway:
        'Demand slopes downward, supply slopes upward. Shifts change intercepts. Equilibrium occurs where price equals both curves.',
      question: 'What determines equilibrium quantity?',
      options: [
        'Intersection of curves',
        'Maximum price',
        'Minimum quantity',
        'Average of intercepts',
      ],
      answer: 0,
      feedback: 'Equilibrium quantity solves both equations simultaneously, making price equal across demand and supply.',
    },
    {
      id: 'demand',
      title: 'Demand Curve',
      eyebrow: '02 / DEMAND',
      visualization: 'supply-demand',
      description:
        'Demand intercept a. Demand slope b. Demand shift changes intercept. Price decreases as quantity increases.',
      takeaway:
        'Higher intercept means higher price at zero quantity. Steeper slope means price changes less with quantity. Positive shift raises price.',
      question: 'Which parameter affects the price at zero quantity?',
      options: ['Slope b', 'Intercept a', 'ShiftD', 'Supply intercept c'],
      answer: 1,
      feedback: 'Demand intercept a directly sets the price when no quantity is sold (Q=0).',
    },
    {
      id: 'supply',
      title: 'Supply Curve',
      eyebrow: '03 / SUPPLY',
      visualization: 'supply-demand',
      description:
        'Supply intercept c. Supply slope d. Supply shift changes intercept. Price increases as quantity increases.',
      takeaway:
        'Supply intercept c sets base price. Slope d determines price increase rate. Positive shift raises price at all quantities.',
      question: 'Which parameter affects the price at zero quantity for supply?',
      options: ['Slope d', 'Intercept c', 'ShiftS', 'Demand intercept a'],
      answer: 1,
      feedback: 'Supply intercept c directly determines the price when no quantity is produced (Q=0).',
    },
    {
      id: 'equilibrium',
      title: 'Market Equilibrium',
      eyebrow: '04 / EQUILIBRIUM',
      visualization: 'supply-demand',
      description:
        'Solve for equilibrium: Q* = (a + shiftD − c − shiftS) / (b + d), P* = c + shiftS + dQ*. Feasible if Q* ≥ 0, P* ≥ 0.',
      takeaway:
        'Equilibrium requires solving both equations. Feasibility ensures nonnegative price and quantity. Shifts change equilibrium point.',
      question: 'What formula gives equilibrium quantity?',
      options: [
        '(a − c) / (b + d)',
        '(a + c) / (b − d)',
        '(a + shiftD − c − shiftS) / (b + d)',
        '(a − c + shiftD + shiftS) / (b + d)',
      ],
      answer: 2,
      feedback: 'Equilibrium quantity subtracts supply parameters and adds demand shifts, dividing by total slope (b + d).',
    },
    {
      id: 'comparison',
      title: 'Compare Configurations',
      eyebrow: '05 / COMPARISON',
      visualization: 'supply-demand',
      description:
        'Compare baseline vs. current market. Shift curves and solve new equilibrium. Observe how intercept and slope changes affect price and quantity.',
      takeaway:
        'Demand shifts increase price and quantity; supply shifts decrease price and increase quantity. Combined shifts produce net effects.',
      question: 'What happens when demand shifts right (positive shiftD)?',
      options: [
        'Price decreases, quantity decreases',
        'Price increases, quantity increases',
        'Price stays same, quantity stays same',
        'Price increases, quantity decreases',
      ],
      answer: 1,
      feedback: 'Rightward demand shift raises price at each quantity, increasing equilibrium price and quantity.',
    },
    {
      id: 'check',
      title: 'Bring it together',
      eyebrow: '06 / KNOWLEDGE CHECK',
      visualization: 'check',
      description:
        'Connect: demand slopes down, supply slopes up. Shifts change intercepts. Equilibrium where both curves equal.',
      takeaway:
        'Demand: P = a − bQ + shiftD. Supply: P = c + dQ + shiftS. Equilibrium solves both equations simultaneously.',
      question: 'Which equation describes demand curve?',
      options: ['P = a + bQ', 'P = a − bQ', 'P = c + dQ', 'P = c − dQ'],
      answer: 1,
      feedback: 'Demand has negative slope, so price equals intercept minus slope times quantity, plus shift.',
    },
  ],
});
export const dnaReplicationLesson = lessonSchema.parse({
  title: 'DNA Replication Process',
  modules: [
    {
      id: 'overview',
      title: 'Fork Initiation',
      eyebrow: '01 / DNA-REPLICATION',
      visualization: 'dna-replication',
      description:
        'A parental duplex opens into a fork. Two templates become exposed. Helicase separates strands. Primase lays RNA primers.',
      takeaway:
        'Replication starts with local fork opening. Templates provide strands for new synthesis. Enzyme layers coordinate the process.',
      question: 'What starts DNA replication?',
      options: [
        'Primer synthesis',
        'Enzyme binding',
        'Fork opening',
        'Strand synthesis',
      ],
      answer: 2,
      feedback: 'Fork opening exposes parental strands for templating. This is the first step in replication.',
    },
    {
      id: 'primers',
      title: 'Primer Laying',
      eyebrow: '02 / PRIMERS',
      visualization: 'dna-replication',
      description:
        'Primase provides RNA primers. DNA polymerase needs existing 3′ end. Three primers lay on both templates. Diagram shows positions.',
      takeaway:
        'RNA primers initiate new synthesis. They provide 3′ OH groups. Each template gets multiple primers for leading and lagging strands.',
      question: 'Why are RNA primers needed?',
      options: [
        'To start synthesis',
        'To stabilize DNA',
        'To separate strands',
        'To encode proteins',
      ],
      answer: 0,
      feedback: 'Primase creates RNA primers that DNA polymerase uses to begin new DNA synthesis on both templates.',
    },
    {
      id: 'extension',
      title: 'Strand Extension',
      eyebrow: '03 / EXTENSION',
      visualization: 'dna-replication',
      description:
        'Polymerase extends strands 5′→3′. Leading strand grows continuously. Lagging strand forms Okazaki fragments. Fragments joined later.',
      takeaway:
        'Leading strand synthesizes continuously. Lagging strand synthesizes in fragments due to antiparallel direction. Both use same enzyme.',
      question: 'In what direction does DNA polymerase extend?',
      options: ['3′→5′', '5′→3′', 'Bidirectional', 'Randomly'],
      answer: 1,
      feedback: 'DNA polymerase adds nucleotides to the 3′ end, extending DNA in the 5′→3′ direction.',
    },
    {
      id: 'ligation',
      title: 'Fragment Joining',
      eyebrow: '04 / LIGATION',
      visualization: 'dna-replication',
      description:
        'Ligase seals gaps between Okazaki fragments. Primers removed and replaced with DNA. Both daughter duplexes complete.',
      takeaway:
        'Ligase joins fragments. DNA replaces RNA primers. Two daughter duplexes each retain one parental strand.',
      question: 'Which enzyme joins DNA fragments?',
      options: ['DNA polymerase', 'Helicase', 'Ligase', 'Primase'],
      answer: 2,
      feedback: 'Ligase creates phosphodiester bonds to seal nicks between DNA fragments.',
    },
    {
      id: 'stages',
      title: 'Stage Progression',
      eyebrow: '05 / STAGES',
      visualization: 'dna-replication',
      description:
        'Stages: parent, open fork, primed, extended, sealed. Progress through 5 steps. Enzyme visibility toggles with layer controls.',
      takeaway:
        'Each stage represents a key milestone. Progress is sequential and irreversible. Enzyme layers control visibility.',
      question: 'How many stages does DNA replication have?',
      options: ['3', '4', '5', '6'],
      answer: 2,
      feedback: 'Five distinct stages: parent, open fork, primed, extended, sealed.',
    },
    {
      id: 'check',
      title: 'Bring it together',
      eyebrow: '06 / KNOWLEDGE CHECK',
      visualization: 'check',
      description:
        'Connect: fork opens, primers laid, strands extended, fragments joined. Enzyme layers coordinate process.',
      takeaway:
        'DNA replication: parental duplex separates, primers initiate synthesis, polymerase extends strands, ligase joins fragments.',
      question: 'What is the direction of new DNA synthesis?',
      options: ['5′→3′', '3′→5′', 'Both directions', 'Circular'],
      answer: 0,
      feedback: 'DNA polymerase synthesizes new DNA in the 5′→3′ direction on both leading and lagging strands.',
    },
  ],
});
export const historicalTimelineLesson = lessonSchema.parse({
  title: 'Apollo Space Program Timeline',
  modules: [
    {
      id: 'overview',
      title: 'Mission Chronology',
      eyebrow: '01 / HISTORICAL-TIMELINE',
      visualization: 'historical-timeline',
      description:
        'Apollo missions in chronological order. Each event includes date, description, track. Select events to compare timelines.',
      takeaway:
        'Events ordered by date. NASA evidence source. Earth-orbit vs. lunar missions tracks. Compare multiple missions simultaneously.',
      question: 'Which event came first?',
      options: [
        'Apollo 11 landing',
        'Apollo 7 launch',
        'Apollo 8 orbit',
        'Apollo 1 fire',
      ],
      answer: 3,
      feedback: 'Apollo 1 fire occurred January 27, 1967, before any launch events.',
    },
    {
      id: 'apollo7',
      title: 'Apollo 7 Launch',
      eyebrow: '02 / APOLLO7',
      visualization: 'historical-timeline',
      description:
        'October 11, 1968. First crewed Earth-orbit flight. Tested Apollo spacecraft. Preparation mission for lunar flights.',
      takeaway:
        'Earth-orbit test. Validated systems. Preparation for lunar missions. No lunar surface exploration.',
      question: 'Which Apollo mission tested lunar module?',
      options: [
        'Apollo 7',
        'Apollo 8',
        'Apollo 9',
        'Apollo 10',
      ],
      answer: 2,
      feedback: 'Apollo 9 launched lunar module for the first time in Earth orbit.',
    },
    {
      id: 'apollo8',
      title: 'Apollo 8 Orbit',
      eyebrow: '03 / APOLLO8',
      visualization: 'historical-timeline',
      description:
        'December 24, 1968. Crew orbited the Moon. Photographed Earthrise. First humans to see lunar surface from orbit.',
      takeaway:
        'First crewed lunar orbit. Moon photography. Earthrise imagery. No landing. Test for lunar operations.',
      question: 'What famous photo did Apollo 8 capture?',
      options: [
        'Earthrise',
        'Moon surface',
        'Earth from space',
        'Crew portrait',
      ],
      answer: 0,
      feedback: 'Apollo 8 captured the famous Earthrise photo from lunar orbit.',
    },
    {
      id: 'apollo9',
      title: 'Apollo 9 Launch',
      eyebrow: '04 / APOLLO9',
      visualization: 'historical-timeline',
      description:
        'March 3, 1969. Lunar module tested with crew in Earth orbit. Verified lunar operations. Prep for lunar landing.',
      takeaway:
        'First crewed LM test. Lunar module operations verified. Earth orbit only. Foundation for lunar landing.',
      question: 'What was Apollo 9 primarily testing?',
      options: [
        'Lunar module',
        'Command module',
        'Spacesuit systems',
        'Life support',
      ],
      answer: 0,
      feedback: 'Apollo 9 tested the lunar module with a crew for the first time.',
    },
    {
      id: 'apollo10',
      title: 'Apollo 10 Launch',
      eyebrow: '05 / APOLLO10',
      visualization: 'historical-timeline',
      description:
        'May 18, 1969. Rehearsed lunar-landing operations. Did not land. Crew tested LM descent to 15km above surface.',
      takeaway:
        'Full lunar descent rehearsal. LM descended close to surface. Did not land. Final dress rehearsal before Apollo 11.',
      question: 'How close did Apollo 10 descend to Moon surface?',
      options: ['15km', '50km', '100km', '150km'],
      answer: 0,
      feedback: 'Apollo 10 descended to only 15km above the lunar surface before returning to lunar orbit.',
    },
    {
      id: 'apollo11',
      title: 'Apollo 11 Landing',
      eyebrow: '06 / APOLLO11',
      visualization: 'historical-timeline',
      description:
        'July 20, 1969. Armstrong and Aldrin landed on Moon. Collins remained in lunar orbit. Historic first human Moon landing.',
      takeaway:
        'First humans on Moon. Armstrong set foot. Collins orbited. Legacy of human space exploration.',
      question: 'Who was the first human to walk on the Moon?',
      options: [
        'Neil Armstrong',
        'Buzz Aldrin',
        'Michael Collins',
        'John Glenn',
      ],
      answer: 0,
      feedback: 'Neil Armstrong became the first human to walk on the Moon.',
    },
  ],
});
export const dataExplorerLesson = lessonSchema.parse({
  title: 'Data Explorer: Filter, Join, Sort',
  modules: [
    {
      id: 'overview',
      title: 'Data Operations',
      eyebrow: '01 / DATA-EXPLORER',
      visualization: 'data-explorer',
      description:
        'Filter: keep rows with value ≥ threshold. Left-join: match rows by key. Bubble-sort: compare adjacent values. Step through execution trace.',
      takeaway:
        'Filter selects based on numerical threshold. Left-join matches keys across tables. Bubble-sort compares adjacent pairs. All operations step through rows.',
      question: 'Which operation produces multiple output rows per input row?',
      options: ['filter', 'left-join', 'bubble-sort', 'none'],
      answer: 1,
      feedback: 'Left-join can produce multiple matches for a single input row, generating multiple output rows.',
    },
    {
      id: 'filter',
      title: 'Filter Rows',
      eyebrow: '02 / FILTER',
      visualization: 'data-explorer',
      description:
        'Select rows where value ≥ threshold. Step forward through rows. Processed count updates. Only rows meeting condition appear in output.',
      takeaway:
        'Threshold determines which rows survive. Higher threshold filters more rows. Operation resets on slider changes.',
      question: 'What happens when threshold increases?',
      options: [
        'More rows pass',
        'Fewer rows pass',
        'All rows pass',
        'Rows reset',
      ],
      answer: 1,
      feedback: 'Higher threshold means fewer rows meet the condition, so fewer rows pass the filter.',
    },
    {
      id: 'join',
      title: 'Left Join',
      excerpt: '06 / LEFT-JOIN',
      visualization: 'data-explorer',
      description:
        'Match input rows with right table by key. Multiple matches produce multiple output rows. Unmatched keys produce NULL.',
      takeaway:
        'Left-join preserves all input rows. Matches are by key equality. Multiple right matches expand output rows. NULL indicates no match.',
      question: 'What does NULL mean in a left join?',
      options: [
        'Zero value',
        'No match',
        'Empty string',
        'Default value',
      ],
      answer: 1,
      feedback: 'NULL means the input row had no matching key in the right table.',
    },
    {
      id: 'sort',
      title: 'Bubble Sort',
      eyebrow: '04 / BUBBLE-SORT',
      visualization: 'data-explorer',
      description:
        'Compare adjacent values. Swap if left > right. Step through passes. Each pass moves largest unsorted value to end.',
      takeaway:
        'Adjacent comparisons and swaps. Equal values preserve order. Stable sorting algorithm. Step through intermediate states.',
      question: 'What does bubble sort compare?',
      options: ['Adjacent pairs', 'Random pairs', 'Sorted pairs', 'Unsorted pairs'],
      answer: 0,
      feedback: 'Bubble sort compares adjacent pairs and swaps if they are out of order.',
    },
    {
      id: 'comparison',
      title: 'Compare Operations',
      eyebrow: '05 / COMPARISON',
      visualization: 'data-explorer',
      description:
        'Compare execution results across different operations. Step through traces. Observe differences in output and intermediate states.',
      takeaway:
        'Filter is threshold-based. Left-join is key-based. Bubble-sort is comparison-based. All step through rows.',
      question: 'Which operation requires a key column in the right table?',
      options: ['filter', 'left-join', 'bubble-sort', 'none'],
      answer: 1,
      feedback: 'Left-join requires a key column in the right table for matching. Filter and bubble-sort do not need keys.',
    },
    {
      id: 'check',
      title: 'Bring it together',
      eyebrow: '06 / KNOWLEDGE CHECK',
      visualization: 'check',
      description:
        'Connect: filter selects, left-join matches, bubble-sort compares. All step through rows with different execution logic.',
      takeaway:
        'Filter: threshold-based selection. Left-join: key-based matching with multiple outputs. Bubble-sort: adjacent comparison swaps.',
      question: 'Which operation produces multiple output rows per input row?',
      options: [
        'Filter',
        'Left-join',
        'Bubble-sort',
        'None',
      ],
      answer: 1,
      feedback: 'Left-join can produce multiple output rows when a single input row matches multiple right rows.',
    },
  ],
});
export const lessons = {
  taskScheduler: taskSchedulerLesson,
  supplyDemand: supplyDemandLesson,
  dnaReplication: dnaReplicationLesson,
  historicalTimeline: historicalTimelineLesson,
  dataExplorer: dataExplorerLesson,
};