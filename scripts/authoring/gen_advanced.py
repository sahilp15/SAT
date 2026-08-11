"""Advanced Math — HARD. Original items written to the digital SAT blueprint."""

from fractions import Fraction as F
import sympy as sp
from qbuild import Item, SECTION_MATH

x, y = sp.symbols("x y")
# The exponent items state x, y, a, b > 0 in the stem; the checks need the same
# assumption or sympy refuses to combine fractional powers.
xp, yp, a, b = sp.symbols("x y a b", positive=True)

D = "Advanced Math"
S_EQ = "Equivalent expressions"
S_NL = "Nonlinear equations in one variable and systems of equations in two variables"
S_FN = "Nonlinear functions"

ITEMS = []


def add(**kw):
    ITEMS.append(Item(section=SECTION_MATH, domain=D, difficulty="HARD", **kw))


def equiv(e1, e2) -> bool:
    """True when two expressions are identical as rational functions."""
    return sp.simplify(sp.together(sp.sympify(e1) - sp.sympify(e2))) == 0


# --- Equivalent expressions ---------------------------------------------------

add(
    external_id="sp-m-0025",
    skill=S_EQ,
    fmt="MCQ",
    stem=(
        "(4x² - 9)/(2x² + x - 3)\n\n"
        "Which expression is equivalent to the given expression, where the denominator is "
        "not equal to 0?"
    ),
    choices={"A": "(2x - 3)/(x - 1)", "B": "(2x + 3)/(x - 1)", "C": "(2x - 3)/(x + 1)", "D": "-3/(x - 3)"},
    answer="A",
    explanation=(
        "Factor both parts. The numerator is a difference of two squares: "
        "4x² - 9 = (2x - 3)(2x + 3). The denominator factors as 2x² + x - 3 = (2x + 3)(x - 1).\n\n"
        "The factor 2x + 3 appears in both, so it divides out, leaving (2x - 3)/(x - 1).\n\n"
        "Choice B cancels the wrong factor. Choice C mis-signs the factorization of the "
        "denominator. Choice D comes from cancelling individual terms rather than whole factors, "
        "which is not a valid operation on a sum."
    ),
    check=lambda: equiv((4 * x**2 - 9) / (2 * x**2 + x - 3), (2 * x - 3) / (x - 1)),
)

add(
    external_id="sp-m-0026",
    skill=S_EQ,
    fmt="MCQ",
    stem="Which expression is equivalent to (8x⁶y⁻³)^(2/3), where x > 0 and y > 0?",
    choices={"A": "4x⁴/y²", "B": "16x⁴/y²", "C": "4x⁹/y²", "D": "4x⁴y²"},
    answer="A",
    explanation=(
        "Apply the exponent 2/3 to each factor separately.\n\n"
        "For the coefficient: 8^(2/3) = (8^(1/3))² = 2² = 4.\n"
        "For x: (x⁶)^(2/3) = x^(6·2/3) = x⁴.\n"
        "For y: (y⁻³)^(2/3) = y^(-3·2/3) = y⁻², which is 1/y².\n\n"
        "Together this gives 4x⁴/y².\n\n"
        "Choice B multiplies 8 by 2 instead of raising it to the 2/3 power. Choice C adds the "
        "exponents on x rather than multiplying. Choice D drops the negative sign on y's "
        "exponent, moving it to the wrong side of the fraction."
    ),
    check=lambda: equiv((8 * xp**6 * yp**-3) ** sp.Rational(2, 3), 4 * xp**4 / yp**2),
)

