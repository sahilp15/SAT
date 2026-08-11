"""Geometry & Trigonometry and Problem-Solving & Data Analysis — HARD."""

from fractions import Fraction as F
import math
import sympy as sp
from qbuild import Item, SECTION_MATH

x, y = sp.symbols("x y")

GEO = "Geometry and Trigonometry"
PSDA = "Problem-Solving and Data Analysis"

S_AV = "Area and volume"
S_LAT = "Lines, angles, and triangles"
S_RT = "Right triangles and trigonometry"
S_CIR = "Circles"

S_RATIO = "Ratios, rates, proportional relationships, and units"
S_PCT = "Percentages"
S_ONE = "One-variable data: Distributions and measures of center and spread"
S_TWO = "Two-variable data: Models and scatterplots"
S_PROB = "Probability and conditional probability"
S_INF = "Inference from sample statistics and margin of error"
S_CLAIM = "Evaluating statistical claims: Observational studies and experiments"

ITEMS = []


def geo(**kw):
    ITEMS.append(Item(section=SECTION_MATH, domain=GEO, difficulty="HARD", **kw))


def psda(**kw):
    ITEMS.append(Item(section=SECTION_MATH, domain=PSDA, difficulty="HARD", **kw))


# =========================== Area and volume =================================

geo(
    external_id="sp-m-0049",
    skill=S_AV,
    fmt="SPR",
    stem=(
        "A right circular cylinder has a volume of 400π cubic centimeters and a height of 16 "
        "centimeters. What is the radius, in centimeters, of the cylinder?"
    ),
    answer="5",
    explanation=(
        "The volume of a right circular cylinder is V = πr²h.\n\n"
        "Substituting the given values: 400π = πr²(16). Dividing both sides by π gives "
        "400 = 16r², so r² = 25 and r = 5.\n\n"
        "The negative root is discarded because a radius must be positive.\n\n"
        "A common error is to divide 400 by 16 and stop at 25, forgetting to take the square "
        "root."
    ),
    check=lambda: abs(math.pi * 5**2 * 16 - 400 * math.pi) < 1e-9,
)

geo(
    external_id="sp-m-0050",
    skill=S_AV,
    fmt="SPR",
    stem="A sphere has a volume of 288π cubic inches. What is the radius, in inches, of the sphere?",
    answer="6",
    explanation=(
        "The volume of a sphere is V = (4/3)πr³.\n\n"
        "Substituting gives 288π = (4/3)πr³. Dividing both sides by π gives 288 = (4/3)r³, and "
        "multiplying both sides by 3/4 gives r³ = 216.\n\n"
        "Since 216 = 6³, the radius is 6 inches.\n\n"
        "A common error is to take a square root instead of a cube root, or to multiply by 4/3 "
        "rather than by its reciprocal."
    ),
    check=lambda: abs(F(4, 3) * math.pi * 6**3 - 288 * math.pi) < 1e-9,
)

geo(
    external_id="sp-m-0051",
    skill=S_AV,
    fmt="SPR",
    stem=(
        "A right circular cone has a base radius of 6 inches and a height of h inches. Its "
        "volume is equal to the volume of a right circular cylinder with a base radius of 3 "
        "inches and a height of 8 inches. What is the value of h?"
    ),
    answer="6",
    explanation=(
        "The cylinder's volume is πr²h = π(3)²(8) = 72π cubic inches.\n\n"
        "The cone's volume is (1/3)πr²h = (1/3)π(6)²h = 12πh cubic inches.\n\n"
        "Setting them equal gives 12πh = 72π. Dividing both sides by 12π gives h = 6.\n\n"
        "The most common error is omitting the 1/3 in the cone formula, which gives h = 2."
    ),
    check=lambda: F(1, 3) * 6**2 * 6 == 3**2 * 8,
)

geo(
    external_id="sp-m-0052",
    skill=S_AV,
    fmt="MCQ",
    stem=(
        "Each dimension of a rectangular prism is multiplied by 2 to produce a larger "
        "rectangular prism. The volume of the larger prism is how many times the volume of the "
        "original prism?"
    ),
    choices={"A": "2", "B": "4", "C": "6", "D": "8"},
    answer="D",
    explanation=(
        "If the original prism has dimensions l, w, and h, its volume is lwh.\n\n"
        "The larger prism has dimensions 2l, 2w, and 2h, so its volume is "
        "(2l)(2w)(2h) = 8lwh.\n\n"
        "That is 8 times the original volume.\n\n"
        "In general, scaling every linear dimension by k multiplies volume by k³ and surface "
        "area by k². Choice A applies the scale factor once, and choice B applies it twice — "
        "that would be the effect on surface area, not volume."
    ),
    check=lambda: (2 * 3) * (2 * 4) * (2 * 5) == 8 * (3 * 4 * 5),
)

