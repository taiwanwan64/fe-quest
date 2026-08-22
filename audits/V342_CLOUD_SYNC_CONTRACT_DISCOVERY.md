# FE QUEST v342 — Cloud sync contract discovery

Result: **PASS — CURRENT LOCAL-FIRST WRITE/RECOVERY CONTRACT INVENTORIED BEFORE CLOUD CODE**

```json
{
  "schema": 5,
  "profileMeta": {
    "createdAt": "2026-08-22T03:48:34.364Z",
    "updatedAt": "2026-08-22T03:48:34.669Z",
    "lastAppVersion": "v341",
    "migratedFromSchema": null,
    "revision": 3,
    "lastWriterId": "bd4343c1-92c7-4ed3-bf9f-058ca32354df"
  },
  "profileJsonBytesAtFreshBoot": 239594,
  "profileKeyCount": 33,
  "settingsKeys": [
    "autoPace",
    "examDate",
    "studyMinutes",
    "variantReview"
  ],
  "persistenceFunctions": 87,
  "metadataOwnershipMatrix": [
    {
      "function": "acquireProfileWriteLease",
      "tokens": [
        "acquireProfileWriteLease"
      ]
    },
    {
      "function": "assertNoExternalProfileConflict",
      "tokens": [
        "revision"
      ]
    },
    {
      "function": "atomicProfileEnvelope",
      "tokens": [
        "revision"
      ]
    },
    {
      "function": "beginMigrationJournal",
      "tokens": [
        "checksum"
      ]
    },
    {
      "function": "decodeAtomicProfileEnvelope",
      "tokens": [
        "revision",
        "lastWriterId",
        "profileSchemaVersion",
        "checksum"
      ]
    },
    {
      "function": "decodeBackupPayload",
      "tokens": [
        "profileSchemaVersion",
        "checksum"
      ]
    },
    {
      "function": "exportRecoveryDiagnostics",
      "tokens": [
        "revision",
        "profileSchemaVersion"
      ]
    },
    {
      "function": "feqPersistenceSafetyChecks",
      "tokens": [
        "revision",
        "updatedAt",
        "profileSchemaVersion",
        "checksum",
        "writeCurrentProfile",
        "acquireProfileWriteLease"
      ]
    },
    {
      "function": "importLearningDataFile",
      "tokens": [
        "writeCurrentProfile",
        "queueRecoveryCheckpoint"
      ]
    },
    {
      "function": "loadProfile",
      "tokens": [
        "revision",
        "checksum",
        "writeCurrentProfile"
      ]
    },
    {
      "function": "makeBackupPayload",
      "tokens": [
        "profileSchemaVersion",
        "checksum"
      ]
    },
    {
      "function": "migrateProfileData",
      "tokens": [
        "revision",
        "lastWriterId",
        "profileSchemaVersion"
      ]
    },
    {
      "function": "normalizeProfileData",
      "tokens": [
        "revision",
        "lastWriterId",
        "profileSchemaVersion"
      ]
    },
    {
      "function": "normalizeProfileDataV3ForChecksum",
      "tokens": [
        "profileSchemaVersion"
      ]
    },
    {
      "function": "normalizeProfileDataV4ForChecksum",
      "tokens": [
        "updatedAt",
        "profileSchemaVersion"
      ]
    },
    {
      "function": "performLearningDataResetV333",
      "tokens": [
        "checksum",
        "writeCurrentProfile",
        "acquireProfileWriteLease",
        "queueRecoveryCheckpoint"
      ]
    },
    {
      "function": "persistProfileSilently",
      "tokens": [
        "writeCurrentProfile",
        "acquireProfileWriteLease",
        "queueRecoveryCheckpoint"
      ]
    },
    {
      "function": "preservePreviousProfileIfValid",
      "tokens": [
        "checksum"
      ]
    },
    {
      "function": "profileSchemaNumber",
      "tokens": [
        "profileSchemaVersion"
      ]
    },
    {
      "function": "queueRecoveryCheckpoint",
      "tokens": [
        "queueRecoveryCheckpoint"
      ]
    },
    {
      "function": "recoverInterruptedMigrationIfNeeded",
      "tokens": [
        "checksum"
      ]
    },
    {
      "function": "recoveryCandidates",
      "tokens": [
        "updatedAt"
      ]
    },
    {
      "function": "rememberCommittedProfile",
      "tokens": [
        "revision"
      ]
    },
    {
      "function": "repairAtomicEnvelopeExact",
      "tokens": [
        "revision",
        "lastWriterId"
      ]
    },
    {
      "function": "resetLearningProfileCandidateV333",
      "tokens": [
        "revision",
        "updatedAt",
        "lastWriterId"
      ]
    },
    {
      "function": "restoreCommittedProfileInMemory",
      "tokens": [
        "revision"
      ]
    },
    {
      "function": "restorePreImportProfile",
      "tokens": [
        "writeCurrentProfile",
        "queueRecoveryCheckpoint"
      ]
    },
    {
      "function": "restorePreManualProfile",
      "tokens": [
        "writeCurrentProfile",
        "acquireProfileWriteLease"
      ]
    },
    {
      "function": "restoreRecoveryCandidate",
      "tokens": [
        "writeCurrentProfile",
        "acquireProfileWriteLease"
      ]
    },
    {
      "function": "revalidateProfileFreshness",
      "tokens": [
        "revision",
        "checksum"
      ]
    },
    {
      "function": "saveProfile",
      "tokens": [
        "writeCurrentProfile",
        "acquireProfileWriteLease",
        "queueRecoveryCheckpoint"
      ]
    },
    {
      "function": "stampProfileForSave",
      "tokens": [
        "updatedAt"
      ]
    },
    {
      "function": "storeValidProfileSnapshot",
      "tokens": [
        "writeCurrentProfile"
      ]
    },
    {
      "function": "validRawWithChecksum",
      "tokens": [
        "checksum"
      ]
    },
    {
      "function": "writeCurrentProfile",
      "tokens": [
        "writeCurrentProfile"
      ]
    },
    {
      "function": "writeRecoveryCheckpoint",
      "tokens": [
        "profileSchemaVersion"
      ]
    }
  ],
  "literalStorageKeys": 2,
  "indexedDBNames": [],
  "writeBoundaryEvidence": {
    "saveProfileCallsWriteCurrentProfile": true,
    "saveProfileUsesWriteLease": true,
    "saveProfileQueuesRecoveryCheckpoint": true,
    "stampProfileTouchesRevision": false,
    "stampProfileTouchesUpdatedAt": true,
    "stampProfileTouchesLastWriterId": false,
    "writeCurrentProfileMentionsChecksum": false
  },
  "networkTokens": {
    "fetch(": 0,
    "WebSocket": 0,
    "EventSource": 0,
    "supabase": 0,
    "firebase": 0,
    "cloudSync": 0,
    "remoteSync": 0
  },
  "splitReleaseTooling": {
    "rootIndexIsSplitInclude": true,
    "materializerReadsRootIndex": true,
    "materializerRequiresInlinePreviousTitle": true,
    "materializerRequiresStableMetadataInclude": true,
    "validatorReadsBuiltInlineScript": true,
    "needsSplitAwareReleaseToolingBeforeV342Materialization": true
  }
}
```

## Decision

Cloud code must not be inserted inside the atomic local write before persistence succeeds. The safe first integration point is an asynchronous/outbox-style hook after a successful local commit, with revision metadata carried to the remote record. Authentication and provider failures must therefore be non-blocking for normal study.

The fresh profile JSON byte count is recorded because a one-record-per-user backend must leave ample headroom as question history grows. Provider selection should prefer a variable-schema JSON payload without forcing FE QUEST to shard its 33-key profile model prematurely.

The v341 distribution cutover also means the old stable release materializer still assumes an inline root template. v342 must make release tooling split-aware before attempting a conventional v342 materialization; this is a developer-release concern, not a learner data regression.

Detailed source/function snapshots are stored in `audits/V342_CLOUD_SYNC_CONTRACT_DISCOVERY.json`.