add(
    external_id="sp-m-0027",
    skill=S_EQ,
    fmt="SPR",
    stem=(
        "(x + a)(x + b) = x² - 11x + 30\n\n"
        "The given equation is true for all x, where a and b are constants. What is the value "
        "of a² + b²?"
    ),
    answer="61",
    explanation=(
        "Expanding the left side gives x² + (a + b)x + ab. For this to equal x² - 11x + 30 for "
        "every x, the corresponding coefficients must match: a + b = -11 and ab = 30.\n\n"
        "Two numbers with product 30 and sum -11 are -5 and -6.\n\n"
        "Therefore a² + b² = 25 + 36 = 61.\n\n"
        "Alternatively, use the identity a² + b² = (a + b)² - 2ab = 121 - 60 = 61, which avoids "
        "finding a and b individually."
    ),
    check=lambda: (
        sp.expand((x - 5) * (x - 6)) == sp.expand(x**2 - 11 * x + 30)
        and (-5) ** 2 + (-6) ** 2 == 61
        and (-11) ** 2 - 2 * 30 == 61
    ),
)

add(
    external_id="sp-m-0028",
    skill=S_EQ,
    fmt="MCQ",
    stem=(
        "1/(x - 2) - 3/(x + 1)\n\n"
        "Which expression is equivalent to the given expression, where x ≠ 2 and x ≠ -1?"
    ),
    choices={
        "A": "(-2x + 7)/(x² - x - 2)",
        "B": "(-2x - 5)/(x² - x - 2)",
        "C": "-2/(x² - x - 2)",
        "D": "(4x - 5)/(x² - x - 2)",
    },
    answer="A",
    explanation=(
        "The common denominator is (x - 2)(x + 1) = x² - x - 2.\n\n"
        "Rewrite each fraction over it: the first becomes (x + 1)/[(x - 2)(x + 1)] and the "
        "second becomes 3(x - 2)/[(x - 2)(x + 1)].\n\n"
        "Subtracting the numerators gives (x + 1) - 3(x - 2) = x + 1 - 3x + 6 = -2x + 7.\n\n"
        "So the expression equals (-2x + 7)/(x² - x - 2).\n\n"
        "Choice B distributes the 3 but forgets that subtracting flips the sign of -6. Choice C "
        "subtracts only the leading terms. Choice D subtracts numerators and denominators "
        "separately, which is not valid."
    ),
    check=lambda: equiv(1 / (x - 2) - 3 / (x + 1), (-2 * x + 7) / (x**2 - x - 2)),
)

add(
    external_id="sp-m-0029",
    skill=S_EQ,
    fmt="MCQ",
    stem="Which expression is equivalent to √(50x⁵), where x > 0?",
    choices={"A": "5x²√(2x)", "B": "25x²√(2x)", "C": "5x²√x", "D": "10x²√(5x)"},
    answer="A",
    explanation=(
        "Split each part into the largest perfect square it contains.\n\n"
        "For the coefficient: 50 = 25 · 2, and √25 = 5.\n"
        "For the variable: x⁵ = x⁴ · x, and √(x⁴) = x² because x > 0.\n\n"
        "So √(50x⁵) = √25 · √(x⁴) · √(2x) = 5x²√(2x).\n\n"
        "Choice B fails to take the square root of 25. Choice C leaves the factor of 2 out of "
        "the radical entirely. Choice D pulls out the wrong square factor of 50."
    ),
    check=lambda: sp.simplify(sp.sqrt(50 * x**5) - 5 * x**2 * sp.sqrt(2 * x)).subs(x, 3) == 0,
)

add(
    external_id="sp-m-0030",
    skill=S_EQ,
    fmt="MCQ",
    stem="Which expression is equivalent to (3x² - 5x - 2)/(x - 2), where x ≠ 2?",
    choices={"A": "3x + 1", "B": "3x - 1", "C": "3x + 2", "D": "3x² - 4"},
    answer="A",
    explanation=(
        "Factor the numerator. Looking for two binomials whose product is 3x² - 5x - 2, and "
        "noting that x - 2 should be one of them, gives 3x² - 5x - 2 = (3x + 1)(x - 2).\n\n"
        "Check by expanding: (3x + 1)(x - 2) = 3x² - 6x + x - 2 = 3x² - 5x - 2.\n\n"
        "Since x ≠ 2, the factor x - 2 divides out and the expression equals 3x + 1.\n\n"
        "Choice B has the wrong sign on the constant. Choice C would give a product with "
        "constant term -4. Choice D comes from cancelling terms rather than factors."
    ),
    check=lambda: equiv((3 * x**2 - 5 * x - 2) / (x - 2), 3 * x + 1),
)