geo(
    external_id="sp-m-0053",
    skill=S_AV,
    fmt="MCQ",
    stem=(
        "Two solids are similar. The ratio of their surface areas is 9 to 25. What is the ratio "
        "of their volumes?"
    ),
    choices={"A": "3 to 5", "B": "9 to 25", "C": "27 to 125", "D": "81 to 625"},
    answer="C",
    explanation=(
        "For similar solids, surface areas scale with the square of the ratio of corresponding "
        "lengths, and volumes scale with the cube of that ratio.\n\n"
        "Since the surface area ratio is 9 to 25, the length ratio is √9 to √25, which is "
        "3 to 5.\n\n"
        "Cubing gives the volume ratio: 3³ to 5³, which is 27 to 125.\n\n"
        "Choice A stops at the length ratio. Choice B repeats the surface area ratio. Choice D "
        "squares the surface area ratio instead of working back to lengths first."
    ),
    check=lambda: F(3, 5) ** 2 == F(9, 25) and F(3, 5) ** 3 == F(27, 125),
)

# ====================== Lines, angles, and triangles =========================

geo(
    external_id="sp-m-0054",
    skill=S_LAT,
    fmt="SPR",
    stem=(
        "Triangle ABC is similar to triangle DEF, where side AB corresponds to side DE. The "
        "length of AB is 6 and the length of DE is 15. If the area of triangle ABC is 20 square "
        "units, what is the area, in square units, of triangle DEF?"
    ),
    answer="125",
    explanation=(
        "The ratio of corresponding sides is 6 to 15, which reduces to 2 to 5.\n\n"
        "For similar figures, the ratio of areas is the square of the ratio of corresponding "
        "sides: 2² to 5², or 4 to 25.\n\n"
        "So the area of DEF is 20 × (25/4) = 125 square units.\n\n"
        "A common error is to scale the area by 5/2 directly, giving 50, which ignores that "
        "area is two-dimensional."
    ),
    check=lambda: 20 * F(5, 2) ** 2 == 125,
)

geo(
    external_id="sp-m-0055",
    skill=S_LAT,
    fmt="SPR",
    stem=(
        "The measures of the three interior angles of a triangle are (2x + 10)°, (3x - 20)°, "
        "and (x + 40)°. What is the measure, in degrees, of the largest interior angle of the "
        "triangle?"
    ),
    answer="65",
    explanation=(
        "The interior angles of a triangle sum to 180°, so "
        "(2x + 10) + (3x - 20) + (x + 40) = 180.\n\n"
        "Collecting terms gives 6x + 30 = 180, so 6x = 150 and x = 25.\n\n"
        "Substituting back: 2(25) + 10 = 60, 3(25) - 20 = 55, and 25 + 40 = 65. The three "
        "angles are 60°, 55°, and 65°, which do sum to 180°.\n\n"
        "The largest is 65°. Note the question asks for the angle measure, not for x — stopping "
        "at x = 25 is the trap."
    ),
    check=lambda: (
        (lambda v=25: (2 * v + 10) + (3 * v - 20) + (v + 40) == 180
         and max(2 * v + 10, 3 * v - 20, v + 40) == 65)()
    ),
)

geo(
    external_id="sp-m-0056",
    skill=S_LAT,
    fmt="SPR",
    stem=(
        "Two parallel lines are cut by a transversal. One angle measures "
        "(3x - 15)° and the corresponding angle measures (2x + 25)°. What is the value of x?"
    ),
    answer="40",
    explanation=(
        "When two parallel lines are cut by a transversal, corresponding angles are congruent, "
        "so their measures are equal.\n\n"
        "Setting them equal gives 3x - 15 = 2x + 25. Subtracting 2x from both sides gives "
        "x - 15 = 25, so x = 40.\n\n"
        "Checking: 3(40) - 15 = 105 and 2(40) + 25 = 105, which agree.\n\n"
        "A common error is to treat the angles as supplementary and set the sum to 180, which "
        "applies to same-side interior angles, not corresponding ones."
    ),
    check=lambda: 3 * 40 - 15 == 2 * 40 + 25,
)

geo(
    external_id="sp-m-0057",
    skill=S_LAT,
    fmt="SPR",
    stem=(
        "In triangle ABC, the measure of angle A is 55°. The exterior angle at vertex C measures "
        "130°. What is the measure, in degrees, of angle B?"
    ),
    answer="75",
    explanation=(
        "The exterior angle theorem says an exterior angle equals the sum of the two "
        "non-adjacent interior angles. The exterior angle at C is not adjacent to angles A and "
        "B, so 130 = 55 + (angle B).\n\n"
        "Therefore angle B = 130 - 55 = 75°.\n\n"
        "This can be confirmed the long way: the interior angle at C is 180 - 130 = 50°, and "
        "then 55 + 50 + (angle B) = 180 gives angle B = 75°."
    ),
    check=lambda: (130 - 55 == 75) and (55 + (180 - 130) + 75 == 180),
)

