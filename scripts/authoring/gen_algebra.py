"""Algebra — HARD. Original items written to the digital SAT blueprint."""

from fractions import Fraction as F
from qbuild import Item, SECTION_MATH

D = "Algebra"
S_ONE = "Linear equations in one variable"
S_TWO = "Linear equations in two variables"
S_FUN = "Linear functions"
S_SYS = "Systems of two linear equations in two variables"
S_INE = "Linear inequalities in one or two variables"

ITEMS = []


def add(**kw):
    ITEMS.append(Item(section=SECTION_MATH, domain=D, difficulty="HARD", **kw))


# --- Linear equations in one variable ---------------------------------------

add(
    external_id="sp-m-0001",
    skill=S_ONE,
    fmt="SPR",
    stem=(
        "a(x + 3) - 2(x - 1) = 5x + b\n\n"
        "In the given equation, a and b are constants. If the equation has infinitely "
        "many solutions, what is the value of a + b?"
    ),
    answer="30",
    explanation=(
        "Expanding the left side gives ax + 3a - 2x + 2, which collects to (a - 2)x + (3a + 2). "
        "An equation in one variable has infinitely many solutions only when the two sides are "
        "the same expression, so the x-coefficients must match and the constants must match. "
        "Matching x-coefficients: a - 2 = 5, so a = 7. Matching constants: 3a + 2 = b, so "
        "b = 3(7) + 2 = 23. Therefore a + b = 7 + 23 = 30.\n\n"
        "A common error is to match only the coefficients and stop, which gives 7, or to "
        "solve as though the equation had a single solution, which the 'infinitely many' "
        "condition rules out."
    ),
    check=lambda: (lambda a=7, b=23: (a - 2 == 5) and (3 * a + 2 == b) and a + b == 30)(),
)

add(
    external_id="sp-m-0002",
    skill=S_ONE,
    fmt="MCQ",
    stem=(
        "(2x - 7)/5 - (x + 1)/3 = k\n\n"
        "In the given equation, k is a constant. If x = 4 is a solution, what is the value of k?"
    ),
    choices={"A": "-22/15", "B": "-16/15", "C": "2/15", "D": "22/15"},
    answer="A",
    explanation=(
        "Substitute x = 4 into the left side. The first term is (2(4) - 7)/5 = 1/5. "
        "The second term is (4 + 1)/3 = 5/3. So k = 1/5 - 5/3. Rewriting over the common "
        "denominator 15 gives 3/15 - 25/15 = -22/15.\n\n"
        "Choice D is the same magnitude with the subtraction reversed. Choice B comes from "
        "using 15 as the denominator of the first fraction but forgetting to rescale its "
        "numerator, and choice C from subtracting the numerators and the denominators separately."
    ),
    check=lambda: F(2 * 4 - 7, 5) - F(4 + 1, 3) == F(-22, 15),
)

add(
    external_id="sp-m-0003",
    skill=S_ONE,
    fmt="MCQ",
    stem=(
        "px - 12 = 3(x + q)\n\n"
        "In the given equation, p and q are constants. If the equation has no solution, "
        "which of the following must be true?"
    ),
    choices={
        "A": "p = 3 and q = -4",
        "B": "p = 3 and q ≠ -4",
        "C": "p ≠ 3 and q = -4",
        "D": "p ≠ 3 and q ≠ -4",
    },
    answer="B",
    explanation=(
        "Distributing on the right gives px - 12 = 3x + 3q, and collecting the variable terms "
        "gives (p - 3)x = 3q + 12. A linear equation in this form has no solution exactly when "
        "the coefficient of x is zero while the constant is not — there is no number that makes "
        "0 equal to something nonzero.\n\n"
        "So p - 3 = 0, giving p = 3, and 3q + 12 ≠ 0, giving q ≠ -4.\n\n"
        "Choice A is the condition for infinitely many solutions, not none: with p = 3 and "
        "q = -4 the equation becomes 0 = 0. Choices C and D leave p - 3 nonzero, and then the "
        "equation always has exactly one solution, x = (3q + 12)/(p - 3)."
    ),
    check=lambda: all(
        # p = 3, q != -4 -> no solution; every other combination has a solution.
        (p - 3 == 0 and 3 * q + 12 != 0) == (p == 3 and q != -4)
        for p in (0, 1, 3, 5)
        for q in (-4, -1, 0, 2)
    ),
)

