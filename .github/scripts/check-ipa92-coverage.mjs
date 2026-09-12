import fs from 'node:fs';

const path = '.github/ipa92-coverage.json';
const raw = fs.readFileSync(path, 'utf8');
const data = JSON.parse(raw);

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

if (data.schema_version !== 1) errors.push('schema_version must be 1');
if (data.phase_id !== 'ipa-fe-9.2-complete-coverage') errors.push('unexpected phase_id');
if (data.syllabus?.version !== '9.2') errors.push('syllabus.version must be 9.2');
if (!Array.isArray(data.items) || data.items.length === 0) errors.push('items must be a non-empty array');

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

console.log(`IPA 9.2 coverage manifest: ${data.items?.length ?? 0} tracked items`);
for (const [status, count] of [...counts.entries()].sort()) {
  console.log(`  ${status}: ${count}`);
}
console.log(`  inventory_complete: ${data.inventory_complete}`);
console.log(`  last_updated: ${data.last_updated}`);

if (errors.length) {
  console.error('\nCoverage manifest validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('IPA 9.2 coverage manifest structure: PASS');