geo(
    external_id="sp-m-0058",
    skill=S_LAT,
    fmt="MCQ",
    stem=(
        "In an isosceles triangle, the measure of the vertex angle is 40°. What is the measure "
        "of each base angle?"
    ),
    choices={"A": "40°", "B": "50°", "C": "70°", "D": "140°"},
    answer="C",
    explanation=(
        "An isosceles triangle has two congruent base angles. If each measures b degrees, then "
        "40 + b + b = 180.\n\n"
        "So 2b = 140 and b = 70.\n\n"
        "Each base angle measures 70°.\n\n"
        "Choice D is the sum of the two base angles rather than one of them. Choice B comes "
        "from treating the vertex angle as part of a right angle, and choice A from assuming "
        "the triangle is equiangular."
    ),
    check=lambda: 40 + 70 + 70 == 180,
)

# =================== Right triangles and trigonometry ========================

geo(
    external_id="sp-m-0059",
    skill=S_RT,
    fmt="MCQ",
    stem=(
        "In right triangle ABC, the measure of angle B is 90°, AB = 8, and BC = 15. What is the "
        "value of sin A?"
    ),
    choices={"A": "8/17", "B": "15/17", "C": "8/15", "D": "15/8"},
    answer="B",
    explanation=(
        "Since angle B is the right angle, side AC is the hypotenuse. By the Pythagorean "
        "theorem, AC² = 8² + 15² = 64 + 225 = 289, so AC = 17.\n\n"
        "The sine of an angle is the length of the opposite leg divided by the hypotenuse. The "
        "leg opposite angle A is BC = 15.\n\n"
        "So sin A = 15/17.\n\n"
        "Choice A is cos A, using the adjacent leg instead. Choice C is tan A, and choice D is "
        "its reciprocal."
    ),
    check=lambda: (8**2 + 15**2 == 17**2) and F(15, 17) == F(15, 17),
)

geo(
    external_id="sp-m-0060",
    skill=S_RT,
    fmt="MCQ",
    stem="If cos(x°) = 3/5, where 0 < x < 90, what is the value of sin((90 - x)°)?",
    choices={"A": "3/5", "B": "4/5", "C": "5/3", "D": "2/5"},
    answer="A",
    explanation=(
        "The sine of an angle equals the cosine of its complement: sin(90 - x)° = cos(x°).\n\n"
        "Since cos(x°) = 3/5, it follows that sin((90 - x)°) = 3/5.\n\n"
        "This is why the two functions are called cofunctions. In a right triangle the two "
        "acute angles are complementary, and the leg adjacent to one is opposite the other — "
        "the same ratio, read from the other angle.\n\n"
        "Choice B is sin(x°), found by completing the 3-4-5 triangle, but that answers a "
        "different question. Choice C inverts the ratio."
    ),
    check=lambda: abs(math.sin(math.radians(90 - math.degrees(math.acos(0.6)))) - 0.6) < 1e-9,
)

geo(
    external_id="sp-m-0061",
    skill=S_RT,
    fmt="SPR",
    stem=(
        "A straight ladder 25 feet long leans against a vertical wall. The base of the ladder is "
        "7 feet from the wall, measured along level ground. How many feet up the wall does the "
        "top of the ladder reach?"
    ),
    answer="24",
    explanation=(
        "The wall, the ground, and the ladder form a right triangle in which the ladder is the "
        "hypotenuse.\n\n"
        "By the Pythagorean theorem, 7² + h² = 25², so 49 + h² = 625 and h² = 576.\n\n"
        "Therefore h = 24 feet.\n\n"
        "A common error is to subtract the lengths directly, giving 18, rather than subtracting "
        "the squares and then taking a square root."
    ),
    check=lambda: 7**2 + 24**2 == 25**2,
)

geo(
    external_id="sp-m-0062",
    skill=S_RT,
    fmt="MCQ",
    stem="In a right triangle, the tangent of one acute angle θ is 5/12. What is the value of sin θ?",
    choices={"A": "5/13", "B": "12/13", "C": "5/12", "D": "13/5"},
    answer="A",
    explanation=(
        "Tangent is opposite over adjacent, so the leg opposite θ can be taken as 5 and the leg "
        "adjacent to θ as 12.\n\n"
        "The hypotenuse follows from the Pythagorean theorem: 5² + 12² = 25 + 144 = 169, so the "
        "hypotenuse is 13.\n\n"
        "Sine is opposite over hypotenuse, so sin θ = 5/13.\n\n"
        "Choice B is cos θ. Choice C repeats the tangent. Choice D is the reciprocal of the "
        "sine."
    ),
    check=lambda: (5**2 + 12**2 == 13**2)
    and abs(math.sin(math.atan(5 / 12)) - 5 / 13) < 1e-12,
)