add(
    external_id="sp-m-0004",
    skill=S_ONE,
    fmt="SPR",
    stem="(x - 1)/2 + (2x + 3)/5 = 3x/4 + 1\n\nWhat is the solution to the given equation?",
    answer="6",
    explanation=(
        "Multiply every term by 20, the least common denominator of 2, 5, and 4. That clears "
        "all three fractions at once: 10(x - 1) + 4(2x + 3) = 15x + 20.\n\n"
        "Expanding gives 10x - 10 + 8x + 12 = 15x + 20, which collects to 18x + 2 = 15x + 20. "
        "Subtracting 15x and 2 from both sides gives 3x = 18, so x = 6.\n\n"
        "Checking: the left side is 5/2 + 3 = 11/2, and the right side is 18/4 + 1 = 11/2."
    ),
    check=lambda: F(6 - 1, 2) + F(2 * 6 + 3, 5) == F(3 * 6, 4) + 1,
)

# --- Linear equations in two variables --------------------------------------

add(
    external_id="sp-m-0005",
    skill=S_TWO,
    fmt="MCQ",
    stem=(
        "In the xy-plane, line ℓ passes through the point (-3, 7) and is perpendicular to the "
        "line whose equation is 4x - 6y = 15. Which equation defines line ℓ?"
    ),
    choices={"A": "2x - 3y = -27", "B": "3x + 2y = 5", "C": "3x + 2y = -5", "D": "2x + 3y = 15"},
    answer="B",
    explanation=(
        "First find the slope of the given line. Solving 4x - 6y = 15 for y gives "
        "y = (2/3)x - 5/2, so its slope is 2/3. A perpendicular line has the negative "
        "reciprocal slope, -3/2.\n\n"
        "Using point-slope form through (-3, 7): y - 7 = -(3/2)(x + 3), so "
        "y = -(3/2)x - 9/2 + 7 = -(3/2)x + 5/2. Multiplying by 2 and collecting gives "
        "3x + 2y = 5.\n\n"
        "Verify the point: 3(-3) + 2(7) = -9 + 14 = 5. Choice A is perpendicular-looking but "
        "actually uses the original slope; choice C has the correct slope but misses the point; "
        "choice D uses the negative reciprocal of the wrong fraction."
    ),
    check=lambda: (
        F(2, 3) * F(-3, 2) == -1  # slopes are negative reciprocals
        and 3 * (-3) + 2 * 7 == 5  # the point lies on 3x + 2y = 5
        and F(-3, 2) == -F(3, 2)  # slope of 3x + 2y = 5 is -3/2
    ),
)

add(
    external_id="sp-m-0006",
    skill=S_TWO,
    fmt="SPR",
    stem=(
        "3x + ky = 18\n\n"
        "In the given equation, k is a constant. The graph of the equation in the xy-plane has "
        "a y-intercept at (0, -4). What is the value of k?"
    ),
    answer="-9/2",
    explanation=(
        "A y-intercept at (0, -4) means x = 0 and y = -4 satisfy the equation. Substituting "
        "gives 3(0) + k(-4) = 18, so -4k = 18 and k = -18/4 = -9/2.\n\n"
        "The answer may be entered as -9/2 or -4.5. A common error is to substitute -4 for x "
        "instead of y, which gives the x-intercept relation and the wrong value."
    ),
    check=lambda: 3 * 0 + F(-9, 2) * (-4) == 18,
)

