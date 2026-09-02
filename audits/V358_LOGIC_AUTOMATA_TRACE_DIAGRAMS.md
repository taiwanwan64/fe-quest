# V358 Logic and Automata Trace Diagrams Audit

Status: **IMPLEMENTED — CI REQUIRED BEFORE MERGE**

## Learner need

Logic-circuit and automata questions are both solved by carrying an intermediate value forward. Definitions alone do not make the update process visible, and learners can incorrectly jump straight to the final answer.

## V358 change

### Logic circuit (`core_02_02`)

- Trace `A=1`, `B=0` through `(A OR B) AND (NOT B)`.
- Show `x=1` and `y=1` before the final AND gate.
- Repeat the calculation in three numbered steps.

### Automata (`core_02_04`)

- Show the two-state transition rules for inputs 0 and 1.
- Apply input sequence `1 → 0 → 1` one symbol at a time.
- Display the state trace `A → B → B → A` and final state A.

## Responsive design

- Desktop logic flow uses five columns; narrow screens stack the stages vertically.
- Desktop automata trace uses four state columns; narrow screens use a vertical trace.
- Arrow direction changes with the layout.

## Safety boundary

- Static explanatory figures only; no required interaction.
- No question-bank or existing curriculum-prose change.
- No profile schema, progress, adaptive-plan, save/recovery, or cloud-runtime change.
- Existing v357 assets remain immutable.

## Required evidence

- Static v357 → v358 exact-diff contract passes.
- Each figure appears once and only in its matching lesson.
- Intermediate logic values and automata state order match the stated rules.
- Desktop Chromium and mobile WebKit layouts pass without horizontal overflow.
- No asset-recovery UI or uncaught page error.