geo(
    external_id="sp-m-0063",
    skill=S_RT,
    fmt="SPR",
    stem=(
        "In a 30-60-90 triangle, the length of the longer leg is 9√3. What is the length of the "
        "hypotenuse?"
    ),
    answer="18",
    explanation=(
        "In a 30-60-90 triangle the sides are in the ratio 1 : √3 : 2, where the shorter leg "
        "corresponds to 1, the longer leg to √3, and the hypotenuse to 2.\n\n"
        "The longer leg is 9√3, which matches s√3 with s = 9. So the shorter leg is 9.\n\n"
        "The hypotenuse is twice the shorter leg: 2(9) = 18.\n\n"
        "A common error is to double the longer leg, giving 18√3, or to treat 9√3 as the "
        "shorter leg."
    ),
    check=lambda: abs((9 * math.sqrt(3)) / math.sin(math.radians(60)) - 18) < 1e-9,
)

# ================================ Circles ====================================

geo(
    external_id="sp-m-0064",
    skill=S_CIR,
    fmt="SPR",
    stem=(
        "x² + y² - 6x + 8y - 11 = 0\n\n"
        "The given equation defines a circle in the xy-plane. What is the radius of the circle?"
    ),
    answer="6",
    explanation=(
        "Complete the square in x and in y to reach standard form.\n\n"
        "Group the terms: (x² - 6x) + (y² + 8y) = 11. To complete the square in x, add "
        "(-6/2)² = 9; to complete the square in y, add (8/2)² = 16. Both must be added to the "
        "right side as well.\n\n"
        "That gives (x - 3)² + (y + 4)² = 11 + 9 + 16 = 36.\n\n"
        "Standard form is (x - h)² + (y - k)² = r², so r² = 36 and the radius is 6.\n\n"
        "A common error is to report 36 as the radius, or to forget to add 9 and 16 to the "
        "right side."
    ),
    check=lambda: sp.expand((x - 3) ** 2 + (y + 4) ** 2 - 36)
    == sp.expand(x**2 + y**2 - 6 * x + 8 * y - 11),
)

geo(
    external_id="sp-m-0065",
    skill=S_CIR,
    fmt="MCQ",
    stem=(
        "A circle in the xy-plane has its center at (2, -5) and a radius of 4. Which equation "
        "defines this circle?"
    ),
    choices={
        "A": "(x - 2)² + (y + 5)² = 16",
        "B": "(x + 2)² + (y - 5)² = 16",
        "C": "(x - 2)² + (y + 5)² = 4",
        "D": "(x - 2)² + (y - 5)² = 16",
    },
    answer="A",
    explanation=(
        "The standard form of a circle is (x - h)² + (y - k)² = r², where (h, k) is the center "
        "and r is the radius.\n\n"
        "With h = 2 the first factor is (x - 2)². With k = -5 the second factor is "
        "(y - (-5))² = (y + 5)² — the sign flips because the form subtracts the coordinate.\n\n"
        "With r = 4 the right side is r² = 16.\n\n"
        "So the equation is (x - 2)² + (y + 5)² = 16.\n\n"
        "Choice B negates both coordinates. Choice C uses the radius instead of its square. "
        "Choice D keeps the wrong sign on the y-coordinate."
    ),
    check=lambda: sp.expand((2 - 2) ** 2 + (-5 + 5) ** 2) == 0,
)

geo(
    external_id="sp-m-0066",
    skill=S_CIR,
    fmt="MCQ",
    stem=(
        "In a circle with a radius of 8, a central angle measures 45°. What is the length of the "
        "arc the angle intercepts?"
    ),
    choices={"A": "π", "B": "2π", "C": "4π", "D": "16π"},
    answer="B",
    explanation=(
        "An arc length is the same fraction of the circumference as its central angle is of a "
        "full rotation.\n\n"
        "The full circumference is 2πr = 2π(8) = 16π, and 45° is 45/360 = 1/8 of a full "
        "rotation.\n\n"
        "So the arc length is (1/8)(16π) = 2π.\n\n"
        "Choice D is the whole circumference. Choice C comes from using the diameter as the "
        "radius, and choice A from using 1/16 of the circumference."
    ),
    check=lambda: abs(F(45, 360) * 2 * math.pi * 8 - 2 * math.pi) < 1e-9,
)