add(
    external_id="sp-m-0007",
    skill=S_TWO,
    fmt="MCQ",
    stem=(
        "In the xy-plane, a line passes through the points (a, 2a) and (3a, 8a), where a is a "
        "positive constant. What is the slope of this line?"
    ),
    choices={"A": "1/3", "B": "2", "C": "3", "D": "4"},
    answer="C",
    explanation=(
        "Slope is the change in y divided by the change in x. The change in y is "
        "8a - 2a = 6a, and the change in x is 3a - a = 2a. So the slope is 6a/2a.\n\n"
        "Because a is positive it is nonzero, so the a's divide out and the slope is 3 — the "
        "same for every positive a.\n\n"
        "Choice A inverts the ratio. Choice D comes from computing 8a/2a, using only the second "
        "y-coordinate. Choice B comes from 6a/3a, using the wrong x-difference."
    ),
    check=lambda: all(F(8 * a - 2 * a, 3 * a - a) == 3 for a in (1, 2, 5, 11)),
)

add(
    external_id="sp-m-0008",
    skill=S_TWO,
    fmt="SPR",
    stem=(
        "In the xy-plane, line ℓ is defined by y = mx + b, where m and b are constants. Line ℓ "
        "passes through the points (2, -1) and (-4, 11). What is the value of m + b?"
    ),
    answer="1",
    explanation=(
        "The slope is m = (11 - (-1))/(-4 - 2) = 12/(-6) = -2.\n\n"
        "To find b, substitute one of the points into y = -2x + b. Using (2, -1): "
        "-1 = -2(2) + b, so -1 = -4 + b and b = 3.\n\n"
        "Therefore m + b = -2 + 3 = 1. Checking the other point: -2(-4) + 3 = 8 + 3 = 11, "
        "as required."
    ),
    check=lambda: (
        (lambda m=F(11 - (-1), -4 - 2): (m == -2) and (-1 - m * 2 == 3) and (m + 3 == 1))()
    ),
)

add(
    external_id="sp-m-0009",
    skill=S_TWO,
    fmt="MCQ",
    stem=(
        "Which of the following equations defines a line in the xy-plane that is parallel to the "
        "line 5x + 2y = 9 and passes through the point (4, -3)?"
    ),
    choices={"A": "5x + 2y = 14", "B": "5x + 2y = 26", "C": "2x - 5y = 23", "D": "5x - 2y = 26"},
    answer="A",
    explanation=(
        "Parallel lines have equal slopes. Any equation of the form 5x + 2y = c has the same "
        "slope as 5x + 2y = 9, namely -5/2, so the answer must have that left side — which "
        "eliminates choices C and D immediately.\n\n"
        "To find c, substitute the point (4, -3): 5(4) + 2(-3) = 20 - 6 = 14. So the line is "
        "5x + 2y = 14.\n\n"
        "Choice B uses 5(4) + 2(3) = 26, dropping the negative sign on the y-coordinate. "
        "Choice C is perpendicular rather than parallel."
    ),
    check=lambda: 5 * 4 + 2 * (-3) == 14,
)

# --- Linear functions --------------------------------------------------------

add(
    external_id="sp-m-0010",
    skill=S_FUN,
    fmt="MCQ",
    stem=(
        "The function f is linear. If f(2) = 11 and f(6) = 3, what is the value of f(0)?"
    ),
    choices={"A": "7", "B": "13", "C": "15", "D": "19"},
    answer="C",
    explanation=(
        "For a linear function the rate of change is constant. From x = 2 to x = 6 the input "
        "increases by 4 and the output changes by 3 - 11 = -8, so the slope is -8/4 = -2.\n\n"
        "Write f(x) = -2x + c. Substituting f(2) = 11 gives 11 = -4 + c, so c = 15. Since "
        "f(0) = c, the answer is 15.\n\n"
        "Alternatively, going from x = 2 down to x = 0 decreases the input by 2, which increases "
        "the output by 4: 11 + 4 = 15. Choice A comes from using slope +2, and choice D from "
        "extending the wrong number of steps."
    ),
    check=lambda: (
        (lambda m=F(3 - 11, 6 - 2): (m == -2) and (11 - m * 2 == 15))()
    ),
)