add(
    external_id="sp-m-0031",
    skill=S_EQ,
    fmt="MCQ",
    stem="Which expression is equivalent to (2a⁻²b³)³ / (4a⁻³b), where a > 0 and b > 0?",
    choices={"A": "2b⁸/a³", "B": "2a³b⁸", "C": "b⁸/(2a³)", "D": "2b⁸/a⁹"},
    answer="A",
    explanation=(
        "Handle the numerator first. Cubing every factor gives "
        "(2a⁻²b³)³ = 2³ · a⁻⁶ · b⁹ = 8a⁻⁶b⁹.\n\n"
        "Now divide by 4a⁻³b. Divide the coefficients: 8/4 = 2. Subtract exponents on a: "
        "-6 - (-3) = -3. Subtract exponents on b: 9 - 1 = 8.\n\n"
        "That gives 2a⁻³b⁸, which written with a positive exponent is 2b⁸/a³.\n\n"
        "Choice B moves a to the numerator without changing its sign. Choice C divides the "
        "coefficients backwards. Choice D subtracts the a-exponents in the wrong direction, "
        "giving -9 instead of -3."
    ),
    check=lambda: equiv((2 * a**-2 * b**3) ** 3 / (4 * a**-3 * b), 2 * b**8 / a**3),
)

add(
    external_id="sp-m-0032",
    skill=S_EQ,
    fmt="SPR",
    stem=(
        "The expression x² + kx + 36 is the square of a binomial, where k is a positive "
        "constant. What is the value of k?"
    ),
    answer="12",
    explanation=(
        "If x² + kx + 36 is the square of a binomial, it has the form (x + c)² for some "
        "constant c, since the leading coefficient is 1.\n\n"
        "Expanding gives (x + c)² = x² + 2cx + c². Matching the constant term: c² = 36, so "
        "c = 6 or c = -6. Matching the middle term: k = 2c.\n\n"
        "Because k is positive, c = 6 and k = 12.\n\n"
        "Checking: (x + 6)² = x² + 12x + 36."
    ),
    check=lambda: sp.expand((x + 6) ** 2) == sp.expand(x**2 + 12 * x + 36),
)

# --- Nonlinear equations and systems -----------------------------------------

add(
    external_id="sp-m-0033",
    skill=S_NL,
    fmt="SPR",
    stem=(
        "x² + bx + 16 = 0\n\n"
        "In the given equation, b is a positive constant. If the equation has exactly one real "
        "solution, what is the value of b?"
    ),
    answer="8",
    explanation=(
        "A quadratic equation has exactly one real solution when its discriminant is zero.\n\n"
        "Here the discriminant is b² - 4(1)(16) = b² - 64. Setting it equal to zero gives "
        "b² = 64, so b = 8 or b = -8.\n\n"
        "Since b is positive, b = 8.\n\n"
        "Checking: x² + 8x + 16 = (x + 4)², which has the single solution x = -4."
    ),
    check=lambda: (
        len(sp.solve(sp.Eq(x**2 + 8 * x + 16, 0), x)) == 1 and 8**2 - 4 * 16 == 0
    ),
)

add(
    external_id="sp-m-0034",
    skill=S_NL,
    fmt="SPR",
    stem="2x² - 7x - 15 = 0\n\nWhat is the sum of the solutions to the given equation?",
    answer="7/2",
    explanation=(
        "For a quadratic ax² + bx + c = 0, the sum of the solutions is -b/a. Here a = 2 and "
        "b = -7, so the sum is 7/2.\n\n"
        "This can be confirmed by factoring: 2x² - 7x - 15 = (2x + 3)(x - 5), so the solutions "
        "are x = -3/2 and x = 5. Their sum is -3/2 + 5 = 7/2.\n\n"
        "The answer may be entered as 7/2 or 3.5."
    ),
    check=lambda: sum(sp.solve(sp.Eq(2 * x**2 - 7 * x - 15, 0), x)) == sp.Rational(7, 2),
)

