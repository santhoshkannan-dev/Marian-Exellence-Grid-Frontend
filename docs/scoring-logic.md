# Marian Best Class — Authoritative Scoring & Moderation Logic

This document defines the official, authoritative formula for calculating Class Scores, Class Moderation, and the normalized Class Index Mark ($M$) used to rank batches in the Marian Best Class Competition.

---

## 1. Core Variables

| Symbol | Definition | Source |
| :--- | :--- | :--- |
| **$S$** | **Evaluated Marks**: Sum of verified marks across all 13 evaluation criteria categories for approved/locked entries | Database (`Submission.marks` sum) |
| **$P$** | **Penalties**: Negative points assessed for disciplinary violations or policy non-compliance | Department Management (`Class.negative_points`) |
| **$N$** | **Class Size (Strength)**: Total number of enrolled students in the class | Department Management (`Class.num_students`) |
| **$n$** | **Smallest Class Benchmark**: Benchmark smallest class size across competing batches (default: $0$) | Department Management / System Settings (`smallest_class_size`) |
| **$M$** | **Class Index Mark**: Final normalized metric used for institutional ranking | Calculated |

---

## 2. The Authoritative Moderation Formula

$$M = \frac{S - P}{N^2} \times \left(1 + 100 \times (N - n)\right)$$

### Key Components:
1. **Net Obtained Score ($S - P$)**:
   Evaluated marks earned by the class minus any assessed class penalties defined in Department Management.
2. **Cohort Normalization ($N^2$)**:
   The net score is normalized over the square of class size ($N^2$) to provide per-capita baseline scaling.
3. **Benchmark Multiplier ($1 + 100 \times (N - n)$)**:
   Scaled by class cohort size relative to the benchmark $n$ (default $n = 0$).
4. **Final Moderated Class Index ($M$)**:
   All official rankings, leaderboards, and awards are determined by sorting classes by $M$ in descending order.

---

## 3. Mathematical Validation Across Class Sizes

For cohorts with identical per-student average performance ($15.0$ marks/student, $P = 0, n = 0$):

| Class | Class Size ($N$) | Gross Marks ($S$) | Calculation | Class Index ($M$) |
| :--- | :---: | :---: | :--- | :---: |
| **Class A** | 20 | 300 | $\frac{300}{400} \times (1 + 2000) = 0.75 \times 2001$ | **1500.75** |
| **Class B** | 40 | 600 | $\frac{600}{1600} \times (1 + 4000) = 0.375 \times 4001$ | **1500.38** |
| **Class C** | 80 | 1200 | $\frac{1200}{6400} \times (1 + 8000) = 0.1875 \times 8001$ | **1500.19** |
| **Class D** | 120 | 1800 | $\frac{1800}{14400} \times (1 + 12000) = 0.125 \times 12001$ | **1500.13** |

### Validation Conclusion
- **Consistency**: Across cohort sizes from 20 to 120 students, identical per-student performance yields a remarkably tight index (~$1500$), demonstrating cohort normalization with appropriate coordination compensation.

---

## 4. Academic Grade Breakdown & Accounting

In the Academic category (`Sem Result` / `SAVE Sem Result`), every student in the class cohort must be accounted for:

$$\text{Total Students} = \text{S Count} + \text{A+ Count} + \text{A Count} + \text{Other Pass Count} + \text{Fail Count}$$

Where:
- **S Count**: $\ge 90\%$ marks
- **A+ Count**: $80\% - 89.99\%$ marks
- **A Count**: $70\% - 79.99\%$ marks
- **Other Pass Count**: $40\% - 69.99\%$ marks (Grades B, C, D, Pass)
- **Fail Count**: $< 40\%$ marks

### Pass Percentage Calculation
$$\text{Passed Students} = \text{Total Students} - \text{Fail Count}$$
$$\text{Class Pass Percentage} = \frac{\text{Passed Students}}{\text{Total Students}} \times 100\%$$

The backend enforces strict accounting: if the sum of grade counts does not equal `total_students`, submission saving is rejected with a validation error, preventing unaccounted or missing students.