add(
    external_id="sp-m-0011",
    skill=S_FUN,
    fmt="SPR",
    stem=(
        "The function f is defined by f(x) = ax + b, where a and b are constants. If f(3) = 17 "
        "and f(-1) = 1, what is the value of f(10)?"
    ),
    answer="45",
    explanation=(
        "The slope is a = (17 - 1)/(3 - (-1)) = 16/4 = 4.\n\n"
        "Substituting f(3) = 17 into f(x) = 4x + b gives 17 = 12 + b, so b = 5 and "
        "f(x) = 4x + 5.\n\n"
        "Therefore f(10) = 4(10) + 5 = 45. Checking the second condition: "
        "f(-1) = -4 + 5 = 1, as required."
    ),
    check=lambda: (
        (lambda a=F(17 - 1, 3 - (-1)): (a == 4) and (17 - a * 3 == 5) and (a * 10 + 5 == 45))()
    ),
)

add(
    external_id="sp-m-0012",
    skill=S_FUN,
    fmt="MCQ",
    stem=(
        "A company's monthly revenue R(t), in thousands of dollars, is modeled by "
        "R(t) = 8.5t + 40, where t is the number of months since the company launched. Which of "
        "the following is the best interpretation of the ordered pair (12, 142) on the graph of "
        "y = R(t) in the ty-plane?"
    ),
    choices={
        "A": "Twelve months after launch, the company's monthly revenue is $142,000.",
        "B": "Twelve months after launch, the company's total revenue since launch is $142,000.",
        "C": "The company's monthly revenue increases by $142,000 every 12 months.",
        "D": "When the company's monthly revenue reaches $12,000, it has been 142 months since launch.",
    },
    answer="A",
    explanation=(
        "Check that the point is on the graph: R(12) = 8.5(12) + 40 = 102 + 40 = 142.\n\n"
        "The input t is months since launch and the output R(t) is revenue for that month, "
        "measured in thousands of dollars. So the pair (12, 142) says that at t = 12 months the "
        "monthly revenue is 142 thousand dollars, or $142,000.\n\n"
        "Choice B changes monthly revenue into cumulative revenue, which the model does not "
        "describe. Choice C describes a rate of change, but the rate is 8.5 thousand dollars "
        "per month, not 142. Choice D swaps the input and the output."
    ),
    check=lambda: 8.5 * 12 + 40 == 142,
)

add(
    external_id="sp-m-0013",
    skill=S_FUN,
    fmt="MCQ",
    stem=(
        "The function f is defined by f(x) = 3x - 7. The function g is defined by "
        "g(x) = f(x + 4). Which of the following defines g(x)?"
    ),
    choices={"A": "3x - 3", "B": "3x + 5", "C": "3x - 11", "D": "3x + 12"},
    answer="B",
    explanation=(
        "g(x) = f(x + 4) means every occurrence of the input in f is replaced by x + 4, not "
        "that 4 is added to the output.\n\n"
        "So g(x) = 3(x + 4) - 7 = 3x + 12 - 7 = 3x + 5.\n\n"
        "Choice A comes from adding 4 to the output instead of the input. Choice C comes from "
        "substituting x - 4. Choice D drops the -7 after distributing."
    ),
    check=lambda: all(3 * (x + 4) - 7 == 3 * x + 5 for x in range(-5, 6)),
)