add(
    external_id="sp-m-0035",
    skill=S_NL,
    fmt="MCQ",
    stem=(
        "y = x² - 4x + 7\ny = 2x + 2\n\n"
        "How many solutions does the given system of equations have?"
    ),
    choices={"A": "Zero", "B": "Exactly one", "C": "Exactly two", "D": "Infinitely many"},
    answer="C",
    explanation=(
        "Since both equations are solved for y, set the right sides equal: "
        "x² - 4x + 7 = 2x + 2.\n\n"
        "Collecting everything on one side gives x² - 6x + 5 = 0.\n\n"
        "The discriminant is (-6)² - 4(1)(5) = 36 - 20 = 16, which is positive, so there are "
        "two distinct real values of x. Each produces one value of y, so the system has exactly "
        "two solutions.\n\n"
        "Indeed x² - 6x + 5 = (x - 1)(x - 5), giving the solutions (1, 4) and (5, 12). A "
        "parabola and a line cannot have infinitely many intersection points, which rules out "
        "choice D."
    ),
    check=lambda: len(sp.solve([sp.Eq(y, x**2 - 4 * x + 7), sp.Eq(y, 2 * x + 2)], [x, y])) == 2,
)

add(
    external_id="sp-m-0036",
    skill=S_NL,
    fmt="SPR",
    stem="√(2x + 11) = x + 4\n\nWhat is the solution to the given equation?",
    answer="-1",
    explanation=(
        "Square both sides: 2x + 11 = (x + 4)² = x² + 8x + 16.\n\n"
        "Collecting terms gives 0 = x² + 6x + 5, which factors as (x + 1)(x + 5) = 0. The "
        "candidates are x = -1 and x = -5.\n\n"
        "Squaring can introduce extraneous solutions, so both must be checked in the original "
        "equation. For x = -1: the left side is √9 = 3 and the right side is 3, so it works. "
        "For x = -5: the left side is √1 = 1 but the right side is -1, so it fails — a square "
        "root is never negative.\n\n"
        "The only solution is x = -1."
    ),
    check=lambda: (
        sp.solve(sp.Eq(sp.sqrt(2 * x + 11), x + 4), x) == [-1]
    ),
)

add(
    external_id="sp-m-0037",
    skill=S_NL,
    fmt="SPR",
    stem="(x - 3)² = 49\n\nWhat is the positive solution to the given equation?",
    answer="10",
    explanation=(
        "Take the square root of both sides, remembering both signs: x - 3 = 7 or x - 3 = -7.\n\n"
        "The first gives x = 10 and the second gives x = -4.\n\n"
        "The question asks for the positive solution, so the answer is 10.\n\n"
        "A common error is to take only the positive root and miss that there are two solutions, "
        "or to expand first and make a sign error; expanding gives x² - 6x - 40 = 0, which "
        "factors as (x - 10)(x + 4) and confirms the same pair."
    ),
    check=lambda: sorted(sp.solve(sp.Eq((x - 3) ** 2, 49), x)) == [-4, 10],
)

add(
    external_id="sp-m-0038",
    skill=S_NL,
    fmt="SPR",
    stem="3x² + 12x - 15 = 0\n\nWhat is the product of the solutions to the given equation?",
    answer="-5",
    explanation=(
        "For a quadratic ax² + bx + c = 0, the product of the solutions is c/a. Here "
        "c/a = -15/3 = -5.\n\n"
        "This can be confirmed directly. Dividing the equation by 3 gives x² + 4x - 5 = 0, "
        "which factors as (x + 5)(x - 1) = 0. The solutions are x = -5 and x = 1, and their "
        "product is -5.\n\n"
        "Note that dividing by 3 does not change the solutions, so the product is unaffected."
    ),
    check=lambda: sp.prod(sp.solve(sp.Eq(3 * x**2 + 12 * x - 15, 0), x)) == -5,
)