geo(
    external_id="sp-m-0067",
    skill=S_CIR,
    fmt="MCQ",
    stem=(
        "A sector of a circle with a radius of 6 has a central angle measuring 120°. What is the "
        "area of the sector?"
    ),
    choices={"A": "4π", "B": "9π", "C": "12π", "D": "36π"},
    answer="C",
    explanation=(
        "A sector's area is the same fraction of the circle's area as its central angle is of a "
        "full rotation.\n\n"
        "The full area is πr² = π(6)² = 36π, and 120° is 120/360 = 1/3 of a full rotation.\n\n"
        "So the sector's area is (1/3)(36π) = 12π.\n\n"
        "Choice D is the area of the whole circle. Choice A comes from applying the fraction "
        "1/3 twice, and choice B from using 1/4 of the circle."
    ),
    check=lambda: abs(F(120, 360) * math.pi * 36 - 12 * math.pi) < 1e-9,
)

geo(
    external_id="sp-m-0068",
    skill=S_CIR,
    fmt="SPR",
    stem=(
        "In a circle, a central angle measuring π/3 radians intercepts an arc of length 5π. What "
        "is the radius of the circle?"
    ),
    answer="15",
    explanation=(
        "When a central angle is measured in radians, arc length is given by s = rθ.\n\n"
        "Substituting gives 5π = r(π/3). Multiplying both sides by 3/π gives r = 15.\n\n"
        "This formula only works in radians — converting π/3 to 60° first and then using it "
        "directly in s = rθ would give the wrong answer, which is why the radian form is worth "
        "recognizing."
    ),
    check=lambda: abs(15 * (math.pi / 3) - 5 * math.pi) < 1e-9,
)

# ===================== PSDA: ratios, rates, proportions ======================

psda(
    external_id="sp-m-0069",
    skill=S_RATIO,
    fmt="SPR",
    stem=(
        "A recipe calls for flour and sugar in a ratio of 7 to 3 by volume. A baker uses 4.5 "
        "cups of sugar. How many cups of flour should the baker use?"
    ),
    answer="10.5",
    explanation=(
        "Set up a proportion with flour over sugar on both sides: 7/3 = f/4.5.\n\n"
        "Cross-multiplying gives 3f = 7(4.5) = 31.5, so f = 10.5.\n\n"
        "Another way: 4.5 cups of sugar is 4.5/3 = 1.5 times the 3 parts in the ratio, so the "
        "flour is 1.5 × 7 = 10.5 cups.\n\n"
        "The answer may be entered as 10.5 or 21/2. A common error is to invert the ratio, "
        "which gives about 1.93 cups."
    ),
    check=lambda: F(7, 3) == F(F(21, 2), F(9, 2)),
)

psda(
    external_id="sp-m-0070",
    skill=S_RATIO,
    fmt="SPR",
    stem=(
        "A pump moves 450 liters of water in 6 minutes at a constant rate. At this rate, how "
        "many liters of water does the pump move in 1 hour?"
    ),
    answer="4500",
    explanation=(
        "First find the rate per minute: 450 liters ÷ 6 minutes = 75 liters per minute.\n\n"
        "One hour is 60 minutes, so the pump moves 75 × 60 = 4,500 liters.\n\n"
        "Alternatively, 1 hour is 10 times 6 minutes, so the volume is 10 × 450 = 4,500 liters — "
        "the same answer with less arithmetic.\n\n"
        "A common error is to stop at 75, answering the per-minute rate rather than the hourly "
        "total."
    ),
    check=lambda: F(450, 6) * 60 == 4500,
)

psda(
    external_id="sp-m-0071",
    skill=S_RATIO,
    fmt="SPR",
    stem=(
        "The variable y is directly proportional to the variable x. When x = 8, y = 20. What is "
        "the value of y when x = 14?"
    ),
    answer="35",
    explanation=(
        "Direct proportionality means y = kx for some constant k.\n\n"
        "Substituting the known pair gives 20 = k(8), so k = 20/8 = 2.5.\n\n"
        "Then when x = 14, y = 2.5(14) = 35.\n\n"
        "A proportion works too: 20/8 = y/14, so 8y = 280 and y = 35. Note that adding 6 to x "
        "does not mean adding 6 to y — proportional relationships scale, they do not shift."
    ),
    check=lambda: F(20, 8) * 14 == 35,
)

# ============================== PSDA: percentages ============================

psda(
    external_id="sp-m-0072",
    skill=S_PCT,
    fmt="MCQ",
    stem=(
        "The price of an item is increased by 25%. The new price is then decreased by 20%. "
        "Compared with the original price, the final price is"
    ),
    choices={
        "A": "5% greater.",
        "B": "the same.",
        "C": "5% less.",
        "D": "45% greater.",
    },
    answer="B",
    explanation=(
        "Percent changes multiply, they do not add. Let the original price be P.\n\n"
        "A 25% increase multiplies by 1.25, giving 1.25P. A 20% decrease then multiplies by "
        "0.80, giving (1.25)(0.80)P = 1.00P.\n\n"
        "The final price equals the original price, so there is no net change.\n\n"
        "Choice A comes from subtracting the percentages (25 - 20 = 5), which ignores that the "
        "20% is taken from the larger, increased price. Choice D adds them. A concrete check: "
        "$100 becomes $125, and 20% of $125 is $25, bringing it back to $100."
    ),
    check=lambda: abs(1.25 * 0.80 - 1.0) < 1e-12,
)

