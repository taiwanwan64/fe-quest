# Pages current-provider surface audit — 2026-09-23

## Scope

After the public static protected-content audit in v436, this audit reviews whether historical protected-content provider JavaScript bundles still need to be shipped by the current GitHub Pages application and service-worker precache.

## Current runtime path

The current browser path is:

1. `index.html` loads the base `protected-content-provider-v376.js`.
2. `cloud/public-config-v342.js` activates the latest `protected-content-provider-v376-v35.js`.
3. v35 reads the required metadata catalog generations directly. It does not import historical provider JavaScript files.

No current runtime reference from `index.html`, the activation layer, or the v35 provider requires provider JS v7 through v34.

## Finding

The service worker still precached 28 historical provider JavaScript files, v7 through v34. The Pages rsync boundary also published those files because the repository was copied broadly.

Those 28 files total about 527 KB in the current repository tree.

The historical metadata catalogs are different: the latest provider still composes the active metadata set from catalog generations, so those catalog files remain in the Pages artifact and service-worker shell.

## v437 change

v437 narrows the deployed provider surface without deleting repository history:

- keep the base provider in Pages and the service-worker shell
- keep the latest v35 provider in Pages and the service-worker shell
- exclude provider JS v7–v34 from the Pages artifact
- remove provider JS v7–v34 from the service-worker precache
- keep historical provider source files in the GitHub repository for traceability
- add publication/deploy checks that v7–v34 are absent from the Pages artifact and service-worker shell

This reduces the current browser/offline surface while avoiding unnecessary source deletion.

## Non-changes

- question catalogs remain available because the latest provider still uses their metadata
- protected lesson/provider bridges are unchanged
- protected question bank is unchanged
- profile schema remains 9
- grading, question selection, history and recovery behavior are unchanged
- active protected question total remains 1180
- Subject-B final algorithm pool remains 50

## Release contract

- target PWA cache: `fe-quest-v377-119`