add(
    external_id="sp-m-0039",
    skill=S_NL,
    fmt="MCQ",
    stem=(
        "x² - 6x + c = 0\n\n"
        "In the given equation, c is a constant. If the equation has two distinct real "
        "solutions, which of the following could be the value of c?"
    ),
    choices={"A": "8", "B": "9", "C": "10", "D": "12"},
    answer="A",
    explanation=(
        "A quadratic has two distinct real solutions exactly when its discriminant is "
        "positive.\n\n"
        "Here the discriminant is (-6)² - 4(1)(c) = 36 - 4c. Requiring 36 - 4c > 0 gives "
        "4c < 36, so c < 9.\n\n"
        "Among the choices, only 8 is less than 9.\n\n"
        "Choice B gives a discriminant of exactly 0, which produces one repeated solution, not "
        "two distinct ones. Choices C and D give negative discriminants, so there are no real "
        "solutions at all."
    ),
    check=lambda: [c for c in (8, 9, 10, 12) if 36 - 4 * c > 0] == [8],
)

add(
    external_id="sp-m-0040",
    skill=S_NL,
    fmt="SPR",
    stem=(
        "y = x²\ny = 5x - 6\n\n"
        "What is the sum of the x-coordinates of the solutions to the given system of equations?"
    ),
    answer="5",
    explanation=(
        "Setting the expressions for y equal gives x² = 5x - 6, or x² - 5x + 6 = 0.\n\n"
        "This factors as (x - 2)(x - 3) = 0, so the x-coordinates are 2 and 3 and their sum "
        "is 5.\n\n"
        "The sum could also be read straight off the equation: for x² - 5x + 6 = 0 the sum of "
        "the solutions is -b/a = 5, with no factoring needed."
    ),
    check=lambda: sum(sp.solve(sp.Eq(x**2, 5 * x - 6), x)) == 5,
)

# --- Nonlinear functions -----------------------------------------------------

add(
    external_id="sp-m-0041",
    skill=S_FN,
    fmt="MCQ",
    stem=(
        "A population of 2,400 organisms decreases by 15% each year. Which function models "
        "P(t), the population t years from now?"
    ),
    choices={
        "A": "P(t) = 2400(0.85)^t",
        "B": "P(t) = 2400(0.15)^t",
        "C": "P(t) = 2400(1.15)^t",
        "D": "P(t) = 2400 - 0.15t",
    },
    answer="A",
    explanation=(
        "A quantity that changes by a fixed percentage each year is exponential, with the form "
        "P(t) = P₀(1 + r)^t where P₀ is the starting amount and r is the rate of change.\n\n"
        "A 15% decrease means r = -0.15, so the base is 1 - 0.15 = 0.85. The population starts "
        "at 2,400, so P(t) = 2400(0.85)^t.\n\n"
        "Checking one year: 2400(0.85) = 2040, which is 360 less than 2400, and 360 is 15% of "
        "2400.\n\n"
        "Choice B uses the rate itself as the base, which would remove 85% each year. Choice C "
        "models growth rather than decay. Choice D is linear, which would subtract the same "
        "0.15 organisms each year rather than 15% of the current population."
    ),
    check=lambda: abs(2400 * 0.85 - (2400 - 0.15 * 2400)) < 1e-9,
)