psda(
    external_id="sp-m-0073",
    skill=S_PCT,
    fmt="SPR",
    stem=(
        "After a discount of 15%, the price of a jacket is $102. What was the price, in dollars, "
        "of the jacket before the discount?"
    ),
    answer="120",
    explanation=(
        "A 15% discount means the buyer pays 100% - 15% = 85% of the original price.\n\n"
        "If P is the original price, then 0.85P = 102, so P = 102/0.85 = 120.\n\n"
        "Checking: 15% of 120 is 18, and 120 - 18 = 102.\n\n"
        "A common error is to take 15% of 102 and add it, giving 117.30. That applies the "
        "percentage to the wrong base — the discount was computed from the original price, not "
        "the sale price."
    ),
    check=lambda: abs(0.85 * 120 - 102) < 1e-9,
)

psda(
    external_id="sp-m-0074",
    skill=S_PCT,
    fmt="SPR",
    stem=(
        "In a survey of 800 randomly selected residents, 240 said they use public transit "
        "weekly. If the same percentage holds for a different group of 1,500 residents, how many "
        "of those residents would be expected to use public transit weekly?"
    ),
    answer="450",
    explanation=(
        "First find the percentage: 240/800 = 0.30, or 30%.\n\n"
        "Applying that percentage to 1,500 residents gives 0.30 × 1,500 = 450.\n\n"
        "A proportion gives the same result: 240/800 = n/1500, so 800n = 360,000 and n = 450.\n\n"
        "A common error is to scale by the difference between the group sizes rather than by "
        "the ratio."
    ),
    check=lambda: F(240, 800) * 1500 == 450,
)

# ========================= PSDA: one-variable data ===========================

psda(
    external_id="sp-m-0075",
    skill=S_ONE,
    fmt="SPR",
    stem=(
        "The mean of a list of 6 numbers is 15. When one number is removed from the list, the "
        "mean of the remaining 5 numbers is 16. What is the value of the number that was "
        "removed?"
    ),
    answer="10",
    explanation=(
        "The mean is the sum divided by the count, so the sum is the mean times the count.\n\n"
        "The original 6 numbers sum to 6 × 15 = 90. The remaining 5 numbers sum to "
        "5 × 16 = 80.\n\n"
        "The number removed is the difference: 90 - 80 = 10.\n\n"
        "It makes sense that the removed value is below the original mean — taking out a "
        "below-average number pulls the mean up, which is exactly what happened here."
    ),
    check=lambda: 6 * 15 - 5 * 16 == 10,
)

psda(
    external_id="sp-m-0076",
    skill=S_ONE,
    fmt="MCQ",
    stem=(
        "A data set of 40 values has a mean of 50 and a median of 48. A single new value of 200 "
        "is added to the data set. Which of the following best describes the effect on the mean "
        "and the median?"
    ),
    choices={
        "A": "The mean increases by more than the median does.",
        "B": "The median increases by more than the mean does.",
        "C": "Both increase by the same amount.",
        "D": "Neither the mean nor the median changes.",
    },
    answer="A",
    explanation=(
        "The mean depends on the actual size of every value, so an extreme value pulls it "
        "noticeably. Adding 200 raises the sum by 200 while the count rises only from 40 to 41, "
        "and the new mean is (40 × 50 + 200)/41 ≈ 53.7 — an increase of about 3.7.\n\n"
        "The median depends only on position. Adding one value above all the others shifts the "
        "middle position by at most one place in the ordered list, so the median moves very "
        "little — typically by a fraction of the gap between two neighboring values.\n\n"
        "This is why the median is called resistant to outliers and the mean is not. Choice D "
        "is wrong because the mean definitely changes, and choices B and C reverse or flatten "
        "the relationship."
    ),
    check=lambda: ((40 * 50 + 200) / 41 - 50) > 3.0,
)

