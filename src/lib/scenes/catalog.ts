// Audited source records. AI selects IDs; it cannot supply dates, claims or URLs.
const nasa = "https://www.nasa.gov/specials/apollo50th/missions.html";
export const historicalEvents = {
  "apollo1-fire": { date:"1967-01-27", label:"Apollo 1 fire", description:"A ground-test fire killed the three astronauts; NASA redesigned spacecraft systems.", track:"Preparation", source:nasa },
  "apollo7-launch": { date:"1968-10-11", label:"Apollo 7 launches", description:"A crewed Earth-orbit flight tested the Apollo spacecraft.", track:"Earth orbit", source:nasa },
  "apollo8-orbit": { date:"1968-12-24", label:"Apollo 8 orbits the Moon", description:"The crew orbited the Moon and photographed Earthrise.", track:"Lunar missions", source:nasa },
  "apollo9-launch": { date:"1969-03-03", label:"Apollo 9 launches", description:"The lunar module was tested with a crew in Earth orbit.", track:"Earth orbit", source:nasa },
  "apollo10-launch": { date:"1969-05-18", label:"Apollo 10 launches", description:"The crew rehearsed lunar-landing operations without landing.", track:"Lunar missions", source:nasa },
  "apollo11-landing": { date:"1969-07-20", label:"Apollo 11 lands", description:"Armstrong and Aldrin landed on the Moon; Collins remained in lunar orbit.", track:"Lunar missions", source:nasa },
} as const;
export const historicalEventIds = Object.keys(historicalEvents) as [keyof typeof historicalEvents,...(keyof typeof historicalEvents)[]];
export const dnaStages = [
  {label:"Parent DNA",note:"Two complementary, antiparallel strands form the starting duplex. One local fork is illustrated."},
  {label:"Open the fork",note:"Helicase separates the strands. The exposed strands become templates; the diagram exaggerates spacing."},
  {label:"Lay primers",note:"Primase provides RNA primers. DNA polymerase needs an existing 3′ end; it cannot start a new strand alone."},
  {label:"Extend strands",note:"New DNA grows 5′→3′. At this fork the leading strand grows continuously; the lagging strand forms Okazaki fragments."},
  {label:"Replace & join",note:"Primer removal, DNA replacement and ligase seal the fragments. Two duplexes each retain one parental strand."},
] as const;
export const dnaSource="https://www.ncbi.nlm.nih.gov/books/NBK26850/";
export const sparkSource="https://spark.apache.org/docs/latest/cluster-overview.html";
export const economicSource="https://openstax.org/books/principles-economics-3e/pages/3-1-demand-supply-and-equilibrium-in-markets-for-goods-and-services";
