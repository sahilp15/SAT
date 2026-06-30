// Original, SAT-STYLE sample questions authored for this app.
// These are NOT from the College Board question bank — they exist so the app has
// clean, correctly-formatted data on first run (and for tests). Math expressions
// use inline LaTeX delimited by $...$ so KaTeX renders real notation.
//
// Your real questions come from `npm run import` over your own files in
// data/uploads/. These samples can be deleted any time from the admin page.

export interface SeedChoice {
  label: string;
  content: string;
  isCorrect: boolean;
  rationaleWrong?: string;
}

export interface SeedQuestion {
  externalId: string;
  section: "MATH" | "READING_WRITING";
  domain: string;
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  format: "MCQ" | "SPR";
  stimulus?: string | null;
  stem: string;
  correctAnswer: string;
  explanation: string;
  choices: SeedChoice[];
  requiresCalculator?: boolean;
  desmosRelevant?: boolean;
  isRegression?: boolean;
}

export const SAMPLE_QUESTIONS: SeedQuestion[] = [
  {
    externalId: "sample-math-001",
    section: "MATH",
    domain: "Algebra",
    skill: "Linear equations in one variable",
    difficulty: "EASY",
    format: "MCQ",
    stem: "If $3x - 8 = 7$, what is the value of $3x + 8$?",
    correctAnswer: "C",
    explanation:
      "Adding 8 to both sides of $3x - 8 = 7$ gives $3x = 15$. The question asks for $3x + 8$, so add 8 to 15 to get $23$.",
    choices: [
      { label: "A", content: "$5$", isCorrect: false, rationaleWrong: "This is the value of $x$, not $3x+8$." },
      { label: "B", content: "$15$", isCorrect: false, rationaleWrong: "This is the value of $3x$, not $3x+8$." },
      { label: "C", content: "$23$", isCorrect: true },
      { label: "D", content: "$31$", isCorrect: false, rationaleWrong: "This adds 16 instead of 8." },
    ],
  },
  {
    externalId: "sample-math-002",
    section: "MATH",
    domain: "Algebra",
    skill: "Systems of two linear equations",
    difficulty: "MEDIUM",
    format: "MCQ",
    stem: "Which of the following systems of linear equations has no solution?",
    correctAnswer: "A",
    explanation:
      "A system of two lines has no solution when the lines are parallel and distinct — same slope, different y-intercept. In $\\begin{cases} y = 6x + 3 \\\\ y = 6x + 9 \\end{cases}$ both slopes are 6 but the y-intercepts (3 and 9) differ, so the lines never meet.",
    choices: [
      { label: "A", content: "$\\begin{cases} y = 6x + 3 \\\\ y = 6x + 9 \\end{cases}$", isCorrect: true },
      { label: "B", content: "$\\begin{cases} y = 10 \\\\ y = 10x \\end{cases}$", isCorrect: false, rationaleWrong: "These lines intersect at $(0,10)$, so there is a solution." },
      { label: "C", content: "$\\begin{cases} y = 2x + 14 \\\\ y = 5x + 14 \\end{cases}$", isCorrect: false, rationaleWrong: "Different slopes means the lines cross once, at $(0,14)$." },
      { label: "D", content: "$\\begin{cases} x = 3 \\\\ y = 10 \\end{cases}$", isCorrect: false, rationaleWrong: "A vertical and a horizontal line intersect at $(3,10)$." },
    ],
  },
  {
    externalId: "sample-math-003",
    section: "MATH",
    domain: "Advanced Math",
    skill: "Quadratics",
    difficulty: "MEDIUM",
    format: "SPR",
    stem: "The function $f$ is defined by $f(x) = x^2 - 6x + 5$. What is the $x$-coordinate of the vertex of the graph of $y = f(x)$ in the $xy$-plane?",
    correctAnswer: "3",
    explanation:
      "For $f(x) = ax^2 + bx + c$, the vertex has $x = -\\dfrac{b}{2a}$. Here $a = 1$ and $b = -6$, so $x = -\\dfrac{-6}{2(1)} = 3$.",
    choices: [],
  },
  {
    externalId: "sample-math-004",
    section: "MATH",
    domain: "Advanced Math",
    skill: "Exponential functions",
    difficulty: "HARD",
    format: "MCQ",
    stem: "A culture of bacteria is modeled by $P(t) = 200(1.05)^t$, where $P(t)$ is the population $t$ hours after the culture begins. Which statement best describes the meaning of $1.05$ in this context?",
    correctAnswer: "B",
    explanation:
      "In an exponential model $P(t) = a \\cdot b^t$, the base $b = 1.05$ means the quantity is multiplied by 1.05 each hour — an increase of 5% per hour.",
    choices: [
      { label: "A", content: "The initial population is 1.05.", isCorrect: false, rationaleWrong: "The initial population is $P(0) = 200$." },
      { label: "B", content: "The population increases by 5% each hour.", isCorrect: true },
      { label: "C", content: "The population increases by 105 each hour.", isCorrect: false, rationaleWrong: "Exponential growth multiplies, it does not add a constant amount." },
      { label: "D", content: "The population doubles every 1.05 hours.", isCorrect: false, rationaleWrong: "A growth factor of 1.05 is far slower than doubling." },
    ],
  },
  {
    externalId: "sample-math-005",
    section: "MATH",
    domain: "Problem-Solving and Data Analysis",
    skill: "Percentages",
    difficulty: "EASY",
    format: "MCQ",
    stem: "A jacket originally priced at \\$80 is on sale for 25% off. What is the sale price of the jacket?",
    correctAnswer: "C",
    explanation:
      "A 25% discount removes $0.25 \\times 80 = \\$20$, leaving $80 - 20 = \\$60$. Equivalently, the sale price is $0.75 \\times 80 = \\$60$.",
    choices: [
      { label: "A", content: "\\$20", isCorrect: false, rationaleWrong: "This is the amount of the discount, not the sale price." },
      { label: "B", content: "\\$55", isCorrect: false, rationaleWrong: "This subtracts \\$25 rather than 25%." },
      { label: "C", content: "\\$60", isCorrect: true },
      { label: "D", content: "\\$75", isCorrect: false, rationaleWrong: "This takes off only \\$5." },
    ],
  },
  {
    externalId: "sample-math-006",
    section: "MATH",
    domain: "Algebra",
    skill: "Linear equations in two variables",
    difficulty: "MEDIUM",
    format: "SPR",
    stem: "A line in the $xy$-plane passes through the points $(4, 6)$ and $(15, 24)$. What is the slope of the line?",
    correctAnswer: "18/11",
    explanation:
      "Slope is $\\dfrac{y_2 - y_1}{x_2 - x_1} = \\dfrac{24 - 6}{15 - 4} = \\dfrac{18}{11} \\approx 1.636$. Either $18/11$ or $1.636$ is an acceptable entry.",
    choices: [],
  },
  {
    externalId: "sample-math-007",
    section: "MATH",
    domain: "Geometry and Trigonometry",
    skill: "Right triangles and trigonometry",
    difficulty: "MEDIUM",
    format: "MCQ",
    stem: "In right triangle $ABC$, the right angle is at $C$, $\\sin A = \\dfrac{3}{5}$. What is $\\cos A$?",
    correctAnswer: "B",
    explanation:
      "If $\\sin A = \\frac{3}{5}$, the opposite side is 3 and the hypotenuse is 5, so the adjacent side is $\\sqrt{5^2 - 3^2} = 4$. Therefore $\\cos A = \\frac{4}{5}$.",
    choices: [
      { label: "A", content: "$\\dfrac{3}{5}$", isCorrect: false, rationaleWrong: "This is $\\sin A$, not $\\cos A$." },
      { label: "B", content: "$\\dfrac{4}{5}$", isCorrect: true },
      { label: "C", content: "$\\dfrac{5}{4}$", isCorrect: false, rationaleWrong: "Cosine of an acute angle cannot exceed 1." },
      { label: "D", content: "$\\dfrac{5}{3}$", isCorrect: false, rationaleWrong: "This is the reciprocal of $\\sin A$." },
    ],
  },
  {
    externalId: "sample-rw-001",
    section: "READING_WRITING",
    domain: "Craft and Structure",
    skill: "Words in Context",
    difficulty: "EASY",
    format: "MCQ",
    stimulus:
      "Marine biologist Ayana Johnson is known for making complex ocean science feel approachable. Rather than overwhelming her audiences with jargon, she ______ her explanations, stripping away technical detail so that listeners grasp the core idea.",
    stem: "Which choice completes the text with the most logical and precise word or phrase?",
    correctAnswer: "C",
    explanation:
      "The sentence says she strips away technical detail so listeners grasp the core idea — she makes the explanations simpler. 'Streamlines' means makes more efficient and simpler, matching this context.",
    choices: [
      { label: "A", content: "complicates", isCorrect: false, rationaleWrong: "The opposite of stripping away detail; contradicts the sentence." },
      { label: "B", content: "memorizes", isCorrect: false, rationaleWrong: "There is no support for memorization in the text." },
      { label: "C", content: "streamlines", isCorrect: true },
      { label: "D", content: "questions", isCorrect: false, rationaleWrong: "She is explaining, not casting doubt on, the science." },
    ],
  },
  {
    externalId: "sample-rw-002",
    section: "READING_WRITING",
    domain: "Expression of Ideas",
    skill: "Transitions",
    difficulty: "MEDIUM",
    format: "MCQ",
    stimulus:
      "Most honeybees forage within a few kilometers of their hive. ______ researchers tracking one colony recorded a worker bee traveling nearly fourteen kilometers in a single trip, far beyond the typical range.",
    stem: "Which choice completes the text with the most logical transition?",
    correctAnswer: "A",
    explanation:
      "The second sentence presents a surprising exception to the general rule in the first. 'However' signals this contrast.",
    choices: [
      { label: "A", content: "However,", isCorrect: true },
      { label: "B", content: "For example,", isCorrect: false, rationaleWrong: "The sentence is a counterexample, not a supporting example of the typical range." },
      { label: "C", content: "Therefore,", isCorrect: false, rationaleWrong: "The second sentence does not follow as a consequence of the first." },
      { label: "D", content: "Similarly,", isCorrect: false, rationaleWrong: "The two sentences contrast rather than parallel each other." },
    ],
  },
  {
    externalId: "sample-rw-003",
    section: "READING_WRITING",
    domain: "Standard English Conventions",
    skill: "Boundaries",
    difficulty: "MEDIUM",
    format: "MCQ",
    stimulus:
      "The printing press transformed sixteenth-century Europe ______ it allowed identical texts to be produced quickly and cheaply, spreading ideas faster than ever before.",
    stem: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    correctAnswer: "D",
    explanation:
      "Two independent clauses ('The printing press transformed...' and 'it allowed...') must be joined correctly. A comma plus the coordinating conjunction 'because' is not standard, but a colon-free option using 'because' as a subordinating conjunction works: '...Europe because it allowed...'. Choice D joins them with 'because', creating a correct complex sentence.",
    choices: [
      { label: "A", content: "Europe, it", isCorrect: false, rationaleWrong: "This creates a comma splice between two independent clauses." },
      { label: "B", content: "Europe it", isCorrect: false, rationaleWrong: "This is a run-on; the clauses need punctuation or a conjunction." },
      { label: "C", content: "Europe; and", isCorrect: false, rationaleWrong: "A semicolon should not be followed by a coordinating conjunction here." },
      { label: "D", content: "Europe because", isCorrect: true },
    ],
  },
  {
    externalId: "sample-rw-004",
    section: "READING_WRITING",
    domain: "Information and Ideas",
    skill: "Command of Evidence",
    difficulty: "HARD",
    format: "MCQ",
    stimulus:
      "A team studying urban gardens hypothesized that planting native wildflowers along sidewalks would increase the number of pollinator species visiting a block. They compared blocks with new wildflower strips to nearby blocks without them over one summer.",
    stem: "Which finding, if true, would most directly support the team's hypothesis?",
    correctAnswer: "B",
    explanation:
      "The hypothesis is that wildflower strips increase pollinator species. Direct support is a finding that blocks with strips had more pollinator species than blocks without them.",
    choices: [
      { label: "A", content: "Blocks with wildflower strips had more pedestrians than blocks without them.", isCorrect: false, rationaleWrong: "Pedestrian counts are unrelated to pollinator diversity." },
      { label: "B", content: "Blocks with wildflower strips hosted noticeably more pollinator species than blocks without them.", isCorrect: true },
      { label: "C", content: "Wildflowers required less watering than the team expected.", isCorrect: false, rationaleWrong: "Maintenance effort does not address the pollinator hypothesis." },
      { label: "D", content: "Some pollinators visited blocks without any wildflower strips.", isCorrect: false, rationaleWrong: "This neither compares the two groups nor shows an increase from the strips." },
    ],
  },
];