psda(
    external_id="sp-m-0077",
    skill=S_ONE,
    fmt="MCQ",
    stem=(
        "Data set X consists of the values 20, 20, 20, 20, and 20. Data set Y consists of the "
        "values 4, 12, 20, 28, and 36. Which of the following correctly compares the two data "
        "sets?"
    ),
    choices={
        "A": "The two sets have the same mean and the same standard deviation.",
        "B": "The two sets have the same mean, and Y has the greater standard deviation.",
        "C": "The two sets have the same mean, and X has the greater standard deviation.",
        "D": "Y has the greater mean and the greater standard deviation.",
    },
    answer="B",
    explanation=(
        "Both sets have mean 20. For X this is immediate. For Y, the sum is "
        "4 + 12 + 20 + 28 + 36 = 100, and 100/5 = 20.\n\n"
        "Standard deviation measures how far the values spread from the mean. Every value in X "
        "equals the mean, so X has a standard deviation of exactly 0 — the smallest possible. "
        "The values in Y range from 4 to 36, so Y is clearly more spread out.\n\n"
        "Therefore the means are equal and Y has the greater standard deviation.\n\n"
        "Choice D is wrong because equal means can hide very different spreads — that is "
        "precisely the point of measuring spread separately."
    ),
    check=lambda: (
        sum([20] * 5) / 5 == sum([4, 12, 20, 28, 36]) / 5
        and 0 < (sum((v - 20) ** 2 for v in [4, 12, 20, 28, 36]) / 5) ** 0.5
    ),
)

# ========================= PSDA: two-variable data ===========================

psda(
    external_id="sp-m-0078",
    skill=S_TWO,
    fmt="SPR",
    stem=(
        "For a set of data, the line of best fit is given by y = 3.2x + 15. For the data point "
        "with x = 10, the actual value of y is 50. What is the residual for this data point?"
    ),
    answer="3",
    explanation=(
        "A residual is the actual value minus the predicted value.\n\n"
        "The line predicts y = 3.2(10) + 15 = 32 + 15 = 47.\n\n"
        "The actual value is 50, so the residual is 50 - 47 = 3.\n\n"
        "A positive residual means the point lies above the line of best fit — the model "
        "underpredicted. Reversing the subtraction gives -3, which is the most common error."
    ),
    check=lambda: abs((50 - (3.2 * 10 + 15)) - 3) < 1e-9,
)

psda(
    external_id="sp-m-0079",
    skill=S_TWO,
    fmt="MCQ",
    stem=(
        "A biologist records the number of bacteria in a culture each hour and obtains the "
        "values 50, 100, 200, 400, and 800. Which type of model best fits these data?"
    ),
    choices={
        "A": "A decreasing linear model",
        "B": "An increasing linear model",
        "C": "An increasing exponential model",
        "D": "A decreasing exponential model",
    },
    answer="C",
    explanation=(
        "Check how the values change from one hour to the next. The differences are 50, 100, "
        "200, and 400 — not constant, so the data are not linear.\n\n"
        "Now check the ratios: 100/50 = 2, 200/100 = 2, 400/200 = 2, and 800/400 = 2. The "
        "values are multiplied by the same factor each hour, which is the defining property of "
        "an exponential model.\n\n"
        "Since the factor is greater than 1, the model is increasing. The data fit "
        "y = 50(2)^x.\n\n"
        "Choices A and D describe decreasing behavior, but the values are growing. Choice B "
        "would require a constant difference, which these data do not have."
    ),
    check=lambda: (
        [F(b, a) for a, b in zip([50, 100, 200, 400], [100, 200, 400, 800])] == [2, 2, 2, 2]
    ),
)

# ============================= PSDA: probability =============================

psda(
    external_id="sp-m-0080",
    skill=S_PROB,
    fmt="MCQ",
    stem=(
        "The table shows the results of a survey of 200 students.\n\n"
        "                  Enrolled    Not enrolled    Total\n"
        "Seniors              48            32           80\n"
        "Juniors              54            66          120\n"
        "Total               102            98          200\n\n"
        "If one of the surveyed students is selected at random, what is the probability that the "
        "student is a senior who is enrolled?"
    ),
    choices={"A": "48/200", "B": "48/80", "C": "48/102", "D": "80/200"},
    answer="A",
    explanation=(
        "The phrase 'a senior who is enrolled' describes a single cell of the table: the 48 "
        "students who are both.\n\n"
        "Because the student is chosen at random from everyone surveyed, the denominator is the "
        "overall total, 200.\n\n"
        "So the probability is 48/200.\n\n"
        "Choice B is the conditional probability that a student is enrolled given that the "
        "student is a senior. Choice C is the probability of being a senior given that the "
        "student is enrolled. Both answer narrower questions — the giveaway is that the "
        "question here restricts the pool to no one, so the total must be 200."
    ),
    check=lambda: (48 + 32 == 80) and (54 + 66 == 120) and (48 + 54 == 102) and (80 + 120 == 200),
)

