"""Reading & Writing — HARD: Information and Ideas, Craft and Structure."""

from qbuild import Item, SECTION_RW

INFO = "Information and Ideas"
CRAFT = "Craft and Structure"

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


# ===================== Information and Ideas: Central Ideas ==================

rw(
    INFO,
    external_id="sp-rw-0001",
    skill="Central Ideas and Details",
    stem=(
        "In the 1930s, the ecologist Arthur Tansley proposed the term \"ecosystem\" partly to "
        "discipline a vocabulary he considered undisciplined. Colleagues had described plant "
        "communities as \"organisms\" that matured toward a fixed adult form, an analogy Tansley "
        "thought imported an unearned sense of purpose into ecology. His alternative deliberately "
        "borrowed from physics rather than biology: an ecosystem was a system of exchanges among "
        "components, with no destination written into it. The substitution was not merely "
        "terminological. By describing vegetation as a system rather than a superorganism, "
        "Tansley made it possible to ask what a community was doing without first assuming what "
        "it was for.\n\n"
        "Which choice best states the main idea of the text?"
    ),
    choices={
        "A": "Tansley introduced the term \"ecosystem\" to remove an implication of purpose that the prevailing metaphor had smuggled into ecological description.",
        "B": "Tansley believed that ecology would become a rigorous discipline only if it adopted the mathematical methods of physics.",
        "C": "Tansley's colleagues abandoned the superorganism metaphor once they recognized that plant communities do not mature toward a fixed adult form.",
        "D": "Tansley demonstrated that plant communities are best understood as collections of exchanges rather than as biological entities.",
    },
    answer="A",
    explanation=(
        "The text builds to its final sentence, which states the payoff directly: replacing "
        "\"superorganism\" with \"system\" let ecologists ask what a community was doing "
        "\"without first assuming what it was for.\" Everything before it sets up that "
        "contrast — the older metaphor implied maturation toward a fixed form and therefore an "
        "\"unearned sense of purpose.\" Choice A captures both the action and its motive.\n\n"
        "Choice B overreads the reference to physics. The text says Tansley borrowed the idea of "
        "a system of exchanges from physics, not that he wanted ecology to adopt mathematical "
        "methods. Choice C describes a change of mind among the colleagues that the text never "
        "reports; it presents Tansley's proposal, not its reception. Choice D is closest to a "
        "trap: the text says Tansley made a different kind of question possible, not that he "
        "demonstrated a fact about what communities really are."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0002",
    skill="Central Ideas and Details",
    stem=(
        "Conservation biologists have long treated genetic diversity within a population as a "
        "buffer against extinction, on the reasoning that varied populations are likelier to "
        "contain individuals suited to whatever conditions arrive. A recent analysis of 47 "
        "reintroduced bird populations complicates the picture without overturning it. Genetic "
        "diversity predicted survival well over spans of several decades, but over the first "
        "three or four years it predicted almost nothing; what mattered in that window was "
        "simply how many birds were released. The authors suggest that the two findings describe "
        "different hazards rather than competing ones.\n\n"
        "Which choice best states the main idea of the text?"
    ),
    choices={
        "A": "The analysis shows that genetic diversity is a less reliable predictor of population survival than conservation biologists had assumed.",
        "B": "The analysis indicates that genetic diversity and initial population size each predict survival, but over different time spans.",
        "C": "The analysis establishes that releasing larger numbers of birds is the most effective way to ensure a reintroduced population's survival.",
        "D": "The analysis suggests that reintroduced bird populations face hazards that differ from those faced by populations that were never removed.",
    },
    answer="B",
    explanation=(
        "The text is organized around a distinction in timing. Genetic diversity \"predicted "
        "survival well over spans of several decades,\" while in the first three or four years "
        "\"what mattered... was simply how many birds were released.\" The closing sentence "
        "names this explicitly: the two findings \"describe different hazards rather than "
        "competing ones.\" Choice B states that structure.\n\n"
        "Choice A misses the qualifier \"without overturning it\" and the long-term result, "
        "which confirms rather than weakens the traditional view. Choice C elevates one half of "
        "the finding into an overall recommendation and ignores the decades-long horizon where "
        "diversity dominates. Choice D introduces a comparison with populations that were never "
        "removed, which the text does not make."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0003",
    skill="Central Ideas and Details",
    stem=(
        "The novelist Zora Neale Hurston trained as an anthropologist under Franz Boas, and "
        "critics have often read her fieldwork and her fiction as separate enterprises — the one "
        "a scientific record, the other an artistic invention. Hurston herself resisted the "
        "division. She argued that the folklore she collected in Florida and Haiti had already "
        "been shaped by its tellers into narrative form, and that transcribing it without "
        "attending to performance would preserve the words while discarding what made them "
        "meaningful. Her fiction, on this account, was not a departure from her fieldwork but a "
        "continuation of it by other means.\n\n"
        "Which choice best states the main idea of the text?"
    ),
    choices={
        "A": "Hurston's training under Boas shaped her fiction more profoundly than critics have recognized.",
        "B": "Hurston considered the folklore she collected to be more artistically accomplished than her own novels.",
        "C": "Hurston rejected the idea that her anthropological work and her fiction were fundamentally different kinds of undertaking.",
        "D": "Hurston believed that transcription is an inadequate method for preserving folklore in any form.",
    },
    answer="C",
    explanation=(
        "The text sets up a critical consensus — fieldwork and fiction as \"separate "
        "enterprises\" — and then reports that \"Hurston herself resisted the division.\" The "
        "final sentence completes the thought: her fiction was \"not a departure from her "
        "fieldwork but a continuation of it.\" Choice C names that rejection of the division.\n\n"
        "Choice A shifts the topic to influence and degree, which the text does not measure. "
        "Choice B invents a comparison of artistic quality. Choice D overstates her point about "
        "transcription: her objection was to transcribing \"without attending to performance,\" "
        "which is a criticism of a particular practice rather than of transcription as such."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0004",
    skill="Central Ideas and Details",
    stem=(
        "Text 1\n"
        "Urban heat islands are usually explained by materials: asphalt and concrete absorb "
        "solar radiation during the day and release it slowly at night, keeping cities warmer "
        "than surrounding countryside. Reducing the effect is therefore largely a question of "
        "surfaces — lighter pavements, reflective roofs, more shade.\n\n"
        "Text 2\n"
        "Materials matter, but geometry may matter more. Measurements across 60 cities found "
        "that the ratio of building height to street width predicted nighttime temperature "
        "better than surface composition did. Narrow streets flanked by tall buildings trap "
        "radiation no matter what the pavement is made of, because the heat must escape through "
        "a smaller opening of visible sky.\n\n"
        "Based on the texts, how would the author of Text 2 most likely respond to the "
        "recommendation in the last sentence of Text 1?"
    ),
    choices={
        "A": "By agreeing that surface treatments are effective but arguing that they are too costly to implement at scale.",
        "B": "By contending that surface treatments address a less important factor than the shape of the built environment.",
        "C": "By asserting that urban heat islands cannot be reduced through any form of intervention.",
        "D": "By pointing out that nighttime temperature is a poor measure of the urban heat island effect.",
    },
    answer="B",
    explanation=(
        "Text 1 concludes that reducing urban heat is \"largely a question of surfaces.\" Text 2 "
        "opens by conceding that \"materials matter\" and immediately subordinates them: "
        "\"geometry may matter more.\" The evidence offered is that the height-to-width ratio "
        "\"predicted nighttime temperature better than surface composition did,\" and the "
        "explanation notes that narrow streets trap heat \"no matter what the pavement is made "
        "of.\" That is a claim about relative importance, which is what choice B says.\n\n"
        "Choice A introduces cost, a consideration absent from Text 2. Choice C is far too "
        "strong — Text 2 proposes a better predictor, not the futility of intervention. Choice D "
        "attacks the measure that Text 2 itself relies on to make its case."
    ),
)

# ===================== Information and Ideas: Command of Evidence ============

rw(
    INFO,
    external_id="sp-rw-0005",
    skill="Command of Evidence",
    stem=(
        "Some archaeologists have argued that the large earthen mounds at Poverty Point in "
        "present-day Louisiana were built gradually over many generations, since the labor "
        "required seemed to exceed what a nonagricultural society could mobilize at once. "
        "Researcher T. R. Kidder has challenged this view, proposing that the largest mound was "
        "raised in a single sustained effort lasting no more than a few months.\n\n"
        "Which finding, if true, would most directly support Kidder's proposal?"
    ),
    choices={
        "A": "Artifacts recovered from the base of the mound closely resemble artifacts recovered from its upper layers.",
        "B": "The mound's soil layers show no weathering, erosion, or plant growth between successive deposits.",
        "C": "The total volume of the mound is greater than that of any other earthwork of comparable age in the region.",
        "D": "Radiocarbon dates from the mound indicate that it was constructed earlier than previously believed.",
    },
    answer="B",
    explanation=(
        "Kidder's claim is specifically about the pace of construction: continuous rather than "
        "spread across generations. The way to test that is to look for signs of elapsed time "
        "between deposits. Weathering, erosion, and plant growth all take time to develop, so "
        "their complete absence between successive layers indicates that each layer was added "
        "before the one beneath it had been exposed for long. That is direct evidence of "
        "continuous construction, making choice B correct.\n\n"
        "Choice A is weaker than it looks: similar artifact styles are consistent with rapid "
        "construction but also with a period long enough for styles to persist unchanged, so it "
        "does not discriminate between the hypotheses. Choice C addresses size, which was the "
        "original reason for doubting rapid construction, and if anything cuts against Kidder. "
        "Choice D concerns when the mound was built, not how quickly."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0006",
    skill="Command of Evidence",
    stem=(
        "Bowerbird males build elaborate structures and decorate them with collected objects, "
        "which females inspect before choosing a mate. Biologist Jennifer Kelley hypothesized "
        "that the arrangement of objects — not merely their number or color — influences female "
        "choice, because males arrange small objects near the bower entrance and larger ones "
        "farther away, creating a forced-perspective effect that makes the display appear more "
        "uniform from where the female stands.\n\n"
        "Which finding, if true, would most strongly support Kelley's hypothesis?"
    ),
    choices={
        "A": "Males that collect a greater number of decorative objects are chosen by females more often than males that collect fewer.",
        "B": "When researchers rearranged a male's objects to disrupt the size gradient without changing which objects were present, females visited less often.",
        "C": "Males rebuild the size gradient within days whenever researchers disturb their arrangements.",
        "D": "Females spend longer inspecting bowers decorated with rare objects than bowers decorated with common ones.",
    },
    answer="B",
    explanation=(
        "The hypothesis is that arrangement matters independently of the objects themselves. "
        "Testing it requires holding the objects constant while changing only their positions — "
        "exactly the manipulation in choice B. Because the same objects remain present, any drop "
        "in female visits must be attributable to the arrangement, which is precisely what the "
        "hypothesis predicts.\n\n"
        "Choice A supports the competing explanation the hypothesis was meant to rule out, "
        "namely that number drives choice. Choice C is genuinely tempting — it shows males "
        "treat the gradient as worth maintaining — but it is evidence about male behavior, not "
        "about whether females respond to arrangement, which is what the hypothesis claims. "
        "Choice D points to rarity, another property of the objects rather than of their "
        "positions."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0007",
    skill="Command of Evidence",
    stem=(
        "A researcher studying reading comprehension had two groups of students read the same "
        "passage. One group read it on paper and the other on a screen; both were then tested. "
        "The researcher hypothesized that any difference in comprehension between the groups "
        "would disappear once reading time was held constant, on the grounds that screen readers "
        "tend to read faster and less carefully rather than to understand less well.\n\n"
        "Which finding, if true, would most directly undermine the researcher's hypothesis?"
    ),
    choices={
        "A": "Students in the screen group finished reading the passage significantly faster than students in the paper group.",
        "B": "Students in the screen group reported finding the passage more difficult than students in the paper group did.",
        "C": "When both groups were required to spend the same amount of time reading, the paper group still scored substantially higher.",
        "D": "Students who regularly read on screens scored higher than students who rarely do, regardless of group assignment.",
    },
    answer="C",
    explanation=(
        "The hypothesis makes a conditional prediction: equalize reading time and the gap "
        "disappears. Choice C describes exactly that condition being met and the gap persisting, "
        "which contradicts the prediction directly. This is the finding the hypothesis rules "
        "out.\n\n"
        "Choice A supports one premise of the hypothesis — that screen readers go faster — "
        "rather than undermining the conclusion. Choice B concerns perceived difficulty, not "
        "comprehension scores, and the hypothesis says nothing about how the passage felt. "
        "Choice D describes an effect of reading habits that cuts across both groups and so "
        "leaves the time-based explanation untouched."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0008",
    skill="Command of Evidence",
    stem=(
        "A student is writing about the decline of cursive instruction in schools. She wants to "
        "use data to show that the decline reflects a shift in what schools teach rather than a "
        "decline in handwriting instruction overall.\n\n"
        "Which finding would best support her claim?"
    ),
    choices={
        "A": "The share of schools teaching cursive fell from 71% to 24%, while the share teaching keyboarding rose from 38% to 89%.",
        "B": "The share of schools teaching cursive fell from 71% to 24%, while total minutes of handwriting instruction per week held steady at about 45.",
        "C": "The share of schools teaching cursive fell from 71% to 24%, and average legibility scores fell over the same period.",
        "D": "The share of schools teaching cursive fell from 71% to 24%, and most teachers surveyed said they lacked time to teach it.",
    },
    answer="B",
    explanation=(
        "Her claim has two parts, and the evidence has to carry both: cursive specifically "
        "declined, and handwriting instruction overall did not. Choice B pairs the drop in "
        "cursive with a flat total for handwriting minutes, which shows the time was "
        "redistributed within handwriting instruction rather than removed from it. Both halves "
        "of the claim are covered.\n\n"
        "Choice A is the strongest distractor: the rise in keyboarding does show a curricular "
        "shift, but keyboarding is not handwriting, so it leaves open the possibility that "
        "handwriting instruction as a whole shrank. Choice C reports an outcome, not the "
        "distribution of instruction. Choice D explains why teachers dropped cursive but says "
        "nothing about whether other handwriting instruction continued."
    ),
)

# ===================== Information and Ideas: Inferences =====================

rw(
    INFO,
    external_id="sp-rw-0009",
    skill="Inferences",
    stem=(
        "Deep-sea anglerfish live where prey is so scarce that an individual may encounter a "
        "potential meal only a few times a year. Their stomachs distend to accommodate prey "
        "larger than themselves, and their teeth angle inward so that a captured animal cannot "
        "back out. These features are costly to build and maintain, and they would be "
        "unnecessary for a fish that could simply eat again tomorrow. It follows that the "
        "anglerfish's anatomy is best understood as an adaptation not to what it eats but to "
        "______\n\n"
        "Which choice most logically completes the text?"
    ),
    choices={
        "A": "the depth at which it hunts.",
        "B": "how rarely it eats.",
        "C": "the size of its competitors.",
        "D": "the darkness of its environment.",
    },
    answer="B",
    explanation=(
        "The passage sets up a contrast the completion must resolve: not \"what it eats\" but "
        "something else. The reasoning offered is that these features \"would be unnecessary for "
        "a fish that could simply eat again tomorrow\" — that is, they exist because meals are "
        "rare. Scarcity of feeding opportunities, stated in the first sentence as \"a few times "
        "a year,\" is the factor the whole passage develops. Choice B names it.\n\n"
        "Choices A and D name real features of the habitat, but the passage never connects depth "
        "or darkness to distensible stomachs and inward-angled teeth, and both would be "
        "adaptations to the environment rather than to feeding. Choice C introduces competitors, "
        "who are never mentioned."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0010",
    skill="Inferences",
    stem=(
        "Medieval scribes copying manuscripts frequently introduced errors, and a later copyist "
        "working from a flawed exemplar would reproduce those errors while adding new ones. "
        "Textual scholars exploit this: because each error tends to be inherited by every "
        "manuscript copied from the one containing it, shared mistakes group manuscripts into "
        "families. A scholar comparing two manuscripts that share an unusual error can therefore "
        "conclude with some confidence that ______\n\n"
        "Which choice most logically completes the text?"
    ),
    choices={
        "A": "one of the two manuscripts was copied directly from the other.",
        "B": "the two manuscripts share a common ancestor in which the error first appeared.",
        "C": "the two manuscripts were produced in the same scriptorium at roughly the same time.",
        "D": "the error was introduced deliberately rather than by accident.",
    },
    answer="B",
    explanation=(
        "The mechanism the passage describes is inheritance: an error \"tends to be inherited by "
        "every manuscript copied from the one containing it.\" Two manuscripts sharing an "
        "unusual error therefore both descend from a copy where that error already existed. "
        "That is what choice B states, and it is the conclusion the described method licenses.\n\n"
        "Choice A is the most tempting error because it is one possible way the sharing could "
        "happen, but it is far more specific than the evidence supports — the shared ancestor "
        "could be several generations back, with neither manuscript copied from the other. "
        "Choice C adds claims about place and date that error-sharing says nothing about. "
        "Choice D contradicts the passage's premise that these errors arise in the ordinary "
        "course of copying."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0011",
    skill="Inferences",
    stem=(
        "Economists studying minimum wage increases have often compared employment in a state "
        "that raised its wage floor with employment in a neighboring state that did not. The "
        "method assumes that, absent the policy change, the two states' employment trends would "
        "have moved in parallel. Critics note that states rarely change wage policy at random: "
        "legislatures tend to act when local labor markets are already tightening. If this "
        "criticism is correct, then studies using the neighboring-state comparison are likely to "
        "______\n\n"
        "Which choice most logically completes the text?"
    ),
    choices={
        "A": "understate the true employment effect of the policy, because the comparison state's trend is measured imprecisely.",
        "B": "attribute to the policy an employment difference that partly reflects conditions that preceded it.",
        "C": "find no relationship between minimum wage increases and employment in either state.",
        "D": "overstate the number of workers directly affected by the wage increase.",
    },
    answer="B",
    explanation=(
        "The method rests on an assumption — that the two states would otherwise have moved in "
        "parallel. The criticism attacks that assumption by pointing out that states act "
        "precisely when their labor markets are \"already tightening,\" meaning the two states "
        "were on different trajectories before the policy. Any difference measured afterward "
        "therefore mixes the policy's effect with a pre-existing divergence, which is what "
        "choice B says.\n\n"
        "Choice A picks a direction the passage does not support and blames imprecision rather "
        "than a broken assumption. Choice C predicts a null result that nothing in the argument "
        "implies. Choice D concerns how many workers are covered, a different quantity from the "
        "employment effect being estimated."
    ),
)

rw(
    INFO,
    external_id="sp-rw-0012",
    skill="Inferences",
    stem=(
        "The Antikythera mechanism, recovered from a Roman-era shipwreck, contains at least 30 "
        "interlocking bronze gears arranged to model the motions of the sun and moon. Nothing of "
        "comparable mechanical sophistication survives from the following thousand years. "
        "Historians caution against concluding that the technology was lost, noting that bronze "
        "was routinely melted down and recast, and that the mechanism survived only because it "
        "sank. This caution suggests that the apparent thousand-year gap may be less a fact "
        "about ancient technology than ______\n\n"
        "Which choice most logically completes the text?"
    ),
    choices={
        "A": "a fact about which objects happen to have survived.",
        "B": "evidence that similar devices were built but never used.",
        "C": "a consequence of historians' reluctance to study bronze artifacts.",
        "D": "an indication that the mechanism was built much later than believed.",
    },
    answer="A",
    explanation=(
        "The historians' caution turns on two facts about survival, not about invention: bronze "
        "was \"routinely melted down and recast,\" and this device lasted only because it "
        "\"sank.\" Together these mean the absence of comparable objects may reflect what "
        "escaped destruction rather than what was made. Choice A draws exactly that "
        "distinction, and the sentence's structure — \"less a fact about ancient technology "
        "than\" — calls for a contrast of that kind.\n\n"
        "Choice B claims devices were built but unused, which the passage never suggests and "
        "which the survival argument does not support. Choice C blames historians, though the "
        "passage presents them as the source of the caution. Choice D redates the mechanism, "
        "contradicting its recovery from a Roman-era wreck."
    ),
)

# ===================== Craft and Structure: Words in Context =================

rw(
    CRAFT,
    external_id="sp-rw-0013",
    skill="Words in Context",
    stem=(
        "Choreographer Merce Cunningham used chance procedures — coin tosses, dice — to "
        "determine the order of movements in his dances. The method has often been described as "
        "an abdication of authorial control, but Cunningham's own account is more ______: he "
        "designed the set of movements that the coin toss would select among, and the range of "
        "possible outcomes was therefore entirely his.\n\n"
        "Which choice completes the text with the most logical and precise word or phrase?"
    ),
    choices={"A": "cynical", "B": "qualified", "C": "elaborate", "D": "conventional"},
    answer="B",
    explanation=(
        "The colon signals that what follows explains the missing word. Cunningham does not "
        "reject the description of chance procedures outright — he accepts the method while "
        "limiting how far the loss of control goes, since he chose the options among which "
        "chance selected. A view offered with limits or reservations is a qualified one, so "
        "choice B fits both the logic and the register.\n\n"
        "Choice A imputes distrust or self-interest that nothing in the text suggests. Choice C "
        "would mean detailed or complicated, but the point is not that his account is intricate "
        "— it is that it narrows the claim. Choice D is nearly opposite in effect: an account "
        "resting on chance procedures is precisely not conventional."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0014",
    skill="Words in Context",
    stem=(
        "Early radio astronomers faced a persistent difficulty: the signals they sought were so "
        "faint that ordinary electrical noise in their own equipment could ______ them entirely. "
        "Distinguishing a genuine astronomical source from an artifact of the receiver required "
        "observing the same patch of sky repeatedly and discarding anything that did not recur.\n\n"
        "Which choice completes the text with the most logical and precise word or phrase?"
    ),
    choices={"A": "amplify", "B": "swamp", "C": "displace", "D": "distort"},
    answer="B",
    explanation=(
        "The sentence describes faint signals threatened by noise, and the adverb \"entirely\" "
        "indicates the signal is lost rather than merely altered. To swamp something is to "
        "overwhelm it so completely that it cannot be detected, which matches both the physical "
        "situation and the force of \"entirely.\" The following sentence confirms the reading: "
        "astronomers had to repeat observations to tell a real source from an artifact.\n\n"
        "Choice A reverses the relationship — noise obscures the signal rather than "
        "strengthening it. Choice C suggests the signal is moved elsewhere, which misdescribes "
        "what noise does. Choice D is the closest competitor, but distortion implies a signal "
        "that survives in altered form, which does not fit \"entirely.\""
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0015",
    skill="Words in Context",
    stem=(
        "In her essays on translation, Anne Carson repeatedly returns to what she calls the "
        "untranslatable — not words that resist any rendering, but words whose renderings are "
        "all ______. Each available English word for the Greek term captures something real "
        "about it while quietly discarding something else, and no accumulation of near-misses "
        "adds up to the original.\n\n"
        "Which choice completes the text with the most logical and precise word or phrase?"
    ),
    choices={"A": "partial", "B": "obscure", "C": "arbitrary", "D": "identical"},
    answer="A",
    explanation=(
        "The second sentence defines the missing word: each rendering \"captures something real "
        "about it while quietly discarding something else.\" A translation that gets part of the "
        "meaning and loses part is partial, and the phrase \"no accumulation of near-misses\" "
        "reinforces that each one is incomplete rather than wrong. Choice A is precise.\n\n"
        "Choice B would mean unclear, but the problem is not that the renderings are hard to "
        "understand — each captures something real. Choice C implies the choices are unmotivated, "
        "contradicting the claim that each captures something genuine. Choice D is ruled out by "
        "the fact that the renderings differ in what they preserve."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0016",
    skill="Words in Context",
    stem=(
        "The pharmacologist's results were striking, but she presented them with notable "
        "______: the compound had reduced tumor growth in mice, she noted, and mice are not "
        "people; the dose had been calibrated to a body mass a thousand times smaller than a "
        "human's; and the trial had run for eleven weeks.\n\n"
        "Which choice completes the text with the most logical and precise word or phrase?"
    ),
    choices={"A": "reticence", "B": "circumspection", "C": "indifference", "D": "contrition"},
    answer="B",
    explanation=(
        "The colon lists what she did: named the limits of the animal model, the dose, and the "
        "trial's length. She is not withholding the results — she presents them — but she "
        "surrounds them with careful qualifications. Circumspection is exactly that: caution in "
        "considering the circumstances before drawing a conclusion.\n\n"
        "Choice A is the strongest distractor, but reticence means reluctance to speak, and she "
        "speaks at length; what is careful here is the framing, not the quantity of speech. "
        "Choice C contradicts the evident care she takes. Choice D implies remorse, which "
        "nothing in the text suggests she has anything to feel."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0017",
    skill="Words in Context",
    stem=(
        "Jazz pianist Mary Lou Williams composed for Andy Kirk's band, then for Duke Ellington's, "
        "then for Benny Goodman's, adapting her writing each time to musicians of markedly "
        "different temperaments. Critics who treat this as evidence of a career without a center "
        "mistake ______ for the absence of a voice.\n\n"
        "Which choice completes the text with the most logical and precise word or phrase?"
    ),
    choices={"A": "versatility", "B": "notoriety", "C": "diligence", "D": "imitation"},
    answer="A",
    explanation=(
        "The sentence follows the pattern \"mistake X for Y,\" where X is the thing critics "
        "misread and Y is their wrong conclusion. The passage describes Williams writing "
        "successfully for three bands of \"markedly different temperaments,\" and critics take "
        "that range to mean she had no voice of her own. The quality being misread is her range "
        "— her versatility.\n\n"
        "Choice B concerns fame, which the passage does not raise. Choice C names effort rather "
        "than adaptability, and hard work would not be mistaken for having no voice. Choice D "
        "would concede the critics' point rather than name what they misread, since imitation "
        "really does suggest an absent voice."
    ),
)

# ===================== Craft and Structure: Text Structure and Purpose =======

rw(
    CRAFT,
    external_id="sp-rw-0018",
    skill="Text Structure and Purpose",
    stem=(
        "The following is adapted from a 2019 article about materials science.\n\n"
        "Spider silk is often introduced with a comparison: weight for weight, it is stronger "
        "than steel. The claim is true and slightly misleading. Strength measures the force a "
        "material withstands before breaking, and by that measure silk does outperform steel "
        "per unit mass. But what makes silk remarkable in a web is toughness — the total energy "
        "it absorbs before failing — and toughness depends as much on how far a fiber stretches "
        "as on how hard it resists. Silk's advantage lies in the stretching.\n\n"
        "Which choice best describes the function of the underlined sentence (\"The claim is "
        "true and slightly misleading.\") in the text as a whole?"
    ),
    choices={
        "A": "It concedes the accuracy of a familiar comparison while signaling that the discussion will identify what the comparison obscures.",
        "B": "It disputes a widely repeated claim about spider silk that the rest of the text goes on to refute.",
        "C": "It introduces a technical distinction that the remainder of the text argues is unimportant for practical purposes.",
        "D": "It summarizes the conclusion of research that the rest of the text describes in detail.",
    },
    answer="A",
    explanation=(
        "The sentence does two things at once, and both halves matter. \"True\" grants the "
        "steel comparison, and the rest of the text confirms it: \"by that measure silk does "
        "outperform steel per unit mass.\" \"Slightly misleading\" sets up the turn at \"But,\" "
        "where the text explains that toughness, not strength, is what matters in a web. So the "
        "sentence concedes and previews, which is choice A.\n\n"
        "Choice B is wrong because the text never refutes the claim — it explicitly affirms it. "
        "Choice C inverts the argument: the strength-toughness distinction is presented as the "
        "important point, not a negligible one. Choice D describes a summary of research "
        "findings, but the sentence is an evaluation of a claim and no study is reported."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0019",
    skill="Text Structure and Purpose",
    stem=(
        "In 1977, the Voyager probes carried a gold-plated record of sounds and images intended "
        "for any intelligence that might find it. Carl Sagan, who chaired the committee that "
        "assembled it, was candid about the odds: the probability that the record would ever be "
        "recovered and understood was, he wrote, effectively zero. He defended the project "
        "anyway, on the grounds that a civilization willing to describe itself to strangers it "
        "would never meet was engaged in an exercise worth undertaking for its own sake.\n\n"
        "Which choice best describes the overall structure of the text?"
    ),
    choices={
        "A": "It describes a project, notes an objection its organizer accepted, and presents the rationale he offered instead.",
        "B": "It presents a scientific hypothesis, describes the experiment designed to test it, and reports the outcome.",
        "C": "It traces the development of a technology and evaluates its long-term influence on later projects.",
        "D": "It contrasts two competing explanations for a decision and argues that one is better supported.",
    },
    answer="A",
    explanation=(
        "Follow the three moves. The first sentence describes the record and its purpose. The "
        "second reports that Sagan himself granted the central objection — the odds of recovery "
        "were \"effectively zero.\" The third begins \"He defended the project anyway\" and "
        "supplies a different justification: the value of the act itself. That is exactly the "
        "sequence in choice A.\n\n"
        "Choice B imposes a hypothesis-experiment-result frame on a text with none of those "
        "elements. Choice C would require a developmental history and an assessment of "
        "influence, neither of which appears. Choice D describes a debate between two "
        "explanations, but only Sagan's reasoning is given, and it is not weighed against a rival."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0020",
    skill="Text Structure and Purpose",
    stem=(
        "The following is adapted from Charlotte Perkins Gilman's 1898 book Women and Economics.\n\n"
        "We are the only animal species in which the female depends on the male for food, the "
        "only animal species in which the sex-relation is also an economic relation. With us an "
        "entire sex lives in a relation of economic dependence upon the other sex, and the "
        "economic relation is combined with the sex-relation. The economic status of the human "
        "female is relative to the sex-relation.\n\n"
        "Which choice best describes the function of the text as a whole?"
    ),
    choices={
        "A": "It proposes a remedy for an economic arrangement the author has described elsewhere.",
        "B": "It states a claim about human social arrangements and restates it with increasing precision.",
        "C": "It recounts the historical origins of a practice the author considers outdated.",
        "D": "It concedes a common objection before offering evidence against it.",
    },
    answer="B",
    explanation=(
        "All three sentences make the same claim, each time more precisely. The first "
        "establishes human uniqueness by comparison with other species. The second drops the "
        "comparison and names the arrangement directly: an entire sex economically dependent on "
        "the other, with the economic and sex relations combined. The third compresses this into "
        "a single formulation. The movement is restatement and sharpening, which is choice B.\n\n"
        "Choice A is wrong because no remedy is proposed — the passage diagnoses rather than "
        "prescribes. Choice C requires a historical account of origins, but the text describes a "
        "present condition. Choice D would need an objection, and none is raised."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0021",
    skill="Text Structure and Purpose",
    stem=(
        "Archaeologists excavating a Bronze Age settlement recovered thousands of animal bones, "
        "and the assemblage was at first taken to reflect the community's ordinary diet. A "
        "reanalysis noted that the bones came almost entirely from young males of each species "
        "and that cut marks were concentrated at the joints rather than distributed along the "
        "shafts. Neither pattern is typical of routine butchery. The excavators now interpret "
        "the deposit as the residue of periodic feasts.\n\n"
        "Which choice best describes the function of the third sentence (\"Neither pattern is "
        "typical of routine butchery.\") in the text?"
    ),
    choices={
        "A": "It introduces a new line of evidence that the final sentence goes on to qualify.",
        "B": "It explains why the evidence in the preceding sentence undercuts the initial interpretation.",
        "C": "It acknowledges a limitation in the reanalysis described in the preceding sentence.",
        "D": "It restates the original interpretation in more technical language.",
    },
    answer="B",
    explanation=(
        "The sentence sits between the reanalysis's observations and the revised conclusion, and "
        "it supplies the link between them. On their own, the facts about young males and "
        "joint-concentrated cut marks are inert; the sentence tells us why they matter — neither "
        "is what routine butchery looks like. That is what licenses abandoning the "
        "ordinary-diet reading in favor of feasting, making choice B correct.\n\n"
        "Choice A is wrong because the sentence adds no new evidence; it interprets evidence "
        "already given. Choice C mistakes an argument against the original view for a concession "
        "about the reanalysis. Choice D reverses the sentence's direction, since it undercuts "
        "the original interpretation rather than restating it."
    ),
)

# ===================== Craft and Structure: Cross-Text Connections ===========

rw(
    CRAFT,
    external_id="sp-rw-0022",
    skill="Cross-Text Connections",
    stem=(
        "Text 1\n"
        "The popularity of a scientific paper is often measured by citation count, and the "
        "measure has obvious appeal: it is public, countable, and hard to fake at scale. Papers "
        "that shape a field get cited by the work they shape, so the count tracks influence.\n\n"
        "Text 2\n"
        "Citation counts capture a particular kind of influence and miss others. A method so "
        "thoroughly absorbed that researchers stop citing its source — the way no one cites the "
        "inventor of the histogram — registers as uninfluential precisely because it succeeded. "
        "The measure is best read as a record of what a field is still arguing about.\n\n"
        "Based on the texts, how would the author of Text 2 most likely characterize the "
        "conclusion drawn in the last sentence of Text 1?"
    ),
    choices={
        "A": "As correct for papers that introduce methods but not for papers that report findings.",
        "B": "As valid only for the period immediately following a paper's publication.",
        "C": "As accurate for contested work but unreliable for work that has become foundational.",
        "D": "As mistaken, since citation counts are too easily manipulated to measure anything.",
    },
    answer="C",
    explanation=(
        "Text 1 concludes that the count \"tracks influence.\" Text 2 does not reject this "
        "wholesale — it says citation counts \"capture a particular kind of influence and miss "
        "others.\" The kind they miss is illustrated by the histogram example: work so completely "
        "absorbed that it stops being cited registers as uninfluential \"precisely because it "
        "succeeded.\" The kind they capture is named in the last sentence: what a field is \"still "
        "arguing about.\" Choice C states both halves.\n\n"
        "Choice A draws a methods-versus-findings line that Text 2 never proposes; the histogram "
        "is an illustration, not a category boundary. Choice B introduces timing, but Text 2's "
        "point is about absorption, not recency. Choice D contradicts Text 2's explicit "
        "concession that the measure does capture something, and manipulation is Text 1's "
        "concern, not Text 2's."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0023",
    skill="Cross-Text Connections",
    stem=(
        "Text 1\n"
        "Restoration ecologists increasingly set historical benchmarks for their projects: a "
        "wetland is restored when its species composition matches what records show it held "
        "before drainage. The benchmark makes success measurable and keeps restoration from "
        "drifting into landscape design.\n\n"
        "Text 2\n"
        "Historical benchmarks assume that the past conditions can persist under present ones. "
        "Where mean temperature has risen by two degrees and the hydrology has been permanently "
        "altered, restoring the former species list produces an assemblage that requires "
        "continuous intervention to survive. A target should be a state the site can hold on its "
        "own.\n\n"
        "Based on the texts, the author of Text 2 would most likely argue that the benchmark "
        "described in Text 1 is"
    ),
    choices={
        "A": "unsuitable for sites whose underlying conditions have changed irreversibly.",
        "B": "too expensive to apply to wetlands of significant size.",
        "C": "useful for measuring success but inappropriate for setting initial goals.",
        "D": "insufficiently precise about which historical period should serve as the reference.",
    },
    answer="A",
    explanation=(
        "Text 2's objection is conditional and specific. It identifies the assumption behind "
        "historical benchmarks — \"that the past conditions can persist under present ones\" — "
        "and then names the circumstances where the assumption fails: risen temperature and "
        "\"permanently altered\" hydrology. In those cases the restored assemblage \"requires "
        "continuous intervention to survive.\" That is precisely choice A.\n\n"
        "Choice B raises cost, which Text 2 never mentions; the concern is self-sustainability. "
        "Choice C inverts the argument, since Text 2's closing sentence is explicitly about how "
        "to choose a target. Choice D asks which past to pick, but Text 2's complaint is that "
        "the past may be unreachable at all, whichever period is chosen."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0024",
    skill="Cross-Text Connections",
    stem=(
        "Text 1\n"
        "In her 1928 lectures, Virginia Woolf argued that the scarcity of women novelists before "
        "the nineteenth century reflected material conditions rather than ability: without "
        "income or an uninterrupted room, sustained composition was practically impossible.\n\n"
        "Text 2\n"
        "Woolf's material explanation is powerful but incomplete. Recent bibliographic work has "
        "recovered hundreds of women writing in the seventeenth century, often in forms Woolf "
        "did not count — devotional writing, letters, translations, manuscript verse circulated "
        "among readers. The scarcity Woolf described was partly a scarcity in the archive she "
        "consulted.\n\n"
        "Based on the texts, how would the author of Text 2 most likely respond to Woolf's "
        "argument as described in Text 1?"
    ),
    choices={
        "A": "By arguing that material conditions posed no real obstacle to women writers of the period.",
        "B": "By noting that the scarcity Woolf sought to explain was partly an artifact of how she defined and located authorship.",
        "C": "By contending that seventeenth-century women writers enjoyed greater financial independence than Woolf assumed.",
        "D": "By suggesting that devotional writing and letters require the same conditions as novel-writing.",
    },
    answer="B",
    explanation=(
        "Text 2 opens by calling Woolf's explanation \"powerful but incomplete,\" so the response "
        "is a supplement rather than a refutation. What it adds is that hundreds of women were "
        "writing \"in forms Woolf did not count\" and that the scarcity was \"partly a scarcity "
        "in the archive she consulted.\" Both halves — how authorship was defined and where it "
        "was looked for — appear in choice B.\n\n"
        "Choice A overstates the disagreement; \"powerful\" concedes the material argument has "
        "force. Choice C invents a claim about financial independence, whereas Text 2's evidence "
        "is bibliographic. Choice D asserts an equivalence of working conditions that Text 2 "
        "never makes and that would actually weaken its point about uncounted forms."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0025",
    skill="Cross-Text Connections",
    stem=(
        "Text 1\n"
        "Introducing predators to islands overrun by invasive rodents has repeatedly backfired: "
        "the predators take native birds, which are easier to catch, and rodent numbers recover "
        "within a season. The lesson is that biological control is too unpredictable to justify.\n\n"
        "Text 2\n"
        "The island failures share a feature: the introduced predator was a generalist. Where "
        "controls have used agents restricted to a single host — a wasp that parasitizes only "
        "one beetle species, say — outcomes have been consistent and reversals rare. The record "
        "argues for narrower agents, not for abandoning the method.\n\n"
        "Based on the texts, the author of Text 2 would most likely say that the lesson drawn in "
        "Text 1 is"
    ),
    choices={
        "A": "correct, though for reasons different from those Text 1 gives.",
        "B": "too broad, because it generalizes from cases sharing a feature that better controls avoid.",
        "C": "premature, because too few biological control programs have been attempted to support any conclusion.",
        "D": "irrelevant, because island ecosystems differ too greatly from mainland ones to permit comparison.",
    },
    answer="B",
    explanation=(
        "Text 1 moves from island failures to a sweeping conclusion about biological control as "
        "such. Text 2 identifies what those failures had in common — \"the introduced predator "
        "was a generalist\" — and contrasts them with host-specific agents, where \"outcomes have "
        "been consistent and reversals rare.\" Its closing sentence names the disagreement "
        "exactly: the record \"argues for narrower agents, not for abandoning the method.\" That "
        "is an objection to the scope of Text 1's inference, which is choice B.\n\n"
        "Choice A accepts Text 1's conclusion, but Text 2 rejects it. Choice C complains about "
        "sample size, while Text 2 relies on a track record it treats as informative. Choice D "
        "dismisses island evidence entirely, though Text 2 analyzes it rather than setting it "
        "aside."
    ),
)

rw(
    CRAFT,
    external_id="sp-rw-0026",
    skill="Words in Context",
    stem=(
        "Before the introduction of standardized time zones, each town set its clocks by local "
        "noon, and the resulting discrepancies were ______ enough to be ignored by nearly "
        "everyone. Railroads changed that: a schedule spanning several towns had to reconcile "
        "times that differed by minutes, and minutes were what separated two trains on one track.\n\n"
        "Which choice completes the text with the most logical and precise word or phrase?"
    ),
    choices={"A": "systematic", "B": "inconsequential", "C": "predictable", "D": "notorious"},
    answer="B",
    explanation=(
        "The word must explain why discrepancies were \"ignored by nearly everyone,\" and the "
        "sentence that follows sharpens the contrast: railroads made the same differences matter "
        "enormously, since \"minutes were what separated two trains on one track.\" Something "
        "ignorable because it does not matter is inconsequential, so choice B carries the "
        "contrast the passage is built on.\n\n"
        "Choices A and C are both true of the discrepancies — they were regular and could be "
        "anticipated — but neither explains why anyone would ignore them, and predictable "
        "differences are, if anything, easier to take into account. Choice D reverses the sense "
        "entirely, since a notorious problem is one everybody notices."
    ),
)
