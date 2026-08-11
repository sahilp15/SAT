"""Reading & Writing — HARD: Expression of Ideas, Standard English Conventions."""

from qbuild import Item, SECTION_RW

EXPR = "Expression of Ideas"
CONV = "Standard English Conventions"

ITEMS = []


def rw(domain, **kw):
    ITEMS.append(
        Item(
            section=SECTION_RW,
            domain=domain,
            difficulty="HARD",
            fmt="MCQ",
            requires_calculator=False,
            desmos_relevant=False,
            **kw,
        )
    )


# ===================== Expression of Ideas: Transitions ======================

rw(
    EXPR,
    external_id="sp-rw-0027",
    skill="Transitions",
    stem=(
        "Octopuses can distinguish colors behaviorally despite having only one type of "
        "photoreceptor, which should make them colorblind. One proposal holds that they exploit "
        "chromatic aberration: because a lens focuses different wavelengths at slightly "
        "different distances, an animal that changes its pupil shape and focal depth could infer "
        "color from how sharp an image is. ______ the octopus would be reconstructing color "
        "through blur rather than detecting it directly.\n\n"
        "Which choice completes the text with the most logical transition?"
    ),
    choices={"A": "Nevertheless,", "B": "In effect,", "C": "By contrast,", "D": "Previously,"},
    answer="B",
    explanation=(
        "The final sentence does not add new information — it restates the mechanism just "
        "described in plainer terms. Inferring color from how sharp an image is at different "
        "focal depths simply is reconstructing color through blur. \"In effect\" is the "
        "transition for recasting a claim as its practical upshot, so choice B fits.\n\n"
        "Choice A signals a concession or contrast, but nothing in the last sentence opposes "
        "what precedes it. Choice C would require two things being set against each other, and "
        "only one mechanism is under discussion. Choice D introduces a time relationship that "
        "the passage does not establish."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0028",
    skill="Transitions",
    stem=(
        "Economists have generally assumed that consumers respond to a price increase by buying "
        "less of a good. For a narrow class of staples, the opposite can occur: when the price "
        "of a cheap staple rises, poor households may be unable to afford the costlier foods "
        "they had been supplementing it with, and so buy more of the staple, not less. ______ "
        "the effect has proved extremely difficult to document outside of controlled settings.\n\n"
        "Which choice completes the text with the most logical transition?"
    ),
    choices={"A": "For instance,", "B": "As a result,", "C": "Even so,", "D": "Likewise,"},
    answer="C",
    explanation=(
        "The passage describes a genuine exception to the usual demand relationship, then "
        "reports that the exception is hard to observe in the field. That is a concession "
        "running against the interest of the point just made, which calls for a contrastive "
        "transition. \"Even so\" acknowledges the preceding claim while introducing a "
        "qualification, so choice C is correct.\n\n"
        "Choice A would introduce an example, but difficulty of documentation is not an instance "
        "of the effect. Choice B claims the difficulty follows causally from the mechanism, "
        "which the text does not assert. Choice D signals similarity, yet the two sentences pull "
        "in opposite directions."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0029",
    skill="Transitions",
    stem=(
        "The Chinook Nation's traditional plank houses were built from western red cedar, a wood "
        "that resists decay in a persistently wet climate. Cedar also splits cleanly along the "
        "grain, allowing boards to be removed from a living tree without felling it. ______ a "
        "single tree could supply building material repeatedly over decades while continuing to "
        "grow.\n\n"
        "Which choice completes the text with the most logical transition?"
    ),
    choices={"A": "Consequently,", "B": "However,", "C": "Similarly,", "D": "Regardless,"},
    answer="A",
    explanation=(
        "The last sentence states the outcome of the property described just before it. Because "
        "boards can be taken from a living tree without felling it, the tree survives and can be "
        "harvested again. That is a cause-and-effect relationship, and \"Consequently\" marks "
        "it, making choice A correct.\n\n"
        "Choice B sets up a contrast, but the final sentence agrees with and extends what "
        "precedes it. Choice C signals a parallel between two comparable things, while the "
        "relationship here is causal. Choice D dismisses the preceding information as "
        "irrelevant, when it is in fact the reason for what follows."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0030",
    skill="Transitions",
    stem=(
        "Analyses of the gut microbiome once relied on culturing bacteria in the laboratory, a "
        "method that captured only the small fraction of species able to grow under artificial "
        "conditions. Sequencing methods, which identify organisms from their DNA alone, revealed "
        "a far more diverse community. ______ many of the species that sequencing detects have "
        "still never been grown in culture, so their metabolic capabilities remain unknown.\n\n"
        "Which choice completes the text with the most logical transition?"
    ),
    choices={"A": "Therefore,", "B": "Indeed,", "C": "Still,", "D": "In other words,"},
    answer="C",
    explanation=(
        "The middle sentence reports an advance: sequencing found far more diversity than "
        "culturing could. The final sentence names a limitation that persists despite the "
        "advance — those species still cannot be grown, so their capabilities are unknown. A "
        "concessive transition is needed, and \"Still\" performs exactly that function.\n\n"
        "Choice A treats the limitation as a consequence of the advance, reversing the logic. "
        "Choice B would intensify or confirm the previous sentence, but the final sentence "
        "qualifies it instead. Choice D announces a restatement, and the final sentence "
        "introduces new information rather than rephrasing."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0031",
    skill="Transitions",
    stem=(
        "Museum conservators once cleaned paintings aggressively, stripping varnish layers to "
        "reveal what they took to be the artist's original surface. Later analysis showed that "
        "some varnishes had been applied by the artists themselves and were part of the intended "
        "work. ______ conservation practice now favors interventions that can be undone.\n\n"
        "Which choice completes the text with the most logical transition?"
    ),
    choices={"A": "Nonetheless,", "B": "For example,", "C": "Partly for this reason,", "D": "Meanwhile,"},
    answer="C",
    explanation=(
        "The final sentence describes a change in practice that follows from the discovery just "
        "reported: because cleaning could destroy something the artist intended, conservators "
        "now prefer reversible interventions. The relationship is causal. \"Partly for this "
        "reason\" marks the cause while acknowledging it may not be the only one, which suits a "
        "passage that names a single discovery behind a broad shift.\n\n"
        "Choice A signals contrast, but the new practice agrees with the lesson learned. Choice "
        "B would make the change in practice an example of artists applying varnish, which is "
        "incoherent. Choice D asserts simultaneity, whereas the practice changed after and "
        "because of the analysis."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0032",
    skill="Transitions",
    stem=(
        "In most vertebrates the heart's pacemaker cells fire at a rate set largely by body "
        "size, with smaller animals maintaining faster rhythms. Hummingbirds fit the pattern at "
        "rest, but during hovering their rate climbs to roughly 1,200 beats per minute — beyond "
        "what body size alone predicts. ______ hovering flight appears to impose demands that "
        "the general scaling relationship does not capture.\n\n"
        "Which choice completes the text with the most logical transition?"
    ),
    choices={"A": "Thus,", "B": "Instead,", "C": "In addition,", "D": "Admittedly,"},
    answer="A",
    explanation=(
        "The final sentence draws the conclusion the second sentence sets up. Because "
        "hummingbird heart rates during hovering exceed what body size predicts, something about "
        "hovering must be operating outside the scaling relationship. \"Thus\" marks an "
        "inference drawn from evidence just presented, so choice A is correct.\n\n"
        "Choice B would substitute a correction for a rejected claim, but nothing has been "
        "rejected — the pattern holds at rest. Choice C would add a further point rather than "
        "conclude from the previous one. Choice D introduces a concession against the writer's "
        "own line of argument, while this sentence is the argument's payoff."
    ),
)

# ===================== Expression of Ideas: Rhetorical Synthesis =============

rw(
    EXPR,
    external_id="sp-rw-0033",
    skill="Rhetorical Synthesis",
    stem=(
        "While researching a topic, a student has taken the following notes:\n\n"
        "• Lidar uses laser pulses to measure distance to the ground.\n"
        "• Dense forest canopy blocks most conventional aerial photography.\n"
        "• Some lidar pulses pass through gaps in the canopy and reach the forest floor.\n"
        "• In 2018, a lidar survey of Guatemala's Petén region mapped more than 60,000 previously "
        "unrecorded Maya structures.\n"
        "• Ground survey of the same area had taken decades and covered a fraction of it.\n\n"
        "The student wants to emphasize the advantage of lidar over earlier survey methods. "
        "Which choice most effectively uses relevant information from the notes to accomplish "
        "this goal?"
    ),
    choices={
        "A": "Lidar, which uses laser pulses to measure distance to the ground, was used to survey Guatemala's Petén region in 2018.",
        "B": "Because some lidar pulses reach the forest floor through gaps in the canopy, a 2018 survey of Guatemala's Petén region mapped over 60,000 Maya structures — far more than decades of ground survey had covered.",
        "C": "Dense forest canopy blocks most conventional aerial photography, though some lidar pulses pass through gaps in the canopy and reach the forest floor.",
        "D": "A 2018 lidar survey of Guatemala's Petén region mapped more than 60,000 previously unrecorded Maya structures.",
    },
    answer="B",
    explanation=(
        "The goal names a comparison — lidar's advantage *over earlier methods* — so the "
        "successful choice has to put both sides in view. Choice B supplies the mechanism "
        "(pulses reaching the floor through canopy gaps), the result (60,000+ structures), and "
        "the explicit contrast with decades of ground survey that covered far less.\n\n"
        "Choice D reports the impressive result but names no earlier method, leaving nothing to "
        "compare against. Choice A is weaker still, giving a definition and a location without "
        "any outcome. Choice C contrasts lidar with aerial photography but stops at the "
        "mechanism, never reaching what lidar accomplished — so no advantage is demonstrated."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0034",
    skill="Rhetorical Synthesis",
    stem=(
        "While researching a topic, a student has taken the following notes:\n\n"
        "• Bessie Coleman (1892–1926) was an American aviator.\n"
        "• US flight schools in the 1910s refused to admit her because she was Black and a woman.\n"
        "• She learned French, then traveled to France and earned her pilot's license in 1921.\n"
        "• She was the first African American woman to hold an international pilot's license.\n"
        "• She refused to perform at air shows that segregated their audiences.\n\n"
        "The student wants to emphasize the obstacle Coleman overcame in order to train. Which "
        "choice most effectively uses relevant information from the notes to accomplish this "
        "goal?"
    ),
    choices={
        "A": "Bessie Coleman, an American aviator, became the first African American woman to hold an international pilot's license, which she earned in 1921.",
        "B": "Barred from US flight schools because she was Black and a woman, Bessie Coleman learned French and traveled to France, earning her pilot's license there in 1921.",
        "C": "Bessie Coleman, who lived from 1892 to 1926, refused to perform at air shows that segregated their audiences.",
        "D": "After earning her pilot's license in France in 1921, Bessie Coleman returned to the United States, where she performed at air shows.",
    },
    answer="B",
    explanation=(
        "The goal is specifically about the obstacle to her *training*. Choice B names the "
        "barrier (US schools refused her because she was Black and a woman) and the lengths she "
        "went to in order to get around it (learning a language and crossing an ocean to "
        "qualify). Obstacle and response are both present, which is what the goal requires.\n\n"
        "Choice A records the achievement but omits the exclusion entirely, so nothing was "
        "overcome. Choice C describes a different principled stand — one about performing, not "
        "training. Choice D picks up the story after the obstacle had already been surmounted."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0035",
    skill="Rhetorical Synthesis",
    stem=(
        "While researching a topic, a student has taken the following notes:\n\n"
        "• Sourdough starters contain both wild yeasts and lactic acid bacteria.\n"
        "• The yeasts produce carbon dioxide, which makes the dough rise.\n"
        "• The bacteria produce lactic and acetic acids, which lower the dough's pH.\n"
        "• Lowering the pH strengthens the gluten network and inhibits spoilage organisms.\n"
        "• Breads leavened with commercial yeast alone rise but do not develop the same acidity.\n\n"
        "The student wants to explain why the bacteria, not just the yeasts, matter to the final "
        "bread. Which choice most effectively uses relevant information from the notes to "
        "accomplish this goal?"
    ),
    choices={
        "A": "Sourdough starters contain both wild yeasts and lactic acid bacteria, and the yeasts produce the carbon dioxide that makes the dough rise.",
        "B": "Unlike breads leavened with commercial yeast alone, sourdough breads develop a distinctive acidity during fermentation.",
        "C": "The bacteria in a sourdough starter produce acids that lower the dough's pH, which strengthens the gluten network and inhibits spoilage — effects that rising alone does not produce.",
        "D": "Both wild yeasts and lactic acid bacteria are active in a sourdough starter, and each contributes to fermentation.",
    },
    answer="C",
    explanation=(
        "The goal asks for the bacteria's distinct contribution. Choice C traces the full chain: "
        "bacteria make acids, acids lower pH, and lowered pH strengthens gluten and inhibits "
        "spoilage. The closing clause makes the contrast explicit by noting these are effects "
        "rising alone does not produce, which is exactly the \"not just the yeasts\" the goal "
        "calls for.\n\n"
        "Choice A explains what the yeasts do, the opposite emphasis. Choice B notes the acidity "
        "difference but never says why it matters to the bread. Choice D asserts that both "
        "contribute without distinguishing the contributions, which is the entire point."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0036",
    skill="Rhetorical Synthesis",
    stem=(
        "While researching a topic, a student has taken the following notes:\n\n"
        "• The Anasazi built Chaco Canyon's great houses between roughly 850 and 1150 CE.\n"
        "• Pueblo Bonito, the largest, contained more than 600 rooms.\n"
        "• Tree-ring analysis shows the timbers came from mountain ranges 50 to 75 miles away.\n"
        "• The Anasazi had no draft animals and no wheeled vehicles.\n"
        "• More than 200,000 timbers were used across the canyon's structures.\n\n"
        "The student wants to emphasize the scale of the labor the construction required. Which "
        "choice most effectively uses relevant information from the notes to accomplish this "
        "goal?"
    ),
    choices={
        "A": "The Anasazi built the great houses of Chaco Canyon between roughly 850 and 1150 CE, and the largest of them, Pueblo Bonito, contained more than 600 rooms.",
        "B": "Without draft animals or wheeled vehicles, the Anasazi carried more than 200,000 timbers to Chaco Canyon from mountain ranges 50 to 75 miles away.",
        "C": "Tree-ring analysis has shown that the timbers used at Chaco Canyon came from mountain ranges 50 to 75 miles away.",
        "D": "Pueblo Bonito, the largest of Chaco Canyon's great houses, contained more than 600 rooms and was built over a period of roughly 300 years.",
    },
    answer="B",
    explanation=(
        "Labor at scale needs both the quantity and the difficulty. Choice B supplies both: "
        "200,000 timbers, hauled 50 to 75 miles, with no draft animals or wheels available. The "
        "absence of any labor-saving technology is what converts a large number into an "
        "impression of enormous human effort.\n\n"
        "Choice C gives the distance but not the volume or the constraint. Choice A conveys size "
        "without any sense of the work required to achieve it. Choice D combines room count with "
        "duration and additionally misreads the notes, which date the canyon's construction "
        "generally rather than Pueblo Bonito's specifically."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0037",
    skill="Rhetorical Synthesis",
    stem=(
        "While researching a topic, a student has taken the following notes:\n\n"
        "• Coral reefs occupy less than 1% of the ocean floor.\n"
        "• They host roughly 25% of all marine species.\n"
        "• Corals obtain most of their energy from symbiotic algae living in their tissues.\n"
        "• When water temperatures rise, corals expel the algae, a process called bleaching.\n"
        "• Bleached corals can survive for weeks but starve if the algae do not return.\n\n"
        "The student wants to explain the mechanism by which warming threatens corals. Which "
        "choice most effectively uses relevant information from the notes to accomplish this "
        "goal?"
    ),
    choices={
        "A": "Coral reefs occupy less than 1% of the ocean floor but host roughly 25% of all marine species.",
        "B": "Rising water temperatures cause corals to bleach, and bleaching has become more frequent in recent decades.",
        "C": "Because corals get most of their energy from algae living in their tissues, expelling those algae when water warms leaves them to starve unless the algae return.",
        "D": "Corals obtain most of their energy from symbiotic algae, and coral reefs host roughly a quarter of all marine species.",
    },
    answer="C",
    explanation=(
        "A mechanism is a causal chain, and choice C gives every link: corals depend on algae "
        "for energy, warming makes them expel the algae, and without the algae they starve. The "
        "conditional \"unless the algae return\" preserves the detail that bleaching is not "
        "immediately fatal.\n\n"
        "Choice B names the trigger and the outcome but skips the dependence that explains why "
        "bleaching harms the coral, and it adds a frequency claim absent from the notes. "
        "Choices A and D are about biodiversity and reef importance — relevant to why corals "
        "matter, but not to how warming kills them."
    ),
)

rw(
    EXPR,
    external_id="sp-rw-0038",
    skill="Rhetorical Synthesis",
    stem=(
        "While researching a topic, a student has taken the following notes:\n\n"
        "• Mycorrhizal fungi form networks connecting the roots of neighboring trees.\n"
        "• Radioactive tracer studies show carbon moving from one tree to another through these networks.\n"
        "• In one study, carbon moved preferentially from sunlit trees to shaded seedlings.\n"
        "• Some researchers argue the fungi, not the trees, control the direction of transfer.\n"
        "• The fungi obtain carbon from every tree they connect to.\n\n"
        "The student wants to present a complication in interpreting the transfer studies. Which "
        "choice most effectively uses relevant information from the notes to accomplish this "
        "goal?"
    ),
    choices={
        "A": "Radioactive tracer studies have shown that carbon moves from one tree to another through mycorrhizal networks.",
        "B": "Although carbon moves from sunlit trees to shaded seedlings, some researchers argue that the fungi — which take carbon from every tree they connect — direct the transfer rather than the trees.",
        "C": "Mycorrhizal fungi form networks connecting the roots of neighboring trees, and they obtain carbon from every tree they connect to.",
        "D": "In one study, carbon moved preferentially from sunlit trees to shaded seedlings through a mycorrhizal network.",
    },
    answer="B",
    explanation=(
        "A complication has to set an apparent finding against something that unsettles it. "
        "Choice B does this with its \"Although\" structure: the observed pattern looks like "
        "trees helping seedlings, but if the fungi direct the flow and draw carbon from every "
        "tree, the generous-tree reading may be wrong. The parenthetical detail supplies the "
        "reason the alternative is credible.\n\n"
        "Choices A and D report the findings without anything that complicates them. Choice C "
        "includes the fungi's own stake in the carbon but never connects it to the transfer "
        "studies, so no interpretive difficulty emerges."
    ),
)

# ===================== Standard English Conventions: Boundaries ==============

rw(
    CONV,
    external_id="sp-rw-0039",
    skill="Boundaries",
    stem=(
        "The pigment known as Egyptian blue was manufactured for more than three thousand "
        "years, then the recipe disappeared so completely that chemists in the nineteenth "
        "century had to reconstruct it from scratch.\n\n"
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "The pigment known as Egyptian blue was manufactured for more than three thousand "
        "______ the recipe disappeared so completely that chemists in the nineteenth century had "
        "to reconstruct it from scratch."
    ),
    choices={
        "A": "years, then",
        "B": "years; then",
        "C": "years then",
        "D": "years, then,",
    },
    answer="B",
    explanation=(
        "Both halves of this sentence are independent clauses. The first has the subject \"the "
        "pigment\" and the verb \"was manufactured\"; the second has the subject \"the recipe\" "
        "and the verb \"disappeared.\" Two independent clauses cannot be joined by a comma "
        "alone.\n\n"
        "\"Then\" is an adverb, not a coordinating conjunction — unlike \"and\" or \"but,\" it "
        "cannot rescue a comma splice. A semicolon is therefore required, making choice B "
        "correct.\n\n"
        "Choice A is a comma splice for exactly that reason. Choice C runs the clauses together "
        "with no punctuation at all. Choice D adds a second comma without fixing the splice."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0040",
    skill="Boundaries",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "The astronomer Vera Rubin discovered that the outer stars of spiral ______ just as fast "
        "as the stars near the center."
    ),
    choices={
        "A": "galaxies orbit",
        "B": "galaxies, orbit",
        "C": "galaxies; orbit",
        "D": "galaxies: orbit",
    },
    answer="A",
    explanation=(
        "The subject of the clause is \"the outer stars of spiral galaxies\" and its verb is "
        "\"orbit.\" Nothing should separate a subject from its verb, so no punctuation belongs "
        "in the blank at all. Choice A is correct.\n\n"
        "The trap is that the subject is long, and a long subject invites a pause that the "
        "punctuation rules do not license. Choice B inserts a comma between the subject and its "
        "verb. Choices C and D are worse still: a semicolon and a colon each require a complete "
        "independent clause before them, and \"The astronomer Vera Rubin discovered that the "
        "outer stars of spiral galaxies\" is not one — it breaks off mid-thought."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0041",
    skill="Boundaries",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "Bioluminescence has evolved independently more than forty ______ in fireflies, in deep-sea "
        "fish, in fungi, and in several lineages of bacteria."
    ),
    choices={
        "A": "times:",
        "B": "times,",
        "C": "times;",
        "D": "times",
    },
    answer="A",
    explanation=(
        "The words before the blank form a complete independent clause: \"Bioluminescence has "
        "evolved independently more than forty times.\" What follows is a list of examples "
        "illustrating that claim, not a second clause — the items are prepositional phrases with "
        "no subject or verb of their own.\n\n"
        "A colon introduces a list after an independent clause, so choice A is correct.\n\n"
        "Choice C is wrong because a semicolon requires an independent clause on both sides, and "
        "the list is not one. Choice B suggests the phrases modify the clause in the ordinary "
        "way rather than enumerating instances, obscuring the list relationship. Choice D leaves "
        "the list unmarked."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0042",
    skill="Boundaries",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "The novel's narrator, an unnamed clerk who has worked at the same firm for thirty "
        "______ describes his colleagues with a precision that borders on cruelty."
    ),
    choices={
        "A": "years",
        "B": "years,",
        "C": "years;",
        "D": "years:",
    },
    answer="B",
    explanation=(
        "The phrase \"an unnamed clerk who has worked at the same firm for thirty years\" is a "
        "nonessential appositive renaming \"the narrator.\" Such an element must be enclosed by "
        "punctuation on both sides — the opening comma appears after \"narrator,\" so a closing "
        "comma is needed after \"years.\"\n\n"
        "Choice A leaves the appositive unclosed, which incorrectly attaches \"years\" to the "
        "verb that follows. Choices C and D use marks that separate independent clauses or "
        "introduce explanations; here the material after the blank is only the sentence's "
        "predicate, \"describes his colleagues...,\" which cannot stand alone."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0043",
    skill="Boundaries",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "Researchers had assumed that the tortoises on each island belonged to a single "
        "______ genetic analysis revealed at least four distinct populations."
    ),
    choices={
        "A": "species,",
        "B": "species, but",
        "C": "species",
        "D": "species, however",
    },
    answer="B",
    explanation=(
        "Two independent clauses appear here: \"Researchers had assumed... a single species\" "
        "and \"genetic analysis revealed at least four distinct populations.\" A comma alone "
        "cannot join them.\n\n"
        "Choice B supplies a comma plus the coordinating conjunction \"but,\" which joins the "
        "clauses correctly and also fits the contrast between the assumption and the finding.\n\n"
        "Choice A is a comma splice. Choice C runs the clauses together with no punctuation. "
        "Choice D is the subtlest error: \"however\" is a conjunctive adverb rather than a "
        "coordinating conjunction, so a comma before it is not enough — that version would need "
        "a semicolon."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0044",
    skill="Boundaries",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "Ada Lovelace's notes on Charles Babbage's Analytical ______ longer than the paper they "
        "annotated, describe a method for computing Bernoulli numbers."
    ),
    choices={
        "A": "Engine which were",
        "B": "Engine, which were",
        "C": "Engine, which were,",
        "D": "Engine; which were",
    },
    answer="B",
    explanation=(
        "The clause \"which were longer than the paper they annotated\" is nonessential — the "
        "notes are already fully identified as Lovelace's notes on the Analytical Engine — so it "
        "must be set off by commas. The closing comma is already present before \"describe,\" so "
        "an opening comma is needed after \"Engine.\"\n\n"
        "Choice A omits it, leaving the nonessential clause half-enclosed. Choice C inserts an "
        "extra comma after \"were,\" separating the verb from its complement. Choice D uses a "
        "semicolon, which requires an independent clause on each side; \"which were longer...\" "
        "is subordinate and cannot stand alone."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0045",
    skill="Boundaries",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "Because the fossil was embedded in unusually fine-grained ______ preserved impressions "
        "of feathers that coarser sediments would have destroyed."
    ),
    choices={
        "A": "limestone, it",
        "B": "limestone it",
        "C": "limestone; it",
        "D": "limestone. It",
    },
    answer="A",
    explanation=(
        "\"Because the fossil was embedded in unusually fine-grained limestone\" is a "
        "subordinate clause — the word \"Because\" prevents it from standing alone. When such a "
        "clause opens a sentence, it is followed by a comma and then the main clause.\n\n"
        "Choice A supplies that comma before the main clause \"it preserved impressions...\"\n\n"
        "Choices C and D both treat the opening as an independent clause, which it is not; a "
        "semicolon and a period each require complete sentences on both sides, so both create "
        "a fragment. Choice B omits the required comma after the introductory clause."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0046",
    skill="Boundaries",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "The composer spent four years on the ______ she withdrew it after a single performance "
        "and never allowed it to be played again."
    ),
    choices={
        "A": "symphony, yet",
        "B": "symphony yet",
        "C": "symphony, yet,",
        "D": "symphony yet,",
    },
    answer="A",
    explanation=(
        "The sentence joins two independent clauses: \"The composer spent four years on the "
        "symphony\" and \"she withdrew it after a single performance and never allowed it to be "
        "played again.\" The standard way to join them is a comma followed by a coordinating "
        "conjunction, and \"yet\" is one of the seven coordinating conjunctions.\n\n"
        "Choice A places the comma before the conjunction, which is correct.\n\n"
        "Choice B omits the comma, producing a run-on. Choices C and D place a comma after "
        "\"yet,\" which incorrectly separates the conjunction from the clause it introduces."
    ),
)

# ============= Standard English Conventions: Form, Structure, and Sense ======

rw(
    CONV,
    external_id="sp-rw-0047",
    skill="Form, Structure, and Sense",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "The collection of letters that the museum acquired from three separate estates ______ "
        "now available to researchers."
    ),
    choices={"A": "are", "B": "is", "C": "were", "D": "have been"},
    answer="B",
    explanation=(
        "Find the subject before choosing the verb. The subject is \"The collection,\" which is "
        "singular. Everything between it and the blank — \"of letters that the museum acquired "
        "from three separate estates\" — is a prepositional phrase and a relative clause, "
        "neither of which can change the subject's number.\n\n"
        "A singular subject takes the singular verb \"is,\" so choice B is correct.\n\n"
        "Choices A, C, and D are all plural forms, agreeing with the nearby nouns \"letters\" or "
        "\"estates\" rather than with the actual subject. Stripping the modifiers makes the "
        "error audible: \"The collection is now available.\""
    ),
)

rw(
    CONV,
    external_id="sp-rw-0048",
    skill="Form, Structure, and Sense",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "By the time the survey team reached the summit in 1953, the glacier they had mapped a "
        "decade earlier ______ nearly a third of its volume."
    ),
    choices={"A": "loses", "B": "will lose", "C": "had lost", "D": "has lost"},
    answer="C",
    explanation=(
        "The sentence describes two past events at different times. The team's arrival in 1953 "
        "is the later one, and the glacier's loss happened before it — the mapping was \"a "
        "decade earlier,\" and the loss occurred over the interval between.\n\n"
        "The past perfect, \"had lost,\" is the form for an action completed before another past "
        "action, so choice C is correct.\n\n"
        "Choice A uses the present tense for a past event. Choice B points to the future, which "
        "contradicts \"By the time... in 1953.\" Choice D uses the present perfect, which links "
        "a past action to the present moment rather than to the past reference point the "
        "sentence establishes."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0049",
    skill="Form, Structure, and Sense",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "Having been calibrated against three independent standards, ______"
    ),
    choices={
        "A": "the researchers considered the instrument reliable.",
        "B": "the instrument's readings were considered reliable by the researchers.",
        "C": "the instrument was considered reliable by the researchers.",
        "D": "reliability was attributed to the instrument by the researchers.",
    },
    answer="C",
    explanation=(
        "The opening participial phrase, \"Having been calibrated against three independent "
        "standards,\" must modify the subject of the main clause that follows. Only one thing in "
        "the sentence could have been calibrated: the instrument.\n\n"
        "Choice C makes \"the instrument\" the subject, so the modifier attaches correctly.\n\n"
        "Choice A makes \"the researchers\" the subject, saying that the researchers were "
        "calibrated. Choice B makes \"the instrument's readings\" the subject; the readings were "
        "not calibrated, the instrument was. Choice D makes \"reliability\" the subject, which is "
        "not something that can be calibrated either."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0050",
    skill="Form, Structure, and Sense",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "Neither the director nor the lead actors ______ willing to discuss the film's troubled "
        "production."
    ),
    choices={"A": "was", "B": "were", "C": "has been", "D": "is"},
    answer="B",
    explanation=(
        "With \"neither... nor,\" the verb agrees with the subject nearer to it. Here the nearer "
        "subject is \"the lead actors,\" which is plural, so the verb must be plural.\n\n"
        "Choice B, \"were,\" is the plural form and is correct.\n\n"
        "Choices A, C, and D are all singular and would agree with \"the director,\" the more "
        "distant subject. Reversing the order shows the rule at work: \"Neither the lead actors "
        "nor the director was willing\" is also correct, because there the singular subject is "
        "nearer."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0051",
    skill="Form, Structure, and Sense",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "The committee released ______ findings only after every member had signed the report."
    ),
    choices={"A": "it's", "B": "its'", "C": "its", "D": "their's"},
    answer="C",
    explanation=(
        "A possessive form is needed to show that the findings belong to the committee. The "
        "possessive of \"it\" is \"its,\" written without an apostrophe — one of the few "
        "possessives in English that takes none.\n\n"
        "Choice A, \"it's,\" is the contraction of \"it is\" or \"it has,\" which would produce "
        "\"The committee released it is findings.\" Choices B and D are not standard forms at "
        "all: \"its'\" does not exist, and the possessive of \"they\" is \"their,\" never "
        "\"their's.\""
    ),
)

rw(
    CONV,
    external_id="sp-rw-0052",
    skill="Form, Structure, and Sense",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "The engineers redesigned the bridge's supports, reinforced its foundations, and ______ "
        "the roadway to distribute weight more evenly."
    ),
    choices={"A": "were widening", "B": "widened", "C": "widening", "D": "had widened"},
    answer="B",
    explanation=(
        "The sentence presents three actions in a series, and items in a series must share the "
        "same grammatical form. The first two are simple past tense verbs: \"redesigned\" and "
        "\"reinforced.\"\n\n"
        "The third must match, so \"widened\" is correct.\n\n"
        "Choice A shifts to the past progressive, breaking the pattern. Choice C uses a "
        "participle, which leaves the third item without a finite verb. Choice D shifts to the "
        "past perfect, which would place the widening before the other two actions rather than "
        "alongside them."
    ),
)

rw(
    CONV,
    external_id="sp-rw-0053",
    skill="Form, Structure, and Sense",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "Each of the seventeen manuscripts recovered from the archive ______ a different scribe's "
        "hand."
    ),
    choices={"A": "show", "B": "shows", "C": "have shown", "D": "were showing"},
    answer="B",
    explanation=(
        "The subject is \"Each,\" an indefinite pronoun that is always singular, so it takes a "
        "singular verb. The phrase \"of the seventeen manuscripts recovered from the archive\" "
        "is a prepositional phrase and cannot supply the subject.\n\n"
        "Choice B, \"shows,\" is the singular form.\n\n"
        "Choices A, C, and D are plural and agree with \"manuscripts,\" the object of the "
        "preposition. The test is to remove the phrase: \"Each shows a different scribe's hand.\" "
        "The same rule governs \"either,\" \"neither,\" \"every,\" and \"none of.\""
    ),
)

rw(
    CONV,
    external_id="sp-rw-0054",
    skill="Form, Structure, and Sense",
    stem=(
        "Which choice completes the text so that it conforms to the conventions of Standard "
        "English?\n\n"
        "The archaeologist argued that if the settlement ______ abandoned gradually, the "
        "excavators would have found household goods removed rather than left in place."
    ),
    choices={"A": "was", "B": "had been", "C": "would be", "D": "is"},
    answer="B",
    explanation=(
        "The sentence is a conditional about the past, and the main clause uses \"would have "
        "found.\" That pairing requires the past perfect in the if-clause: if X had been true, "
        "then Y would have happened.\n\n"
        "Choice B, \"had been,\" supplies it.\n\n"
        "Choice A uses the simple past, which does not match \"would have found.\" Choice C puts "
        "\"would\" inside the if-clause, which is not standard in this construction. Choice D "
        "uses the present tense for an event the sentence places firmly in the past."
    ),
)