add(
    external_id="sp-m-0042",
    skill=S_FN,
    fmt="SPR",
    stem="The function f is defined by f(x) = x² - 8x + 3. What is the minimum value of f(x)?",
    answer="-13",
    explanation=(
        "The graph of f is a parabola opening upward, so its minimum occurs at the vertex.\n\n"
        "The x-coordinate of the vertex is x = -b/(2a) = 8/2 = 4.\n\n"
        "The minimum value is the output there: f(4) = 16 - 32 + 3 = -13.\n\n"
        "Completing the square confirms it: f(x) = (x - 4)² - 13, and since (x - 4)² is never "
        "negative, the smallest possible value of f is -13.\n\n"
        "Note the question asks for the minimum value of the function, which is the "
        "y-coordinate of the vertex, not the x-coordinate."
    ),
    check=lambda: sp.minimum(x**2 - 8 * x + 3, x, sp.Reals) == -13,
)

add(
    external_id="sp-m-0043",
    skill=S_FN,
    fmt="MCQ",
    stem=(
        "The function f is defined by f(x) = (x + 2)(x - 6). What is the x-coordinate of the "
        "vertex of the graph of y = f(x) in the xy-plane?"
    ),
    choices={"A": "-2", "B": "2", "C": "4", "D": "6"},
    answer="B",
    explanation=(
        "In factored form the zeros are visible directly: f(x) = 0 when x = -2 and when x = 6.\n\n"
        "A parabola is symmetric about the vertical line through its vertex, and that line sits "
        "exactly halfway between the two zeros.\n\n"
        "The midpoint of -2 and 6 is (-2 + 6)/2 = 2.\n\n"
        "Choices A and D are the zeros themselves rather than the point between them. Choice C "
        "is the average of 2 and 6, ignoring the sign on the first zero."
    ),
    check=lambda: sp.Rational(-2 + 6, 2) == 2
    and sp.solve(sp.Eq(sp.diff((x + 2) * (x - 6), x), 0), x) == [2],
)

add(
    external_id="sp-m-0044",
    skill=S_FN,
    fmt="SPR",
    stem=(
        "The function g is defined by g(x) = 3(2)^x. If g(a) = 48, what is the value of a?"
    ),
    answer="4",
    explanation=(
        "Substituting gives 3(2)^a = 48. Dividing both sides by 3 gives 2^a = 16.\n\n"
        "Since 16 = 2⁴, it follows that a = 4.\n\n"
        "Checking: g(4) = 3(2)⁴ = 3(16) = 48.\n\n"
        "A common error is to divide 48 by 2 first, or to treat 3(2)^x as (3·2)^x = 6^x; the "
        "exponent applies only to the 2."
    ),
    check=lambda: 3 * 2**4 == 48,
)

add(
    external_id="sp-m-0045",
    skill=S_FN,
    fmt="MCQ",
    stem=(
        "The graph of y = f(x), where f(x) = x², is translated 3 units to the right and 5 units "
        "down to produce the graph of y = g(x). Which of the following defines g(x)?"
    ),
    choices={"A": "(x - 3)² - 5", "B": "(x + 3)² - 5", "C": "(x - 3)² + 5", "D": "(x - 5)² - 3"},
    answer="A",
    explanation=(
        "A horizontal translation changes the input, and it does so in the direction opposite "
        "to the sign inside the parentheses: shifting 3 units right replaces x with x - 3.\n\n"
        "A vertical translation changes the output directly: shifting 5 units down subtracts 5 "
        "from the whole expression.\n\n"
        "Applying both gives g(x) = (x - 3)² - 5.\n\n"
        "Checking the vertex: f has its vertex at (0, 0), and g has its vertex at (3, -5), "
        "which is 3 right and 5 down as required.\n\n"
        "Choice B shifts left instead of right. Choice C shifts up. Choice D swaps the two "
        "amounts."
    ),
    check=lambda: (
        sp.expand((x - 3) ** 2 - 5).subs(x, 3) == -5 and sp.expand((x - 3) ** 2 - 5).subs(x, 0) == 4
    ),
)

