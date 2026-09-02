# V357 Memory Hierarchy Diagram Audit

Status: **IMPLEMENTED — CI REQUIRED BEFORE MERGE**

## Learner need

The `core_04_03` lesson explains that registers, cache, main memory, and secondary storage differ in speed and capacity. A list or comparison table alone makes it harder to see that these devices form a hierarchy rather than four unrelated definitions.

## V357 change

- Add one static inline figure to `さまざまな記憶装置`.
- Arrange the hierarchy from register to cache, main memory, then SSD/HDD secondary storage.
- Increase tier width toward the bottom to express increasing capacity.
- Place speed and capacity axes beside the tiers on desktop.
- Replace the side axes with compact top/bottom trend labels on narrow screens.
- State that the direction is a general tendency and avoid inventing exact performance or capacity values.

## Safety boundary

- No question-bank change.
- No curriculum prose replacement.
- No progress or lesson-completion interaction.
- No profile schema, save/recovery, adaptive-plan, or cloud-runtime change.
- Existing v356 assets remain immutable.

## Required evidence

- Static v356 → v357 exact-diff contract passes.
- Four hierarchy tiers appear once and only in `core_04_03`.
- Tier widths increase monotonically from register to secondary storage.
- Desktop Chromium shows both side axes; mobile WebKit shows compact trend labels.
- No figure, tier, or document horizontal overflow.
- No asset-recovery UI or uncaught page error.
