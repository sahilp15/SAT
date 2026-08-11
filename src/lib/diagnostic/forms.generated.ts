// GENERATED FILE — do not edit by hand.
// Regenerate with: npm run build:forms
//
// 18 diagnostic forms built on the shared blueprint in ./blueprint.ts.
// Every form has the same 20 slots (domain, difficulty, stage), so scores from
// different forms are directly comparable; only the questions differ.
//
// Composition of this run:
//   MATH: 360 slots drawn from 257 distinct questions, each used at most 3x
//   READING_WRITING: 360 slots drawn from 360 distinct questions — no form shares a question with any other
//   Closest reuse of any single question, across all slots: 6 forms apart
//   Closest reuse a student actually sees (routing + one track):
//     EASY track: 10 forms apart
//     MEDIUM track: 6 forms apart
//     HARD track: 10 forms apart
//   617 distinct questions are reserved across all forms.
//
// A question never appears twice within one form. Reading & Writing has enough
// clean questions for full disjointness; the Math pool does not, so Math cycles
// with the widest spacing available. Seeing a Math question again several weeks
// later is a retention check, not a leak.

import type { DiagnosticForm } from "./form";

export const GENERATED_FORMS: DiagnosticForm[] = [
  {
    "id": 1,
    "math": {
      "routing": [
        {
          "externalId": "30d645b0",
          "skill": "Linear inequalities in one or two variables",
          "format": "MCQ"
        },
        {
          "externalId": "25683f71",
          "skill": "Nonlinear functions",
          "format": "MCQ"
        },
        {
          "externalId": "0edb622e",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "307d7ae0",
          "skill": "Right triangles and trigonometry",
          "format": "SPR"
        },
        {
          "externalId": "6a18e6b3",
          "skill": "One-variable data: Distributions and measures of center and spread",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "3236ca30",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "001497f6",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "0f1cfed0",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "0748d686",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "11f714b1",
            "skill": "Systems of two linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "1615e831",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "28a0ca32",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "26c126bb",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "23923e5b",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "2a366aeb",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "31dc807b",
            "skill": "Systems of two linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "2d8f1f6a",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "40789a56",
            "skill": "Circles",
            "format": "SPR"
          },
          {
            "externalId": "a14f60fe",
            "skill": "Evaluating statistical claims: Observational studies and experiments",
            "format": "MCQ"
          },
          {
            "externalId": "2e655326",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "01785861",
          "skill": "Text Structure and Purpose",
          "format": "MCQ"
        },
        {
          "externalId": "0251d17e",
          "skill": "Command of Evidence",
          "format": "MCQ"
        },
        {
          "externalId": "08fe665d",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "004680af",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "014151d0",
          "skill": "Command of Evidence",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "0639f0cf",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "053930c2",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "0a22512b",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "0314684f",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "06346bcd",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "09333379",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "0d564c7f",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "108fb9e7",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "0714c5f1",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          },
          {
            "externalId": "095c1bb2",
            "skill": "Boundaries",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "01d4dfd9",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "11c6fbdc",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "0a6b66b3",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "0a9b75f3",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "03d9c538",
            "skill": "Inferences",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 2,
    "math": {
      "routing": [
        {
          "externalId": "3526a6a1",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "5513928b",
          "skill": "Nonlinear functions",
          "format": "MCQ"
        },
        {
          "externalId": "1cdd69a4",
          "skill": "Linear functions",
          "format": "SPR"
        },
        {
          "externalId": "494cbff8",
          "skill": "Lines, angles, and triangles",
          "format": "MCQ"
        },
        {
          "externalId": "d2da7c69",
          "skill": "Percentages",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "551e171e",
            "skill": "Linear equations in one variable",
            "format": "SPR"
          },
          {
            "externalId": "3e50584f",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "2eb1f9e1",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "35d7123b",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "3ab9020f",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "3586b08b",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "5bfaf155",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "43e876eb",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "427f0eea",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "3c503333",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "43e69f94",
            "skill": "Linear functions",
            "format": "MCQ"
          },
          {
            "externalId": "49de5e98",
            "skill": "Nonlinear functions",
            "format": "SPR"
          },
          {
            "externalId": "4abd4abf",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "d683c482",
            "skill": "Percentages",
            "format": "SPR"
          },
          {
            "externalId": "6b56736a",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "0b3af2d3",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "119c4069",
          "skill": "Command of Evidence",
          "format": "MCQ"
        },
        {
          "externalId": "094e6e94",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "0d9560e0",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "0a017199",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "0b681b18",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "0693086b",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "15c028e1",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "10af0d71",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "0aa32767",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "0b05d2d6",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "172f5e8c",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "2138137b",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "0c0e9872",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "247a2b79",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "0ee7dfb6",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "2a3fd2d7",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "140d2d15",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "12bece85",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "12b370c2",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 3,
    "math": {
      "routing": [
        {
          "externalId": "59074d92",
          "skill": "Linear functions",
          "format": "MCQ"
        },
        {
          "externalId": "6095e4fc",
          "skill": "Nonlinear functions",
          "format": "MCQ"
        },
        {
          "externalId": "38f53fa4",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "559068d5",
          "skill": "Area and volume",
          "format": "SPR"
        },
        {
          "externalId": "d783308c",
          "skill": "Percentages",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "59872b80",
            "skill": "Linear functions",
            "format": "MCQ"
          },
          {
            "externalId": "401c7c6c",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "3a519c76",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "489aba1c",
            "skill": "Area and volume",
            "format": "SPR"
          },
          {
            "externalId": "652119ce",
            "skill": "Linear functions",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "524a5350",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "9903ff5b",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "5c415b89",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "73935d4f",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "68e48b4c",
            "skill": "Linear functions",
            "format": "SPR"
          }
        ],
        "HARD": [
          {
            "externalId": "84877fd5",
            "skill": "Linear functions",
            "format": "MCQ"
          },
          {
            "externalId": "9298a52e",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "55b41004",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "e03f95ad",
            "skill": "One-variable data: Distributions and measures of center and spread",
            "format": "SPR"
          },
          {
            "externalId": "960aabc0",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "0b95e434",
          "skill": "Cross-Text Connections",
          "format": "MCQ"
        },
        {
          "externalId": "19f553cc",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        },
        {
          "externalId": "130a364f",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "1572e3e1",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "14ea5897",
          "skill": "Command of Evidence",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "129e7ae3",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "103d9693",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "206ecbfd",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "274d8844",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "21188a4a",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "1ea3651d",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "22ed0f7d",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "2e543111",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "218b932d",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          },
          {
            "externalId": "2d3abce3",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "15c0ed26",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "2effdd5a",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "21f19050",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "2e5a7736",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "263c330a",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 4,
    "math": {
      "routing": [
        {
          "externalId": "74510a38",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "a351b98d",
          "skill": "Equivalent expressions",
          "format": "MCQ"
        },
        {
          "externalId": "542971a2",
          "skill": "Linear equations in two variables",
          "format": "SPR"
        },
        {
          "externalId": "5a4c2576",
          "skill": "Area and volume",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0069",
          "skill": "Ratios, rates, proportional relationships, and units",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "77b21e2b",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "5a018bb6",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "57e4b0b9",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          },
          {
            "externalId": "7ea88342",
            "skill": "Circles",
            "format": "SPR"
          },
          {
            "externalId": "900234f1",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "5ba95aa9",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "b63f5259",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "875a6a8b",
            "skill": "Lines, angles, and triangles",
            "format": "SPR"
          },
          {
            "externalId": "98f7ab7a",
            "skill": "Nonlinear functions",
            "format": "SPR"
          },
          {
            "externalId": "90c618a3",
            "skill": "Systems of two linear equations in two variables",
            "format": "SPR"
          }
        ],
        "HARD": [
          {
            "externalId": "95cc0b50",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "99b8a5c8",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "77b4f5c9",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0070",
            "skill": "Ratios, rates, proportional relationships, and units",
            "format": "SPR"
          },
          {
            "externalId": "9f13fad1",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "18008817",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "25f5e913",
          "skill": "Command of Evidence",
          "format": "MCQ"
        },
        {
          "externalId": "21922a16",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "29f5d8bd",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "27f23e11",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "1a3cbb81",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "1da00c69",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "26dca99e",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "2f3202d5",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "368d7615",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "296f8a05",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "2cd8bd76",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "355d0918",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "372b3cc3",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "306ada66",
            "skill": "Boundaries",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "2d64114f",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "3152fbb0",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "33a93756",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "4165e701",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "3858f84c",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 5,
    "math": {
      "routing": [
        {
          "externalId": "827504df",
          "skill": "Linear functions",
          "format": "SPR"
        },
        {
          "externalId": "c14d9ecc",
          "skill": "Nonlinear functions",
          "format": "SPR"
        },
        {
          "externalId": "6f8503f0",
          "skill": "Linear inequalities in one or two variables",
          "format": "MCQ"
        },
        {
          "externalId": "8235af09",
          "skill": "Area and volume",
          "format": "SPR"
        },
        {
          "externalId": "sp-m-0071",
          "skill": "Ratios, rates, proportional relationships, and units",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "8725b868",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "695e5620",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "71dc13cb",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "88041348",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "9a67367f",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "7eea65e3",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "c6e98bfc",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "8e79ef1c",
            "skill": "Circles",
            "format": "SPR"
          },
          {
            "externalId": "b7f055bc",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "b7305783",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "b81a4da4",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          },
          {
            "externalId": "b939a904",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "9ca6e7b4",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0072",
            "skill": "Percentages",
            "format": "MCQ"
          },
          {
            "externalId": "b9b42f28",
            "skill": "Nonlinear functions",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "29422d6a",
          "skill": "Cross-Text Connections",
          "format": "MCQ"
        },
        {
          "externalId": "2f16288f",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        },
        {
          "externalId": "2ee3c97f",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "38a981d0",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "3d89704b",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "2d19a1cb",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "263ca5b5",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "2fa507b2",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "368d0222",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "4183cbda",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "35c6af60",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "358eef09",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "40f0633c",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "472bbfdf",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "346bc3a5",
            "skill": "Boundaries",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "44a7fb0e",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "36e0f3e2",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "4e564c4f",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "52aa1317",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "491f03f1",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 6,
    "math": {
      "routing": [
        {
          "externalId": "912eb2f0",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "cb03e399",
          "skill": "Nonlinear equations in one variable and systems of equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "808e9650",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "aac770b4",
          "skill": "Lines, angles, and triangles",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0073",
          "skill": "Percentages",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "977935fa",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "76bb62a9",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "80f346ea",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "9019ad99",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "bd12c0bd",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "89cf1784",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "e65d34a5",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "98d85e86",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "bcbf0e45",
            "skill": "Equivalent expressions",
            "format": "SPR"
          },
          {
            "externalId": "beb54560",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          }
        ],
        "HARD": [
          {
            "externalId": "c729c1d7",
            "skill": "Linear inequalities in one or two variables",
            "format": "SPR"
          },
          {
            "externalId": "da9efa2f",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "acb49e4b",
            "skill": "Right triangles and trigonometry",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0074",
            "skill": "Percentages",
            "format": "SPR"
          },
          {
            "externalId": "eafd61d3",
            "skill": "Equivalent expressions",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "2e6f2fb0",
          "skill": "Text Structure and Purpose",
          "format": "MCQ"
        },
        {
          "externalId": "39343ca0",
          "skill": "Command of Evidence",
          "format": "MCQ"
        },
        {
          "externalId": "4449bf81",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "59aa305b",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "497015e1",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "33a59ff5",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "26b716e8",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "3acc2d54",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "43ca2315",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "67a1f442",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "4ca5ab4d",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "3b3541e3",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "51f975cc",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "6a9bf335",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "3b9318f2",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "4bc98629",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "4800f3d3",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "5bb70279",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "702a74f4",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "4d671b68",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 7,
    "math": {
      "routing": [
        {
          "externalId": "a23c1142",
          "skill": "Linear equations in one variable",
          "format": "MCQ"
        },
        {
          "externalId": "f20cc110",
          "skill": "Nonlinear equations in one variable and systems of equations in two variables",
          "format": "SPR"
        },
        {
          "externalId": "8c6982c3",
          "skill": "Linear functions",
          "format": "MCQ"
        },
        {
          "externalId": "b006acd3",
          "skill": "Circles",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0075",
          "skill": "One-variable data: Distributions and measures of center and spread",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "b7dbe5b2",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          },
          {
            "externalId": "97f3dbe0",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "96e950f2",
            "skill": "Linear functions",
            "format": "SPR"
          },
          {
            "externalId": "9c3d5225",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "c73c84cc",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "a39e1c3b",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "25683f71",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "af517132",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "eb92492d",
            "skill": "Nonlinear functions",
            "format": "SPR"
          },
          {
            "externalId": "c96a90a2",
            "skill": "Linear functions",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "dcdceeae",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "eec1aa3e",
            "skill": "Nonlinear functions",
            "format": "SPR"
          },
          {
            "externalId": "b2aa5d73",
            "skill": "Circles",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0076",
            "skill": "One-variable data: Distributions and measures of center and spread",
            "format": "MCQ"
          },
          {
            "externalId": "f5f840a0",
            "skill": "Nonlinear functions",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "367f3651",
          "skill": "Text Structure and Purpose",
          "format": "MCQ"
        },
        {
          "externalId": "40aa7b00",
          "skill": "Inferences",
          "format": "MCQ"
        },
        {
          "externalId": "4efacd65",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "5efdc098",
          "skill": "Transitions",
          "format": "MCQ"
        },
        {
          "externalId": "4e46cb15",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "37ffb006",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "37ccf84e",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "48f28116",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "5e3e20f9",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "7424ea31",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "6203926e",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "4b302743",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "68609a2d",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "755cb5eb",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "4b70187a",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "4e66210f",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "4dc1b152",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "6be089ec",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "76d87f54",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "529ab62c",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 8,
    "math": {
      "routing": [
        {
          "externalId": "c066203a",
          "skill": "Linear equations in one variable",
          "format": "MCQ"
        },
        {
          "externalId": "28a0ca32",
          "skill": "Nonlinear equations in one variable and systems of equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "a8b51d6b",
          "skill": "Linear functions",
          "format": "MCQ"
        },
        {
          "externalId": "c3f47bd8",
          "skill": "Lines, angles, and triangles",
          "format": "SPR"
        },
        {
          "externalId": "sp-m-0077",
          "skill": "One-variable data: Distributions and measures of center and spread",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "d5e9c402",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "a3d03f49",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "b272276f",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "ba00aba9",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "df8ae774",
            "skill": "Linear equations in one variable",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "b2c1a14d",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "5513928b",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "dbb97818",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0025",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "e1f59a4d",
            "skill": "Linear functions",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "e96acc98",
            "skill": "Linear equations in one variable",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0026",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "d3151792",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0078",
            "skill": "Two-variable data: Models and scatterplots",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0027",
            "skill": "Equivalent expressions",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "40bd08d8",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "4c109ce5",
          "skill": "Inferences",
          "format": "MCQ"
        },
        {
          "externalId": "72ae84d8",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "781e8f5c",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "5544272f",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "45f3c80a",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "3b3c043c",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "58b90851",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "68ef9df3",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "826c2a7e",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "736ac5f3",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "5a95c25a",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "69281ab2",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "83e4ea9a",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "55e374e8",
            "skill": "Boundaries",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "57fb41c0",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "60c74aa0",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "857346cd",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "841a15d0",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          },
          {
            "externalId": "5ad0b3b6",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 9,
    "math": {
      "routing": [
        {
          "externalId": "dadfd136",
          "skill": "Linear functions",
          "format": "MCQ"
        },
        {
          "externalId": "5bfaf155",
          "skill": "Nonlinear equations in one variable and systems of equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "b8f0032a",
          "skill": "Systems of two linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "d32d4957",
          "skill": "Right triangles and trigonometry",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0079",
          "skill": "Two-variable data: Models and scatterplots",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "e1dceebe",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "cf0fc6ba",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "b944bec6",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "f009297f",
            "skill": "Circles",
            "format": "SPR"
          },
          {
            "externalId": "ec0fe2b2",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "c05a6f72",
            "skill": "Linear functions",
            "format": "MCQ"
          },
          {
            "externalId": "6095e4fc",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "f4680374",
            "skill": "Right triangles and trigonometry",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0028",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0001",
            "skill": "Linear equations in one variable",
            "format": "SPR"
          }
        ],
        "HARD": [
          {
            "externalId": "sp-m-0002",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0029",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "ddb62d63",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0082",
            "skill": "Inference from sample statistics and margin of error",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0030",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "4bda3cab",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "5bac62e5",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        },
        {
          "externalId": "87eb538d",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "867ceff8",
          "skill": "Transitions",
          "format": "MCQ"
        },
        {
          "externalId": "5db9e88a",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "4e772803",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          },
          {
            "externalId": "4b940410",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "5bb02134",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "6b646bda",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "8dd4b0d5",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "8bd8f58c",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "5c37d685",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "6fb1f442",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "939f1fe8",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "638832ee",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "5e6596a9",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "6510a8cd",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "8f3ad8e1",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "a05fe244",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "6760c788",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 10,
    "math": {
      "routing": [
        {
          "externalId": "e644d732",
          "skill": "Systems of two linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "9903ff5b",
          "skill": "Nonlinear functions",
          "format": "MCQ"
        },
        {
          "externalId": "c319a5eb",
          "skill": "Linear functions",
          "format": "MCQ"
        },
        {
          "externalId": "e901bf6d",
          "skill": "Area and volume",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0083",
          "skill": "Inference from sample statistics and margin of error",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "edf8a6ae",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "d25b0c19",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "c38b4d1e",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          },
          {
            "externalId": "ffc88014",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0003",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "c3c9b8bc",
            "skill": "Linear functions",
            "format": "MCQ"
          },
          {
            "externalId": "a351b98d",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "0748d686",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0031",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0004",
            "skill": "Linear equations in one variable",
            "format": "SPR"
          }
        ],
        "HARD": [
          {
            "externalId": "sp-m-0005",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0032",
            "skill": "Equivalent expressions",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0049",
            "skill": "Area and volume",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0084",
            "skill": "Evaluating statistical claims: Observational studies and experiments",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0033",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "5046a8e3",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "5cebee9e",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        },
        {
          "externalId": "8cfad1fb",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "9579edb4",
          "skill": "Transitions",
          "format": "MCQ"
        },
        {
          "externalId": "787729f7",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "5d562290",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          },
          {
            "externalId": "562d4b57",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "5ead8efc",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "72df7623",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "a84b11c2",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "8e27d086",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "5f411925",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "8412b266",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "a8c35eaf",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "6b4c8b42",
            "skill": "Boundaries",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "7e1dd168",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "7c61f5af",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "990bd995",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "b3492de4",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "7f8cec1c",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 11,
    "math": {
      "routing": [
        {
          "externalId": "eefbcc02",
          "skill": "Linear functions",
          "format": "SPR"
        },
        {
          "externalId": "b63f5259",
          "skill": "Nonlinear equations in one variable and systems of equations in two variables",
          "format": "SPR"
        },
        {
          "externalId": "cd13910e",
          "skill": "Linear equations in two variables",
          "format": "SPR"
        },
        {
          "externalId": "sp-m-0050",
          "skill": "Area and volume",
          "format": "SPR"
        },
        {
          "externalId": "6a18e6b3",
          "skill": "One-variable data: Distributions and measures of center and spread",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "fe4d899b",
            "skill": "Linear functions",
            "format": "MCQ"
          },
          {
            "externalId": "dabcd1a8",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "ce6f6062",
            "skill": "Linear equations in one variable",
            "format": "SPR"
          },
          {
            "externalId": "26c126bb",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0006",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "d609d1ce",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "c14d9ecc",
            "skill": "Nonlinear functions",
            "format": "SPR"
          },
          {
            "externalId": "35d7123b",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0034",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0007",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "sp-m-0008",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0035",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0051",
            "skill": "Area and volume",
            "format": "SPR"
          },
          {
            "externalId": "a14f60fe",
            "skill": "Evaluating statistical claims: Observational studies and experiments",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0036",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "6459b902",
          "skill": "Cross-Text Connections",
          "format": "MCQ"
        },
        {
          "externalId": "5ff54c6e",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        },
        {
          "externalId": "9360277c",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "9db9a861",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "81ca68a1",
          "skill": "Command of Evidence",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "6550292c",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "59b94675",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "6264a75d",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "88c4086d",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "bf0c8b48",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "95649ca9",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "64f87faf",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "8bd3381f",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "bf2915a9",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "7cb7eb7a",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "823f6c65",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "84225518",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "9dcc184d",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "bfad2097",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "84b290f2",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 12,
    "math": {
      "routing": [
        {
          "externalId": "30d645b0",
          "skill": "Linear inequalities in one or two variables",
          "format": "MCQ"
        },
        {
          "externalId": "c6e98bfc",
          "skill": "Nonlinear equations in one variable and systems of equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "d7941984",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0052",
          "skill": "Area and volume",
          "format": "MCQ"
        },
        {
          "externalId": "d2da7c69",
          "skill": "Percentages",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "3236ca30",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "e2abeaa7",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "dfbe86a3",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "43e876eb",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0009",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "e0a370ba",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "cb03e399",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "489aba1c",
            "skill": "Area and volume",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0037",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0010",
            "skill": "Linear functions",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "sp-m-0011",
            "skill": "Linear functions",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0038",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0053",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "d683c482",
            "skill": "Percentages",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0039",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "74ce57b4",
          "skill": "Text Structure and Purpose",
          "format": "MCQ"
        },
        {
          "externalId": "6daa3ef5",
          "skill": "Command of Evidence",
          "format": "MCQ"
        },
        {
          "externalId": "992e6994",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "a2941bd8",
          "skill": "Transitions",
          "format": "MCQ"
        },
        {
          "externalId": "870c7581",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "7846158d",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "63f23c3a",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "6e2f1377",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "95db4b9e",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "c3ef9de3",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "9b49630d",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "70f512e7",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "99c3a1db",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "c6da512f",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "8f2d7e11",
            "skill": "Boundaries",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "88a141f3",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "960ca719",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "aba812aa",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "c6ec16fb",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "8acb62c2",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 13,
    "math": {
      "routing": [
        {
          "externalId": "3526a6a1",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "e65d34a5",
          "skill": "Nonlinear functions",
          "format": "MCQ"
        },
        {
          "externalId": "e13b9cac",
          "skill": "Systems of two linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0054",
          "skill": "Lines, angles, and triangles",
          "format": "SPR"
        },
        {
          "externalId": "d783308c",
          "skill": "Percentages",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "551e171e",
            "skill": "Linear equations in one variable",
            "format": "SPR"
          },
          {
            "externalId": "fb46b28e",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "e170e55b",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "5c415b89",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0012",
            "skill": "Linear functions",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "e34403e6",
            "skill": "Linear functions",
            "format": "MCQ"
          },
          {
            "externalId": "f20cc110",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "7ea88342",
            "skill": "Circles",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0040",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0013",
            "skill": "Linear functions",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "sp-m-0014",
            "skill": "Linear functions",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0041",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0055",
            "skill": "Lines, angles, and triangles",
            "format": "SPR"
          },
          {
            "externalId": "e03f95ad",
            "skill": "One-variable data: Distributions and measures of center and spread",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0042",
            "skill": "Nonlinear functions",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "82dc74ec",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "71e0dd93",
          "skill": "Command of Evidence",
          "format": "MCQ"
        },
        {
          "externalId": "a3f9a509",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "afc8b561",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "9171f2b5",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "88b4e212",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "6afef2f0",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "798a9aa8",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "a0903efe",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "d812bcc5",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "aeba7f69",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "7b249420",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "a3df6d00",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "da17503b",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "971ed23e",
            "skill": "Boundaries",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "92b43ac5",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "a1a0066e",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "b8582018",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "deb55365",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "94da9acc",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 14,
    "math": {
      "routing": [
        {
          "externalId": "59074d92",
          "skill": "Linear functions",
          "format": "MCQ"
        },
        {
          "externalId": "25683f71",
          "skill": "Nonlinear functions",
          "format": "MCQ"
        },
        {
          "externalId": "ee7444eb",
          "skill": "Linear inequalities in one or two variables",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0056",
          "skill": "Lines, angles, and triangles",
          "format": "SPR"
        },
        {
          "externalId": "sp-m-0069",
          "skill": "Ratios, rates, proportional relationships, and units",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "59872b80",
            "skill": "Linear functions",
            "format": "MCQ"
          },
          {
            "externalId": "001497f6",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "0edb622e",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "875a6a8b",
            "skill": "Lines, angles, and triangles",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0015",
            "skill": "Systems of two linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "0f1cfed0",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "28a0ca32",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "88041348",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0043",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0016",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "sp-m-0017",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0044",
            "skill": "Nonlinear functions",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0057",
            "skill": "Lines, angles, and triangles",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0070",
            "skill": "Ratios, rates, proportional relationships, and units",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0045",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "8996e8a7",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "87d834ef",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        },
        {
          "externalId": "b249902a",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "bcb73490",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "a0120582",
          "skill": "Command of Evidence",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "8be97589",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "726e8de8",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "8a193615",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "a846cda0",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "df7bc1cf",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "b305e581",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "8cc6b27a",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "aadcdfa3",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "e5f76480",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          },
          {
            "externalId": "a243dfaa",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "a2441389",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "a6ee5b63",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "c5423706",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "ef9e1e81",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "a28d9514",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 15,
    "math": {
      "routing": [
        {
          "externalId": "74510a38",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "5513928b",
          "skill": "Nonlinear functions",
          "format": "MCQ"
        },
        {
          "externalId": "1615e831",
          "skill": "Systems of two linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0058",
          "skill": "Lines, angles, and triangles",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0071",
          "skill": "Ratios, rates, proportional relationships, and units",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "77b21e2b",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "3e50584f",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "1cdd69a4",
            "skill": "Linear functions",
            "format": "SPR"
          },
          {
            "externalId": "8e79ef1c",
            "skill": "Circles",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0018",
            "skill": "Systems of two linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "2eb1f9e1",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "5bfaf155",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "9019ad99",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0046",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0019",
            "skill": "Systems of two linear equations in two variables",
            "format": "SPR"
          }
        ],
        "HARD": [
          {
            "externalId": "sp-m-0020",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0047",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0059",
            "skill": "Right triangles and trigonometry",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0072",
            "skill": "Percentages",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0048",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "8edf27ef",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "8e316e56",
          "skill": "Command of Evidence",
          "format": "MCQ"
        },
        {
          "externalId": "b79670a7",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "c6b6128f",
          "skill": "Transitions",
          "format": "MCQ"
        },
        {
          "externalId": "a9aa25f9",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "9115eb54",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "72ba319f",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "8fc5d12b",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "b513efa9",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "f2e39001",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "c4ff1125",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "90856dbc",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "bffa7aea",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "f7455dfd",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "ae88a59f",
            "skill": "Boundaries",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "aa460243",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "b3eebd97",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "c9ecaf7d",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "f8eacedb",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          },
          {
            "externalId": "af45dc3f",
            "skill": "Inferences",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 16,
    "math": {
      "routing": [
        {
          "externalId": "827504df",
          "skill": "Linear functions",
          "format": "SPR"
        },
        {
          "externalId": "6095e4fc",
          "skill": "Nonlinear functions",
          "format": "MCQ"
        },
        {
          "externalId": "3586b08b",
          "skill": "Linear equations in one variable",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0060",
          "skill": "Right triangles and trigonometry",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0073",
          "skill": "Percentages",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "8725b868",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "401c7c6c",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "38f53fa4",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "98d85e86",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0021",
            "skill": "Linear inequalities in one or two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "3a519c76",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "9903ff5b",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "9c3d5225",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "23923e5b",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0022",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "sp-m-0023",
            "skill": "Linear inequalities in one or two variables",
            "format": "SPR"
          },
          {
            "externalId": "2d8f1f6a",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0061",
            "skill": "Right triangles and trigonometry",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0074",
            "skill": "Percentages",
            "format": "SPR"
          },
          {
            "externalId": "2e655326",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "914dc048",
          "skill": "Words in Context",
          "format": "MCQ"
        },
        {
          "externalId": "93a05d57",
          "skill": "Inferences",
          "format": "MCQ"
        },
        {
          "externalId": "cf86d6fd",
          "skill": "Form, Structure, and Sense",
          "format": "MCQ"
        },
        {
          "externalId": "cd75bd44",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "b00c53b3",
          "skill": "Inferences",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "95e9a9c1",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          },
          {
            "externalId": "7399839f",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "97042cf6",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "c32f7659",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "fda65f0a",
            "skill": "Cross-Text Connections",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "d0884ae5",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "a2641e5f",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "c6783904",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "sp-rw-0013",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "b93101bf",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "b355bef7",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "bd907188",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "d3888864",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "sp-rw-0014",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "b74860b2",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 17,
    "math": {
      "routing": [
        {
          "externalId": "912eb2f0",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "a351b98d",
          "skill": "Equivalent expressions",
          "format": "MCQ"
        },
        {
          "externalId": "524a5350",
          "skill": "Linear equations in two variables",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0062",
          "skill": "Right triangles and trigonometry",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0075",
          "skill": "One-variable data: Distributions and measures of center and spread",
          "format": "SPR"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "977935fa",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "5a018bb6",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "542971a2",
            "skill": "Linear equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "af517132",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0024",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "57e4b0b9",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          },
          {
            "externalId": "b63f5259",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "ba00aba9",
            "skill": "Lines, angles, and triangles",
            "format": "MCQ"
          },
          {
            "externalId": "427f0eea",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "11f714b1",
            "skill": "Systems of two linear equations in two variables",
            "format": "SPR"
          }
        ],
        "HARD": [
          {
            "externalId": "2a366aeb",
            "skill": "Linear equations in one variable",
            "format": "MCQ"
          },
          {
            "externalId": "49de5e98",
            "skill": "Nonlinear functions",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0063",
            "skill": "Right triangles and trigonometry",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0076",
            "skill": "One-variable data: Distributions and measures of center and spread",
            "format": "MCQ"
          },
          {
            "externalId": "6b56736a",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "969bb57f",
          "skill": "Cross-Text Connections",
          "format": "MCQ"
        },
        {
          "externalId": "a6a6d037",
          "skill": "Inferences",
          "format": "MCQ"
        },
        {
          "externalId": "d173443c",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "d600f35e",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "b89072a5",
          "skill": "Command of Evidence",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "97c347fb",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "781f2cde",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "ae51efb8",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "c88233b4",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "sp-rw-0015",
            "skill": "Words in Context",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "d7b89c91",
            "skill": "Boundaries",
            "format": "MCQ"
          },
          {
            "externalId": "af80d661",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "cdb5fb80",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "sp-rw-0016",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "be5d95f7",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "bbd93b0f",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "bfca6135",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "dffab2d7",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "sp-rw-0017",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "bc2bfb8f",
            "skill": "Inferences",
            "format": "MCQ"
          }
        ]
      }
    }
  },
  {
    "id": 18,
    "math": {
      "routing": [
        {
          "externalId": "a23c1142",
          "skill": "Linear equations in one variable",
          "format": "MCQ"
        },
        {
          "externalId": "c14d9ecc",
          "skill": "Nonlinear functions",
          "format": "SPR"
        },
        {
          "externalId": "5ba95aa9",
          "skill": "Linear equations in one variable",
          "format": "MCQ"
        },
        {
          "externalId": "sp-m-0064",
          "skill": "Circles",
          "format": "SPR"
        },
        {
          "externalId": "sp-m-0077",
          "skill": "One-variable data: Distributions and measures of center and spread",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "b7dbe5b2",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          },
          {
            "externalId": "695e5620",
            "skill": "Equivalent expressions",
            "format": "MCQ"
          },
          {
            "externalId": "6f8503f0",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          },
          {
            "externalId": "dbb97818",
            "skill": "Area and volume",
            "format": "MCQ"
          },
          {
            "externalId": "31dc807b",
            "skill": "Systems of two linear equations in two variables",
            "format": "SPR"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "71dc13cb",
            "skill": "Linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "c6e98bfc",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "f009297f",
            "skill": "Circles",
            "format": "SPR"
          },
          {
            "externalId": "73935d4f",
            "skill": "Nonlinear functions",
            "format": "MCQ"
          },
          {
            "externalId": "3ab9020f",
            "skill": "Linear inequalities in one or two variables",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "3c503333",
            "skill": "Systems of two linear equations in two variables",
            "format": "MCQ"
          },
          {
            "externalId": "9298a52e",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          },
          {
            "externalId": "sp-m-0065",
            "skill": "Circles",
            "format": "MCQ"
          },
          {
            "externalId": "sp-m-0078",
            "skill": "Two-variable data: Models and scatterplots",
            "format": "SPR"
          },
          {
            "externalId": "960aabc0",
            "skill": "Nonlinear equations in one variable and systems of equations in two variables",
            "format": "SPR"
          }
        ]
      }
    },
    "readingWriting": {
      "routing": [
        {
          "externalId": "b0101665",
          "skill": "Cross-Text Connections",
          "format": "MCQ"
        },
        {
          "externalId": "bda73a5a",
          "skill": "Central Ideas and Details",
          "format": "MCQ"
        },
        {
          "externalId": "e6201ac0",
          "skill": "Boundaries",
          "format": "MCQ"
        },
        {
          "externalId": "e261a81f",
          "skill": "Rhetorical Synthesis",
          "format": "MCQ"
        },
        {
          "externalId": "be184fba",
          "skill": "Command of Evidence",
          "format": "MCQ"
        }
      ],
      "tracks": {
        "EASY": [
          {
            "externalId": "b0b02f2d",
            "skill": "Words in Context",
            "format": "MCQ"
          },
          {
            "externalId": "7ffa76af",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "c0ee4b2d",
            "skill": "Central Ideas and Details",
            "format": "MCQ"
          },
          {
            "externalId": "cf842c88",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "sp-rw-0018",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          }
        ],
        "MEDIUM": [
          {
            "externalId": "e8a33878",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "c34ae829",
            "skill": "Inferences",
            "format": "MCQ"
          },
          {
            "externalId": "d305b5c4",
            "skill": "Rhetorical Synthesis",
            "format": "MCQ"
          },
          {
            "externalId": "sp-rw-0019",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "bff1d6df",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          }
        ],
        "HARD": [
          {
            "externalId": "bf1fe112",
            "skill": "Command of Evidence",
            "format": "MCQ"
          },
          {
            "externalId": "c1ddb039",
            "skill": "Form, Structure, and Sense",
            "format": "MCQ"
          },
          {
            "externalId": "f99639a1",
            "skill": "Transitions",
            "format": "MCQ"
          },
          {
            "externalId": "sp-rw-0020",
            "skill": "Text Structure and Purpose",
            "format": "MCQ"
          },
          {
            "externalId": "c2e17200",
            "skill": "Command of Evidence",
            "format": "MCQ"
          }
        ]
      }
    }
  }
];

/** Every external id referenced by any form — used by the seeder. */
export const RESERVED_EXTERNAL_IDS: string[] = [
  "001497f6",
  "004680af",
  "014151d0",
  "01785861",
  "01d4dfd9",
  "0251d17e",
  "0314684f",
  "03d9c538",
  "053930c2",
  "06346bcd",
  "0639f0cf",
  "0693086b",
  "0714c5f1",
  "0748d686",
  "08fe665d",
  "09333379",
  "094e6e94",
  "095c1bb2",
  "0a017199",
  "0a22512b",
  "0a6b66b3",
  "0a9b75f3",
  "0aa32767",
  "0b05d2d6",
  "0b3af2d3",
  "0b681b18",
  "0b95e434",
  "0c0e9872",
  "0d564c7f",
  "0d9560e0",
  "0edb622e",
  "0ee7dfb6",
  "0f1cfed0",
  "103d9693",
  "108fb9e7",
  "10af0d71",
  "119c4069",
  "11c6fbdc",
  "11f714b1",
  "129e7ae3",
  "12b370c2",
  "12bece85",
  "130a364f",
  "140d2d15",
  "14ea5897",
  "1572e3e1",
  "15c028e1",
  "15c0ed26",
  "1615e831",
  "172f5e8c",
  "18008817",
  "19f553cc",
  "1a3cbb81",
  "1cdd69a4",
  "1da00c69",
  "1ea3651d",
  "206ecbfd",
  "21188a4a",
  "2138137b",
  "218b932d",
  "21922a16",
  "21f19050",
  "22ed0f7d",
  "23923e5b",
  "247a2b79",
  "25683f71",
  "25f5e913",
  "263c330a",
  "263ca5b5",
  "26b716e8",
  "26c126bb",
  "26dca99e",
  "274d8844",
  "27f23e11",
  "28a0ca32",
  "29422d6a",
  "296f8a05",
  "29f5d8bd",
  "2a366aeb",
  "2a3fd2d7",
  "2cd8bd76",
  "2d19a1cb",
  "2d3abce3",
  "2d64114f",
  "2d8f1f6a",
  "2e543111",
  "2e5a7736",
  "2e655326",
  "2e6f2fb0",
  "2eb1f9e1",
  "2ee3c97f",
  "2effdd5a",
  "2f16288f",
  "2f3202d5",
  "2fa507b2",
  "306ada66",
  "307d7ae0",
  "30d645b0",
  "3152fbb0",
  "31dc807b",
  "3236ca30",
  "33a59ff5",
  "33a93756",
  "346bc3a5",
  "3526a6a1",
  "355d0918",
  "3586b08b",
  "358eef09",
  "35c6af60",
  "35d7123b",
  "367f3651",
  "368d0222",
  "368d7615",
  "36e0f3e2",
  "372b3cc3",
  "37ccf84e",
  "37ffb006",
  "3858f84c",
  "38a981d0",
  "38f53fa4",
  "39343ca0",
  "3a519c76",
  "3ab9020f",
  "3acc2d54",
  "3b3541e3",
  "3b3c043c",
  "3b9318f2",
  "3c503333",
  "3d89704b",
  "3e50584f",
  "401c7c6c",
  "40789a56",
  "40aa7b00",
  "40bd08d8",
  "40f0633c",
  "4165e701",
  "4183cbda",
  "427f0eea",
  "43ca2315",
  "43e69f94",
  "43e876eb",
  "4449bf81",
  "44a7fb0e",
  "45f3c80a",
  "472bbfdf",
  "4800f3d3",
  "489aba1c",
  "48f28116",
  "491f03f1",
  "494cbff8",
  "497015e1",
  "49de5e98",
  "4abd4abf",
  "4b302743",
  "4b70187a",
  "4b940410",
  "4bc98629",
  "4bda3cab",
  "4c109ce5",
  "4ca5ab4d",
  "4d671b68",
  "4dc1b152",
  "4e46cb15",
  "4e564c4f",
  "4e66210f",
  "4e772803",
  "4efacd65",
  "5046a8e3",
  "51f975cc",
  "524a5350",
  "529ab62c",
  "52aa1317",
  "542971a2",
  "5513928b",
  "551e171e",
  "5544272f",
  "559068d5",
  "55b41004",
  "55e374e8",
  "562d4b57",
  "57e4b0b9",
  "57fb41c0",
  "58b90851",
  "59074d92",
  "59872b80",
  "59aa305b",
  "59b94675",
  "5a018bb6",
  "5a4c2576",
  "5a95c25a",
  "5ad0b3b6",
  "5ba95aa9",
  "5bac62e5",
  "5bb02134",
  "5bb70279",
  "5bfaf155",
  "5c37d685",
  "5c415b89",
  "5cebee9e",
  "5d562290",
  "5db9e88a",
  "5e3e20f9",
  "5e6596a9",
  "5ead8efc",
  "5efdc098",
  "5f411925",
  "5ff54c6e",
  "6095e4fc",
  "60c74aa0",
  "6203926e",
  "6264a75d",
  "638832ee",
  "63f23c3a",
  "6459b902",
  "64f87faf",
  "6510a8cd",
  "652119ce",
  "6550292c",
  "6760c788",
  "67a1f442",
  "68609a2d",
  "68e48b4c",
  "68ef9df3",
  "69281ab2",
  "695e5620",
  "6a18e6b3",
  "6a9bf335",
  "6afef2f0",
  "6b4c8b42",
  "6b56736a",
  "6b646bda",
  "6be089ec",
  "6daa3ef5",
  "6e2f1377",
  "6f8503f0",
  "6fb1f442",
  "702a74f4",
  "70f512e7",
  "71dc13cb",
  "71e0dd93",
  "726e8de8",
  "72ae84d8",
  "72ba319f",
  "72df7623",
  "736ac5f3",
  "73935d4f",
  "7399839f",
  "7424ea31",
  "74510a38",
  "74ce57b4",
  "755cb5eb",
  "76bb62a9",
  "76d87f54",
  "77b21e2b",
  "77b4f5c9",
  "781e8f5c",
  "781f2cde",
  "7846158d",
  "787729f7",
  "798a9aa8",
  "7b249420",
  "7c61f5af",
  "7cb7eb7a",
  "7e1dd168",
  "7ea88342",
  "7eea65e3",
  "7f8cec1c",
  "7ffa76af",
  "808e9650",
  "80f346ea",
  "81ca68a1",
  "8235af09",
  "823f6c65",
  "826c2a7e",
  "827504df",
  "82dc74ec",
  "83e4ea9a",
  "8412b266",
  "841a15d0",
  "84225518",
  "84877fd5",
  "84b290f2",
  "857346cd",
  "867ceff8",
  "870c7581",
  "8725b868",
  "875a6a8b",
  "87d834ef",
  "87eb538d",
  "88041348",
  "88a141f3",
  "88b4e212",
  "88c4086d",
  "8996e8a7",
  "89cf1784",
  "8a193615",
  "8acb62c2",
  "8bd3381f",
  "8bd8f58c",
  "8be97589",
  "8c6982c3",
  "8cc6b27a",
  "8cfad1fb",
  "8dd4b0d5",
  "8e27d086",
  "8e316e56",
  "8e79ef1c",
  "8edf27ef",
  "8f2d7e11",
  "8f3ad8e1",
  "8fc5d12b",
  "900234f1",
  "9019ad99",
  "90856dbc",
  "90c618a3",
  "9115eb54",
  "912eb2f0",
  "914dc048",
  "9171f2b5",
  "9298a52e",
  "92b43ac5",
  "9360277c",
  "939f1fe8",
  "93a05d57",
  "94da9acc",
  "95649ca9",
  "9579edb4",
  "95cc0b50",
  "95db4b9e",
  "95e9a9c1",
  "960aabc0",
  "960ca719",
  "969bb57f",
  "96e950f2",
  "97042cf6",
  "971ed23e",
  "977935fa",
  "97c347fb",
  "97f3dbe0",
  "98d85e86",
  "98f7ab7a",
  "9903ff5b",
  "990bd995",
  "992e6994",
  "99b8a5c8",
  "99c3a1db",
  "9a67367f",
  "9b49630d",
  "9c3d5225",
  "9ca6e7b4",
  "9db9a861",
  "9dcc184d",
  "9f13fad1",
  "a0120582",
  "a05fe244",
  "a0903efe",
  "a14f60fe",
  "a1a0066e",
  "a23c1142",
  "a243dfaa",
  "a2441389",
  "a2641e5f",
  "a28d9514",
  "a2941bd8",
  "a351b98d",
  "a39e1c3b",
  "a3d03f49",
  "a3df6d00",
  "a3f9a509",
  "a6a6d037",
  "a6ee5b63",
  "a846cda0",
  "a84b11c2",
  "a8b51d6b",
  "a8c35eaf",
  "a9aa25f9",
  "aa460243",
  "aac770b4",
  "aadcdfa3",
  "aba812aa",
  "acb49e4b",
  "ae51efb8",
  "ae88a59f",
  "aeba7f69",
  "af45dc3f",
  "af517132",
  "af80d661",
  "afc8b561",
  "b006acd3",
  "b00c53b3",
  "b0101665",
  "b0b02f2d",
  "b249902a",
  "b272276f",
  "b2aa5d73",
  "b2c1a14d",
  "b305e581",
  "b3492de4",
  "b355bef7",
  "b3eebd97",
  "b513efa9",
  "b63f5259",
  "b7305783",
  "b74860b2",
  "b79670a7",
  "b7dbe5b2",
  "b7f055bc",
  "b81a4da4",
  "b8582018",
  "b89072a5",
  "b8f0032a",
  "b93101bf",
  "b939a904",
  "b944bec6",
  "b9b42f28",
  "ba00aba9",
  "bbd93b0f",
  "bc2bfb8f",
  "bcb73490",
  "bcbf0e45",
  "bd12c0bd",
  "bd907188",
  "bda73a5a",
  "be184fba",
  "be5d95f7",
  "beb54560",
  "bf0c8b48",
  "bf1fe112",
  "bf2915a9",
  "bfad2097",
  "bfca6135",
  "bff1d6df",
  "bffa7aea",
  "c05a6f72",
  "c066203a",
  "c0ee4b2d",
  "c14d9ecc",
  "c1ddb039",
  "c2e17200",
  "c319a5eb",
  "c32f7659",
  "c34ae829",
  "c38b4d1e",
  "c3c9b8bc",
  "c3ef9de3",
  "c3f47bd8",
  "c4ff1125",
  "c5423706",
  "c6783904",
  "c6b6128f",
  "c6da512f",
  "c6e98bfc",
  "c6ec16fb",
  "c729c1d7",
  "c73c84cc",
  "c88233b4",
  "c96a90a2",
  "c9ecaf7d",
  "cb03e399",
  "cd13910e",
  "cd75bd44",
  "cdb5fb80",
  "ce6f6062",
  "cf0fc6ba",
  "cf842c88",
  "cf86d6fd",
  "d0884ae5",
  "d173443c",
  "d25b0c19",
  "d2da7c69",
  "d305b5c4",
  "d3151792",
  "d32d4957",
  "d3888864",
  "d5e9c402",
  "d600f35e",
  "d609d1ce",
  "d683c482",
  "d783308c",
  "d7941984",
  "d7b89c91",
  "d812bcc5",
  "da17503b",
  "da9efa2f",
  "dabcd1a8",
  "dadfd136",
  "dbb97818",
  "dcdceeae",
  "ddb62d63",
  "deb55365",
  "df7bc1cf",
  "df8ae774",
  "dfbe86a3",
  "dffab2d7",
  "e03f95ad",
  "e0a370ba",
  "e13b9cac",
  "e170e55b",
  "e1dceebe",
  "e1f59a4d",
  "e261a81f",
  "e2abeaa7",
  "e34403e6",
  "e5f76480",
  "e6201ac0",
  "e644d732",
  "e65d34a5",
  "e8a33878",
  "e901bf6d",
  "e96acc98",
  "eafd61d3",
  "eb92492d",
  "ec0fe2b2",
  "edf8a6ae",
  "ee7444eb",
  "eec1aa3e",
  "eefbcc02",
  "ef9e1e81",
  "f009297f",
  "f20cc110",
  "f2e39001",
  "f4680374",
  "f5f840a0",
  "f7455dfd",
  "f8eacedb",
  "f99639a1",
  "fb46b28e",
  "fda65f0a",
  "fe4d899b",
  "ffc88014",
  "sp-m-0001",
  "sp-m-0002",
  "sp-m-0003",
  "sp-m-0004",
  "sp-m-0005",
  "sp-m-0006",
  "sp-m-0007",
  "sp-m-0008",
  "sp-m-0009",
  "sp-m-0010",
  "sp-m-0011",
  "sp-m-0012",
  "sp-m-0013",
  "sp-m-0014",
  "sp-m-0015",
  "sp-m-0016",
  "sp-m-0017",
  "sp-m-0018",
  "sp-m-0019",
  "sp-m-0020",
  "sp-m-0021",
  "sp-m-0022",
  "sp-m-0023",
  "sp-m-0024",
  "sp-m-0025",
  "sp-m-0026",
  "sp-m-0027",
  "sp-m-0028",
  "sp-m-0029",
  "sp-m-0030",
  "sp-m-0031",
  "sp-m-0032",
  "sp-m-0033",
  "sp-m-0034",
  "sp-m-0035",
  "sp-m-0036",
  "sp-m-0037",
  "sp-m-0038",
  "sp-m-0039",
  "sp-m-0040",
  "sp-m-0041",
  "sp-m-0042",
  "sp-m-0043",
  "sp-m-0044",
  "sp-m-0045",
  "sp-m-0046",
  "sp-m-0047",
  "sp-m-0048",
  "sp-m-0049",
  "sp-m-0050",
  "sp-m-0051",
  "sp-m-0052",
  "sp-m-0053",
  "sp-m-0054",
  "sp-m-0055",
  "sp-m-0056",
  "sp-m-0057",
  "sp-m-0058",
  "sp-m-0059",
  "sp-m-0060",
  "sp-m-0061",
  "sp-m-0062",
  "sp-m-0063",
  "sp-m-0064",
  "sp-m-0065",
  "sp-m-0069",
  "sp-m-0070",
  "sp-m-0071",
  "sp-m-0072",
  "sp-m-0073",
  "sp-m-0074",
  "sp-m-0075",
  "sp-m-0076",
  "sp-m-0077",
  "sp-m-0078",
  "sp-m-0079",
  "sp-m-0082",
  "sp-m-0083",
  "sp-m-0084",
  "sp-rw-0013",
  "sp-rw-0014",
  "sp-rw-0015",
  "sp-rw-0016",
  "sp-rw-0017",
  "sp-rw-0018",
  "sp-rw-0019",
  "sp-rw-0020"
];