add(
    external_id="sp-m-0014",
    skill=S_FUN,
    fmt="SPR",
    stem=(
        "The linear function h satisfies h(x + 1) - h(x) = -6 for every value of x. If "
        "h(4) = 9, what is the value of h(9)?"
    ),
    answer="-21",
    explanation=(
        "For a linear function, h(x + 1) - h(x) is the change in output for a one-unit increase "
        "in input — that is, the slope. So h has slope -6.\n\n"
        "Going from x = 4 to x = 9 increases the input by 5, so the output changes by "
        "5(-6) = -30.\n\n"
        "Therefore h(9) = 9 + (-30) = -21."
    ),
    check=lambda: (lambda h=lambda x: -6 * x + 33: h(4) == 9 and h(9) == -21 and h(5) - h(4) == -6)(),
)

# --- Systems of two linear equations -----------------------------------------

add(
    external_id="sp-m-0015",
    skill=S_SYS,
    fmt="SPR",
    stem=(
        "3x + 2y = 19\n5x - 4y = 17\n\n"
        "The solution to the given system of equations is (x, y). What is the value of x + y?"
    ),
    answer="7",
    explanation=(
        "Multiply the first equation by 2 to line up the y-terms: 6x + 4y = 38. Adding this to "
        "the second equation eliminates y: 11x = 55, so x = 5.\n\n"
        "Substituting back into 3x + 2y = 19 gives 15 + 2y = 19, so y = 2.\n\n"
        "Therefore x + y = 5 + 2 = 7. Checking the second equation: 5(5) - 4(2) = 25 - 8 = 17."
    ),
    check=lambda: (3 * 5 + 2 * 2 == 19) and (5 * 5 - 4 * 2 == 17) and (5 + 2 == 7),
)

add(
    external_id="sp-m-0016",
    skill=S_SYS,
    fmt="MCQ",
    stem=(
        "kx - 6y = 10\n4x + 3y = -2\n\n"
        "In the given system of equations, k is a constant. If the system has no solution, what "
        "is the value of k?"
    ),
    choices={"A": "-8", "B": "-2", "C": "2", "D": "8"},
    answer="A",
    explanation=(
        "A system of two linear equations has no solution when the lines are parallel but "
        "distinct — same slope, different intercept.\n\n"
        "The second equation has slope -4/3. The first, solved for y, is y = (k/6)x - 5/3, so "
        "its slope is k/6. Setting k/6 = -4/3 gives k = -8.\n\n"
        "The lines must also be distinct. With k = -8 the first equation is -8x - 6y = 10, or "
        "equivalently 4x + 3y = -5, which is not the same line as 4x + 3y = -2. So the system "
        "is parallel and distinct, and has no solution.\n\n"
        "Choice D gives slope 4/3, which crosses the second line. Choices B and C give slopes "
        "that also intersect it."
    ),
    check=lambda: (
        F(-8, 6) == F(-4, 3)  # parallel
        and F(10, -6) != F(-2, 3)  # but not the same line
    ),
)

add(
    external_id="sp-m-0017",
    skill=S_SYS,
    fmt="MCQ",
    stem=(
        "2x + 5y = 12\nax + 15y = c\n\n"
        "In the given system of equations, a and c are constants. If the system has infinitely "
        "many solutions, what is the value of a + c?"
    ),
    choices={"A": "18", "B": "36", "C": "42", "D": "48"},
    answer="C",
    explanation=(
        "A system has infinitely many solutions when the two equations describe the same line — "
        "that is, when one is a constant multiple of the other.\n\n"
        "The y-coefficient goes from 5 to 15, so the multiplier is 3. Applying it to the whole "
        "first equation gives 6x + 15y = 36. Matching term by term, a = 6 and c = 36.\n\n"
        "Therefore a + c = 6 + 36 = 42.\n\n"
        "Choice B is c alone. Choice A comes from using a multiplier of 3 on the constant but "
        "not recomputing a, and choice D from multiplying the constant by 4."
    ),
    check=lambda: (2 * 3 == 6) and (5 * 3 == 15) and (12 * 3 == 36) and (6 + 36 == 42),
)

