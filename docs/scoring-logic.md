# Marian Best Class — Authoritative Scoring & Moderation Logic

This document defines the official, authoritative formula for calculating Class Scores, Class Moderation, and the normalized Class Index Mark ($M$) used to rank batches in the Marian Best Class Competition.

---

## 1. Core Variables

| Symbol | Definition | Source |
| :--- | :--- | :--- |
| **$S$** | **Gross Evaluated Marks**: Sum of verified marks across all 13 evaluation criteria categories for approved/locked entries | Database (`Submission.marks` sum) |
| **$P$** | **Class Penalty Points**: Negative points assessed for disciplinary violations, late submissions, or policy non-compliance | Database (`Class.negative_points`) |
| **$N$** | **Class Size (Strength)**: Total number of enrolled students in the class | Database (`Class.num_students`) |
| **$n$** | **Benchmark Minimum Class Size**: Smallest class size across competing batches (default: 20 or 30) | System Settings (`smallest_class_size`) |
| **$\text{Mod}$** | **Class Strength Moderation Mark**: Proportional compensation for managing larger cohorts | Calculated (Range: $0$ to $200$) |
| **$\text{Total Score}$** | **Net Moderated Score**: Net score combined with class moderation | Calculated |
| **$M$** | **Class Index Mark**: Final normalized metric used for institutional ranking | Calculated |

---

## 2. The 4-Step Authoritative Formula

### Step 1: Net Obtained Score
$$\text{Net Score} = S - P$$
Calculates the raw marks earned by the class minus any assessed disciplinary or procedural penalties.

### Step 2: Class Strength Moderation Mark
$$\text{Mod} = \min\left(200.0, \max\left(0.0, 2.0 \times (N - n)\right)\right)$$
- **Range**: strictly bounded between **$0$ and $200$ marks**.
- **Benchmark class ($N \le n$)**: receives exactly **$0$ moderation marks**.
- **Larger classes ($N > n$)**: receive an incremental moderation allowance of **$2.0$ marks per student above $n$**, capped at **$200.0$ marks**.
- **Fairness Guarantee**: Moderation provides a modest, controlled incentive for large class coordination without creating runaway multipliers.

### Step 3: Total Score
$$\text{Total Score} = \max\left(0.0, \text{Net Score} + \text{Mod}\right)$$
Ensures total score cannot fall below zero.

### Step 4: Class Index Mark ($M$)
$$M = \frac{\text{Total Score}}{N} = \frac{\max\left(0.0, (S - P) + \text{Mod}\right)}{N}$$
The Class Index Mark is the per-capita normalized metric. All official rankings, leaderboards, and awards are determined by sorting classes by $M$ in descending order.

---

## 3. Mathematical Validation & Invariance Across Class Sizes

A fair normalization system must ensure that cohorts with **identical per-student performance** achieve **approximately equal index marks**, regardless of whether the class has 20 or 120 students.

### Benchmark Scenario
- Benchmark minimum class size: $n = 20$
- Per-student average performance: $15.0$ marks/student
- Penalty points: $P = 0$

| Class | Class Size ($N$) | Gross Marks ($S$) | Moderation ($\text{Mod}$) | Total Score | Class Index ($M$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Class A** | 20 | 300 | $2 \times (20 - 20) = \mathbf{0}$ | 300 | $\frac{300}{20} = \mathbf{15.00}$ |
| **Class B** | 40 | 600 | $2 \times (40 - 20) = \mathbf{40}$ | 640 | $\frac{640}{40} = \mathbf{16.00}$ |
| **Class C** | 80 | 1200 | $2 \times (80 - 20) = \mathbf{120}$ | 1320 | $\frac{1320}{80} = \mathbf{16.50}$ |
| **Class D** | 120 | 1800 | $\min(200, 2 \times (120 - 20)) = \mathbf{200}$ | 2000 | $\frac{2000}{120} = \mathbf{16.67}$ |

### Validation Conclusion
- **Consistency**: Across all 4 class sizes (from small 20-student batches to large 120-student batches), the index remains closely clustered between **$15.00$ and $16.67$**.
- **No runaway distortion**: Replaces legacy erroneous expressions like `(1 + 100 * (N - n))` which produced multipliers of 2000x+, inflating indices by orders of magnitude.
- **Fair incentive**: Larger cohorts receive a realistic, bounded coordination bonus ($\le 1.67$ index points) to compensate for cohort management complexity.

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