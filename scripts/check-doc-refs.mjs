// SPDX-FileCopyrightText: 2026 Bastian Rang and contributors
// SPDX-License-Identifier: Apache-2.0

// Verifies the §-references into docs/architecture.md across the whole repository.
//
// docs/architecture.md is the single source of truth for the architecture (arc42, twelve
// chapters), and it is cited from code comments and other docs as a one-line §-reference.
// Nothing else in CI notices when such a reference goes stale: `ci.yml` deliberately skips
// documentation changes (`paths-ignore`), so a renumbered chapter would silently invalidate
// every pointer at it. This script closes that gap. It runs from headers.yml, which has no
// paths-ignore and therefore fires on every change.
//
// Checked: every §N cited alongside a mention of the architecture doc resolves to a heading
// that actually exists in it.
//
// Usage: node scripts/check-doc-refs.mjs

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const DOC = 'docs/architecture.md';

// Excluded, each for a stated reason — mirroring how check-spdx-headers.mjs keeps its
// exclusions justified in place.
const EXCLUDED = [
  // Release history: a record of what was written at the time, not a live reference.
  (p) => p === 'CHANGELOG.md',
  // This script's own documentation of the check.
  (p) => p === 'scripts/check-doc-refs.mjs',
];

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((p) => !EXCLUDED.some((skip) => skip(p)));

/** The §-numbers the architecture doc actually defines, e.g. "8.4". */
function definedSections() {
  const sections = new Set();
  for (const line of readFileSync(DOC, 'utf8').split('\n')) {
    const m = /^#{2,5}\s+(\d+(?:\.\d+)*)\.?\s+\S/.exec(line);
    if (m) {
      sections.add(m[1]);
      // A chapter reference such as §8 is valid even when only §8.1 has a heading.
      const parts = m[1].split('.');
      for (let i = 1; i < parts.length; i++) sections.add(parts.slice(0, i).join('.'));
    }
  }
  return sections;
}

const defined = definedSections();
const problems = [];

for (const path of tracked) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    continue; // unreadable or binary — nothing to check
  }
  for (const [i, line] of text.split('\n').entries()) {
    // Only lines that name the architecture doc are checked — by filename, or by the
    // "architecture §8.4" / "the architecture doc" shorthand the source comments use.
    const namesDoc = /architecture\.md|\b[Aa]rchitecture §|architecture doc/.test(line);
    if (!namesDoc) continue;
    for (const m of line.matchAll(/§\s?(\d+(?:\.\d+)*)/g)) {
      if (!defined.has(m[1])) {
        problems.push(`${path}:${i + 1}: §${m[1]} is not a chapter of ${DOC}`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`Stale references into ${DOC}:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    `\n${problems.length} problem(s). Fix the reference, or add the chapter to ${DOC}.`,
  );
  process.exit(1);
}

console.log(`All §-references into ${DOC} resolve.`);