add(
    external_id="sp-m-0018",
    skill=S_SYS,
    fmt="SPR",
    stem=(
        "A vendor sells small boxes for $12 each and large boxes for $19 each. On one day the "
        "vendor sold a total of 40 boxes and collected $578. How many large boxes were sold "
        "that day?"
    ),
    answer="14",
    explanation=(
        "Let s be the number of small boxes and l the number of large boxes. The two conditions "
        "give s + l = 40 and 12s + 19l = 578.\n\n"
        "Solving the first for s gives s = 40 - l. Substituting into the second: "
        "12(40 - l) + 19l = 578, so 480 - 12l + 19l = 578, which simplifies to 480 + 7l = 578.\n\n"
        "Then 7l = 98, so l = 14.\n\n"
        "Checking: 26 small boxes and 14 large boxes is 40 boxes, and "
        "12(26) + 19(14) = 312 + 266 = 578."
    ),
    check=lambda: (26 + 14 == 40) and (12 * 26 + 19 * 14 == 578),
)

add(
    external_id="sp-m-0019",
    skill=S_SYS,
    fmt="SPR",
    stem=(
        "y = 2x - 5\ny = -x + 7\n\n"
        "The solution to the given system of equations is (x, y). What is the value of xy?"
    ),
    answer="12",
    explanation=(
        "Because both equations are solved for y, set the right sides equal: 2x - 5 = -x + 7.\n\n"
        "Adding x to both sides and adding 5 gives 3x = 12, so x = 4.\n\n"
        "Substituting into either equation gives y: 2(4) - 5 = 3, and -(4) + 7 = 3 confirms it.\n\n"
        "Therefore xy = 4(3) = 12. Note the question asks for the product, not for x or y alone."
    ),
    check=lambda: (2 * 4 - 5 == 3) and (-4 + 7 == 3) and (4 * 3 == 12),
)

# --- Linear inequalities -----------------------------------------------------

add(
    external_id="sp-m-0020",
    skill=S_INE,
    fmt="MCQ",
    stem="-4 < 3 - 2x ≤ 9\n\nWhich of the following describes all solutions to the given inequality?",
    choices={
        "A": "-3 ≤ x < 7/2",
        "B": "-3 < x ≤ 7/2",
        "C": "-7/2 ≤ x < 3",
        "D": "x < -3 or x ≥ 7/2",
    },
    answer="A",
    explanation=(
        "Work on both parts at once. Subtracting 3 from all three parts gives "
        "-7 < -2x ≤ 6.\n\n"
        "Now divide all three parts by -2. Dividing by a negative number reverses both "
        "inequality signs: 7/2 > x ≥ -3.\n\n"
        "Rewritten in increasing order, that is -3 ≤ x < 7/2.\n\n"
        "Choice B keeps the endpoints attached to the wrong sides — the strict inequality "
        "belongs to 7/2, which came from the strict -4. Choice C forgets to reverse the signs. "
        "Choice D treats the compound inequality as an 'or' statement rather than an 'and'."
    ),
    check=lambda: all(
        ((-4 < 3 - 2 * F(n, 4) <= 9) == (F(-3) <= F(n, 4) < F(7, 2)))
        for n in range(-40, 41)
    ),
)

add(
    external_id="sp-m-0021",
    skill=S_INE,
    fmt="SPR",
    stem="What is the greatest integer value of x that satisfies 5(x - 3) < 2x + 4?",
    answer="6",
    explanation=(
        "Expanding the left side gives 5x - 15 < 2x + 4.\n\n"
        "Subtracting 2x and adding 15 to both sides gives 3x < 19, so x < 19/3.\n\n"
        "Since 19/3 is about 6.33, the inequality is strict, and 6 is the largest integer below "
        "it, the answer is 6.\n\n"
        "Checking: at x = 6, the left side is 15 and the right side is 16, so the inequality "
        "holds. At x = 7, the left side is 20 and the right side is 18, so it fails."
    ),
    check=lambda: (5 * (6 - 3) < 2 * 6 + 4) and not (5 * (7 - 3) < 2 * 7 + 4),
)