psda(
    external_id="sp-m-0081",
    skill=S_PROB,
    fmt="MCQ",
    stem=(
        "The table shows the results of a survey of 200 students.\n\n"
        "                  Enrolled    Not enrolled    Total\n"
        "Seniors              48            32           80\n"
        "Juniors              54            66          120\n"
        "Total               102            98          200\n\n"
        "If a student is selected at random from those who are enrolled, what is the probability "
        "that the student is a junior?"
    ),
    choices={"A": "54/200", "B": "54/120", "C": "54/102", "D": "102/200"},
    answer="C",
    explanation=(
        "The phrase 'selected at random from those who are enrolled' restricts the pool before "
        "the selection happens. Only the 102 enrolled students are eligible, so 102 is the "
        "denominator.\n\n"
        "Among those 102 enrolled students, 54 are juniors.\n\n"
        "So the probability is 54/102.\n\n"
        "Choice A uses the full survey as the denominator, ignoring the restriction. Choice B "
        "reverses the condition, giving the probability of being enrolled given that the "
        "student is a junior. Reading which group the selection is drawn from is the whole task "
        "in a conditional probability question."
    ),
    check=lambda: (54 + 48 == 102) and F(54, 102) != F(54, 120) != F(54, 200),
)

# ====================== PSDA: inference and margin of error ==================

psda(
    external_id="sp-m-0082",
    skill=S_INF,
    fmt="MCQ",
    stem=(
        "A polling organization surveyed a random sample of registered voters in a city and "
        "found that 42% of those surveyed supported a proposed measure, with an associated "
        "margin of error of 3% at a 95% confidence level. Which of the following is the most "
        "appropriate conclusion?"
    ),
    choices={
        "A": "Exactly 42% of all registered voters in the city support the measure.",
        "B": "It is plausible that between 39% and 45% of all registered voters in the city support the measure.",
        "C": "Every random sample of the same size would find between 39% and 45% support.",
        "D": "Between 39% and 45% of the people surveyed support the measure.",
    },
    answer="B",
    explanation=(
        "A margin of error describes the uncertainty in using a sample to estimate a whole "
        "population. The interval is the estimate plus or minus the margin: 42% - 3% = 39% to "
        "42% + 3% = 45%.\n\n"
        "The correct reading is that this interval gives a plausible range for the true "
        "population value — not a guarantee, and not a statement about the sample.\n\n"
        "Choice A treats the sample estimate as exact, which is precisely what a margin of "
        "error rules out. Choice C overstates the guarantee; at a 95% confidence level, some "
        "samples will fall outside the interval. Choice D applies the interval to the people "
        "surveyed, but 42% of them supported the measure — that value is known exactly, and "
        "needs no margin of error."
    ),
    check=lambda: (42 - 3 == 39) and (42 + 3 == 45),
)

psda(
    external_id="sp-m-0083",
    skill=S_INF,
    fmt="MCQ",
    stem=(
        "A researcher wants to estimate the average number of hours per week that students at a "
        "large university spend exercising. Which of the following sampling methods would best "
        "support generalizing the result to all students at the university?"
    ),
    choices={
        "A": "Surveying every student who visits the campus gym during one week",
        "B": "Surveying 200 students selected at random from the university's full enrollment list",
        "C": "Surveying the 200 students who respond first to a post on a campus fitness forum",
        "D": "Surveying every student in the university's varsity athletics programs",
    },
    answer="B",
    explanation=(
        "A result can be generalized to a population only when the sample is selected at random "
        "from that entire population. Random selection is what makes the sample representative "
        "and gives the margin of error meaning.\n\n"
        "Choice B draws at random from the full enrollment list, which is exactly the population "
        "of interest.\n\n"
        "Choices A, C, and D all sample groups that exercise more than students in general, so "
        "each would overestimate the average. Choice C is additionally a voluntary-response "
        "sample, which is biased toward people with strong opinions on the topic. Increasing "
        "the size of a biased sample does not fix the bias."
    ),
    check=lambda: True,  # conceptual item; no computation to recheck
)

psda(
    external_id="sp-m-0084",
    skill=S_CLAIM,
    fmt="MCQ",
    stem=(
        "Researchers observed 5,000 adults over ten years and recorded both their daily walking "
        "habits and their blood pressure. They found that adults who walked more had lower blood "
        "pressure on average. Which of the following is the most appropriate conclusion from "
        "this study?"
    ),
    choices={
        "A": "Walking more causes a reduction in blood pressure.",
        "B": "There is an association between walking more and having lower blood pressure, but causation cannot be concluded.",
        "C": "Having lower blood pressure causes adults to walk more.",
        "D": "There is no relationship between walking and blood pressure.",
    },
    answer="B",
    explanation=(
        "This is an observational study: the researchers recorded what participants already did "
        "rather than assigning them to walk a set amount. Without random assignment, other "
        "variables — overall health, age, diet, existing conditions — could differ between the "
        "groups and explain the pattern.\n\n"
        "So the data support an association, but not a cause-and-effect claim in either "
        "direction.\n\n"
        "Choices A and C both assert causation, and neither can be supported by an observational "
        "design; a randomized controlled experiment would be needed. Choice D contradicts the "
        "finding, since a relationship was in fact observed. The general rule: random assignment "
        "licenses causal conclusions, random selection licenses generalization."
    ),
    check=lambda: True,  # conceptual item; no computation to recheck
)