add(
    external_id="sp-m-0046",
    skill=S_FN,
    fmt="MCQ",
    stem=(
        "An investment of $5,000 earns 6% interest compounded annually. Which function gives "
        "V(t), the value of the investment in dollars after t years?"
    ),
    choices={
        "A": "V(t) = 5000(1.06)^t",
        "B": "V(t) = 5000(0.06)^t",
        "C": "V(t) = 5000(1.6)^t",
        "D": "V(t) = 5000 + 300t",
    },
    answer="A",
    explanation=(
        "Compound interest multiplies the balance by the same factor each period. Earning 6% "
        "means keeping the original 100% and adding 6%, so the factor is 1 + 0.06 = 1.06.\n\n"
        "Starting from $5,000, the value after t years is V(t) = 5000(1.06)^t.\n\n"
        "Checking one year: 5000(1.06) = 5300, which is $300 more, and $300 is 6% of $5,000.\n\n"
        "Choice B uses the rate as the base, which would destroy 94% of the value each year. "
        "Choice C misplaces the decimal, giving 60% growth. Choice D is simple interest, not "
        "compound — it adds $300 every year rather than 6% of a growing balance."
    ),
    check=lambda: abs(5000 * 1.06 - 5300) < 1e-9,
)

add(
    external_id="sp-m-0047",
    skill=S_FN,
    fmt="MCQ",
    stem=(
        "f(x) = 2x² - 12x + 23\n\n"
        "Which of the following equivalent forms of f(x) displays the minimum value of f as a "
        "constant or coefficient?"
    ),
    choices={
        "A": "2(x - 3)² + 5",
        "B": "2(x - 3)² - 5",
        "C": "2(x - 6)² + 5",
        "D": "(2x - 6)² + 5",
    },
    answer="A",
    explanation=(
        "Vertex form, a(x - h)² + k, shows the minimum as the constant k when a is positive.\n\n"
        "Factor 2 out of the variable terms: f(x) = 2(x² - 6x) + 23. Completing the square "
        "inside requires adding and subtracting 9: f(x) = 2(x² - 6x + 9) + 23 - 18, since the "
        "9 inside is multiplied by the 2 outside.\n\n"
        "That gives f(x) = 2(x - 3)² + 5, so the minimum value is 5, reached at x = 3.\n\n"
        "Choice B forgets that the 9 is scaled by 2 before being subtracted. Choice C uses -6 "
        "rather than half of -6. Choice D leaves the 2 inside the square, which changes the "
        "function."
    ),
    check=lambda: sp.expand(2 * (x - 3) ** 2 + 5) == sp.expand(2 * x**2 - 12 * x + 23),
)

add(
    external_id="sp-m-0048",
    skill=S_FN,
    fmt="MCQ",
    stem=(
        "A radioactive substance has a half-life of 12 years. A sample initially contains 80 "
        "grams of the substance. Which function gives A(t), the number of grams remaining after "
        "t years?"
    ),
    choices={
        "A": "A(t) = 80(1/2)^(t/12)",
        "B": "A(t) = 80(1/2)^(12t)",
        "C": "A(t) = 80(1/12)^(t/2)",
        "D": "A(t) = 80 - (80/12)t",
    },
    answer="A",
    explanation=(
        "A half-life of 12 years means the amount is multiplied by 1/2 every 12 years. The "
        "exponent must therefore count how many 12-year periods have passed, which is t/12.\n\n"
        "Starting from 80 grams gives A(t) = 80(1/2)^(t/12).\n\n"
        "Checking: at t = 12 the exponent is 1, so A(12) = 40 grams — exactly half. At t = 24 "
        "the exponent is 2, giving 20 grams.\n\n"
        "Choice B halves the amount 12 times per year. Choice C swaps the roles of the base and "
        "the period. Choice D is linear, which would reach zero after 12 years instead of "
        "leaving half."
    ),
    check=lambda: abs(80 * (0.5) ** (12 / 12) - 40) < 1e-9
    and abs(80 * (0.5) ** (24 / 12) - 20) < 1e-9,
)
