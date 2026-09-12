import fs from 'node:fs';

const coveragePath = '.github/ipa92-coverage.json';
const indexPath = '.github/ipa92-syllabus-small-classifications.json';
const data = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const syllabusIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const errors = [];
const requiredTop = [
  'schema_version',
  'phase_id',
  'phase_status',
  'inventory_state',
  'inventory_complete',
  'last_updated',
  'baseline',
  'syllabus',
  'completion_gate',
  'items'
];
for (const key of requiredTop) {
  if (!(key in data)) errors.push(`missing top-level field: ${key}`);
}

if (data.schema_version !== 1) errors.push('coverage schema_version must be 1');
if (data.phase_id !== 'ipa-fe-9.2-complete-coverage') errors.push('unexpected phase_id');
if (data.syllabus?.version !== '9.2') errors.push('coverage syllabus.version must be 9.2');
if (!Array.isArray(data.items) || data.items.length === 0) errors.push('coverage items must be a non-empty array');

const allowedStatus = new Set(data.status_values ?? []);
const allowedPriority = new Set(data.priority_values ?? []);
const allowedDepth = new Set(['required', 'recommended', 'not-required', 'unknown']);
const ids = new Set();

const counts = new Map();
for (const [index, item] of (data.items ?? []).entries()) {
  const at = `items[${index}]`;
  for (const key of ['id', 'area', 'topic', 'priority', 'status', 'baseline_evidence', 'lesson', 'practice', 'interactive', 'target']) {
    if (!(key in item) || item[key] === '') errors.push(`${at}: missing ${key}`);
  }

  if (ids.has(item.id)) errors.push(`${at}: duplicate id ${item.id}`);
  ids.add(item.id);

  if (!allowedStatus.has(item.status)) errors.push(`${at}: invalid status ${item.status}`);
  if (!allowedPriority.has(item.priority)) errors.push(`${at}: invalid priority ${item.priority}`);
  for (const key of ['lesson', 'practice', 'interactive']) {
    if (!allowedDepth.has(item[key])) errors.push(`${at}: invalid ${key} value ${item[key]}`);
  }

  counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
}

for (const gate of [
  'all_syllabus_items_registered',
  'no_missing',
  'no_thin',
  'no_planned',
  'no_in_progress',
  'all_required_visuals_verified',
  'all_required_practice_verified',
  'history_compatibility_verified'
]) {
  if (typeof data.completion_gate?.[gate] !== 'boolean') {
    errors.push(`completion_gate.${gate} must be boolean`);
  }
}

if (data.inventory_complete === true && data.completion_gate?.all_syllabus_items_registered !== true) {
  errors.push('inventory_complete=true requires all_syllabus_items_registered=true');
}

// The authoritative syllabus-side inventory prevents FE QUEST's existing content
// from accidentally becoming the universe of topics being audited.
if (syllabusIndex.schema_version !== 1) errors.push('syllabus index schema_version must be 1');
if (syllabusIndex.syllabus_version !== '9.2') errors.push('syllabus index version must be 9.2');
if (syllabusIndex.authority !== 'IPA') errors.push('syllabus index authority must be IPA');
if (!Array.isArray(syllabusIndex.middle_categories)) errors.push('syllabus index middle_categories must be an array');

const middleCategories = syllabusIndex.middle_categories ?? [];
if (middleCategories.length !== 23) errors.push(`expected 23 middle categories, got ${middleCategories.length}`);
if (syllabusIndex.middle_category_count !== 23) errors.push('declared middle_category_count must be 23');
if (syllabusIndex.small_classification_count !== 96) errors.push('declared small_classification_count must be 96');

const syllabusIds = new Set();
let actualSmallCount = 0;
for (const [middleIndex, middle] of middleCategories.entries()) {
  const expectedMiddleId = `FE92-M${String(middleIndex + 1).padStart(2, '0')}`;
  if (middle.id !== expectedMiddleId) errors.push(`middle_categories[${middleIndex}]: expected id ${expectedMiddleId}, got ${middle.id}`);
  if (!middle.large_category) errors.push(`${middle.id}: missing large_category`);
  if (!middle.name) errors.push(`${middle.id}: missing name`);
  if (!Array.isArray(middle.small_classifications) || middle.small_classifications.length === 0) {
    errors.push(`${middle.id}: small_classifications must be non-empty`);
    continue;
  }

  if (syllabusIds.has(middle.id)) errors.push(`duplicate syllabus id ${middle.id}`);
  syllabusIds.add(middle.id);

  for (const [smallIndex, small] of middle.small_classifications.entries()) {
    actualSmallCount += 1;
    const expectedSmallId = `${middle.id}-S${String(smallIndex + 1).padStart(2, '0')}`;
    if (small.id !== expectedSmallId) errors.push(`${middle.id} small[${smallIndex}]: expected id ${expectedSmallId}, got ${small.id}`);
    if (!small.name) errors.push(`${small.id}: missing name`);
    if (syllabusIds.has(small.id)) errors.push(`duplicate syllabus id ${small.id}`);
    syllabusIds.add(small.id);
  }
}
if (actualSmallCount !== 96) errors.push(`expected 96 small classifications, got ${actualSmallCount}`);
if (actualSmallCount !== syllabusIndex.small_classification_count) {
  errors.push(`declared small_classification_count ${syllabusIndex.small_classification_count} does not match actual ${actualSmallCount}`);
}
if (syllabusIndex.fine_grained_inventory_complete !== false) {
  errors.push('fine_grained_inventory_complete must remain false until numbered content/term-level inventory is completed');
}

console.log(`IPA 9.2 authoritative index: ${middleCategories.length} middle categories / ${actualSmallCount} small classifications`);
console.log(`IPA 9.2 coverage manifest: ${data.items?.length ?? 0} tracked audit items`);
for (const [status, count] of [...counts.entries()].sort()) {
  console.log(`  ${status}: ${count}`);
}
console.log(`  inventory_complete: ${data.inventory_complete}`);
console.log(`  fine_grained_inventory_complete: ${syllabusIndex.fine_grained_inventory_complete}`);
console.log(`  last_updated: ${data.last_updated}`);

if (errors.length) {
  console.error('\nCoverage/index validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('IPA 9.2 coverage manifest and authoritative small-classification index: PASS');