add(
    external_id="sp-m-0022",
    skill=S_INE,
    fmt="MCQ",
    stem=(
        "y ≤ -2x + 6\ny > x - 3\n\n"
        "Which of the following ordered pairs (x, y) is a solution to the given system of "
        "inequalities?"
    ),
    choices={"A": "(4, 1)", "B": "(2, -2)", "C": "(0, 0)", "D": "(-1, 9)"},
    answer="C",
    explanation=(
        "A solution must satisfy both inequalities, so test each pair in both.\n\n"
        "Choice C, (0, 0): the first requires 0 ≤ -2(0) + 6 = 6, which is true; the second "
        "requires 0 > 0 - 3 = -3, which is true. Both hold, so (0, 0) is a solution.\n\n"
        "Choice A, (4, 1): the first requires 1 ≤ -2, which is false. Choice B, (2, -2): the "
        "first holds, but the second requires -2 > -1, which is false. Choice D, (-1, 9): the "
        "second holds, but the first requires 9 ≤ 8, which is false.\n\n"
        "Note that choices B and D each satisfy exactly one inequality — checking only one is "
        "the trap."
    ),
    check=lambda: (
        [(x, y) for x, y in [(4, 1), (2, -2), (0, 0), (-1, 9)] if y <= -2 * x + 6 and y > x - 3]
        == [(0, 0)]
    ),
)

add(
    external_id="sp-m-0023",
    skill=S_INE,
    fmt="SPR",
    stem=(
        "A technician is paid a flat fee of $150 for a job plus $22 for each hour worked on it. "
        "The technician wants the total payment for a job to be at least $700. What is the least "
        "number of whole hours the technician must work on the job?"
    ),
    answer="25",
    explanation=(
        "If h is the number of hours worked, the total payment is 22h + 150 dollars, and the "
        "requirement 'at least $700' gives 22h + 150 ≥ 700.\n\n"
        "Subtracting 150 gives 22h ≥ 550, so h ≥ 25.\n\n"
        "Since 25 satisfies the inequality exactly, the least whole number of hours is 25.\n\n"
        "Checking: 22(25) + 150 = 550 + 150 = 700, which meets the 'at least' condition, while "
        "24 hours gives 678, which does not."
    ),
    check=lambda: (22 * 25 + 150 >= 700) and not (22 * 24 + 150 >= 700),
)

add(
    external_id="sp-m-0024",
    skill=S_INE,
    fmt="MCQ",
    stem=(
        "A student is assembling a study set from short problems and long problems. Each short "
        "problem takes 3 minutes and each long problem takes 8 minutes. The student wants to "
        "include at least 20 problems in total and spend no more than 120 minutes. If s is the "
        "number of short problems and l is the number of long problems, which system of "
        "inequalities represents this situation?"
    ),
    choices={
        "A": "s + l ≥ 20 and 3s + 8l ≤ 120",
        "B": "s + l ≤ 20 and 3s + 8l ≥ 120",
        "C": "s + l ≥ 20 and 3s + 8l ≥ 120",
        "D": "3s + 8l ≥ 20 and s + l ≤ 120",
    },
    answer="A",
    explanation=(
        "Translate each condition separately.\n\n"
        "'At least 20 problems in total' counts problems, not minutes, so it is about s + l. "
        "'At least' means greater than or equal to: s + l ≥ 20.\n\n"
        "'Spend no more than 120 minutes' counts minutes. The short problems take 3s minutes "
        "and the long ones take 8l minutes, for a total of 3s + 8l. 'No more than' means less "
        "than or equal to: 3s + 8l ≤ 120.\n\n"
        "Choice B reverses both inequality signs. Choice C reverses only the time constraint, "
        "which would allow unlimited time. Choice D attaches the counts to the wrong quantities."
    ),
    check=lambda: (
        # A sample plan that meets the description satisfies exactly the keyed system.
        (lambda s=24, l=4: (s + l >= 20) and (3 * s + 8 * l <= 120))()
    ),
)
