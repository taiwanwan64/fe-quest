# FE QUEST v342 — Sync integration boundary discovery

Result: **PASS — EXACT LOCAL COMMIT BOUNDARY CAPTURED BEFORE PRODUCTION SYNC HOOK**

## Priority function inventory

- `saveProfile`: 1921 bytes / `5d68a923f8ed`
- `persistProfileSilently`: 1101 bytes / `bbd3b5948f47`
- `stampProfileForSave`: 316 bytes / `8a22526a0615`
- `writeCurrentProfile`: 97 bytes / `1d91cdfbdc76`
- `atomicProfileEnvelope`: 73 bytes / `e9f87fca807a`
- `decodeAtomicProfileEnvelope`: 1095 bytes / `6f73f2a684b4`
- `rememberCommittedProfile`: 325 bytes / `8d0a737b9498`
- `restoreCommittedProfileInMemory`: 371 bytes / `e55009d21901`
- `assertNoExternalProfileConflict`: 333 bytes / `10e84daa0afe`
- `acquireProfileWriteLease`: 435 bytes / `267fea5ef434`
- `releaseProfileWriteLease`: 158 bytes / `f16abbaf04e3`
- `queueRecoveryCheckpoint`: 420 bytes / `d9055eb860c3`
- `validRawWithChecksum`: 671 bytes / `21d886ce6e26`

## Runtime observation

```json
{
  "before": {
    "meta": {
      "createdAt": "2026-08-22T04:28:40.382Z",
      "updatedAt": "2026-08-22T04:28:41.073Z",
      "lastAppVersion": "v341",
      "migratedFromSchema": null,
      "revision": 3,
      "lastWriterId": "751ea97c-f333-4560-8f9c-b60b7b23908e"
    },
    "storage": [
      {
        "key": "fequest_profile_atomic_v1",
        "bytes": 239818,
        "json": {
          "keys": [
            "appVersion",
            "checksum",
            "format",
            "profile",
            "profileSchemaVersion",
            "revision",
            "savedAt",
            "writerId"
          ],
          "schema": 5,
          "revision": 3,
          "writer": null,
          "hasChecksum": true,
          "checksum": "fnv1a32:0e200c72",
          "payloadKeys": null,
          "payloadRevision": null,
          "payloadWriter": null
        }
      },
      {
        "key": "fequest_profile_checksum_v1",
        "bytes": 16,
        "json": null
      },
      {
        "key": "fequest_profile_last_good_checksum_v1",
        "bytes": 16,
        "json": null
      },
      {
        "key": "fequest_profile_last_good_v1",
        "bytes": 229325,
        "json": {
          "keys": [
            "activity",
            "bCompoundHistory",
            "bCompoundStats",
            "bFinalHistory",
            "bFinalMistakeStats",
            "bFinalStats",
            "bMockHistory",
            "bMockStats",
            "bProgress",
            "chapterMastery",
            "dailyPlans",
            "diagnosticCompleted",
            "diagnosticScores",
            "lastStudyDate",
            "lessonProgress",
            "masteryHistory",
            "mockHistory",
            "mockMistakeStats",
            "mockQuestionStats",
            "profileMeta",
            "profileSchemaVersion",
            "qStats",
            "reviewJourney",
            "reviewJourneys",
            "securityBProgress",
            "securityMockHistory",
            "securityMockStats",
            "sessions",
            "settings",
            "skills",
            "streak",
            "techniqueStats",
            "xp"
          ],
          "schema": 5,
          "revision": 2,
          "writer": "751ea97c-f333-4560-8f9c-b60b7b23908e",
          "hasChecksum": false,
          "checksum": null,
          "payloadKeys": null,
          "payloadRevision": null,
          "payloadWriter": null
        }
      },
      {
        "key": "fequest_profile_v4",
        "bytes": 239594,
        "json": {
          "keys": [
            "activity",
            "bCompoundHistory",
            "bCompoundStats",
            "bFinalHistory",
            "bFinalMistakeStats",
            "bFinalStats",
            "bMockHistory",
            "bMockStats",
            "bProgress",
            "chapterMastery",
            "dailyPlans",
            "diagnosticCompleted",
            "diagnosticScores",
            "lastStudyDate",
            "lessonProgress",
            "masteryHistory",
            "mockHistory",
            "mockMistakeStats",
            "mockQuestionStats",
            "profileMeta",
            "profileSchemaVersion",
            "qStats",
            "reviewJourney",
            "reviewJourneys",
            "securityBProgress",
            "securityMockHistory",
            "securityMockStats",
            "sessions",
            "settings",
            "skills",
            "streak",
            "techniqueStats",
            "xp"
          ],
          "schema": 5,
          "revision": 3,
          "writer": "751ea97c-f333-4560-8f9c-b60b7b23908e",
          "hasChecksum": false,
          "checksum": null,
          "payloadKeys": null,
          "payloadRevision": null,
          "payloadWriter": null
        }
      }
    ]
  },
  "envelope": {
    "ok": true,
    "value": {
      "keys": [
        "appVersion",
        "checksum",
        "format",
        "profile",
        "profileSchemaVersion",
        "revision",
        "savedAt",
        "writerId"
      ],
      "revision": 3,
      "lastWriterId": null,
      "checksum": "fnv1a32:0e200c72",
      "payloadSchema": null,
      "payloadRevision": null,
      "payloadUpdatedAt": null,
      "payloadWriterId": null,
      "serializedBytes": 239818
    }
  },
  "writeDescriptor": {
    "ok": true,
    "value": {
      "keys": [
        "appVersion",
        "checksum",
        "format",
        "profile",
        "profileSchemaVersion",
        "revision",
        "savedAt",
        "writerId"
      ],
      "revision": 3,
      "lastWriterId": null,
      "checksum": "fnv1a32:0e200c72",
      "payloadSchema": null,
      "payloadRevision": null,
      "payloadUpdatedAt": null,
      "payloadWriterId": null,
      "serializedBytes": 239818
    }
  },
  "saveResult": {
    "ok": true,
    "value": true
  },
  "after": {
    "meta": {
      "createdAt": "2026-08-22T04:28:40.382Z",
      "updatedAt": "2026-08-22T04:28:41.353Z",
      "lastAppVersion": "v341",
      "migratedFromSchema": null,
      "revision": 4,
      "lastWriterId": "751ea97c-f333-4560-8f9c-b60b7b23908e"
    },
    "storage": [
      {
        "key": "fequest_profile_atomic_v1",
        "bytes": 239818,
        "json": {
          "keys": [
            "appVersion",
            "checksum",
            "format",
            "profile",
            "profileSchemaVersion",
            "revision",
            "savedAt",
            "writerId"
          ],
          "schema": 5,
          "revision": 4,
          "writer": null,
          "hasChecksum": true,
          "checksum": "fnv1a32:ca42f8da",
          "payloadKeys": null,
          "payloadRevision": null,
          "payloadWriter": null
        }
      },
      {
        "key": "fequest_profile_checksum_v1",
        "bytes": 16,
        "json": null
      },
      {
        "key": "fequest_profile_last_good_checksum_v1",
        "bytes": 16,
        "json": null
      },
      {
        "key": "fequest_profile_last_good_v1",
        "bytes": 239594,
        "json": {
          "keys": [
            "activity",
            "bCompoundHistory",
            "bCompoundStats",
            "bFinalHistory",
            "bFinalMistakeStats",
            "bFinalStats",
            "bMockHistory",
            "bMockStats",
            "bProgress",
            "chapterMastery",
            "dailyPlans",
            "diagnosticCompleted",
            "diagnosticScores",
            "lastStudyDate",
            "lessonProgress",
            "masteryHistory",
            "mockHistory",
            "mockMistakeStats",
            "mockQuestionStats",
            "profileMeta",
            "profileSchemaVersion",
            "qStats",
            "reviewJourney",
            "reviewJourneys",
            "securityBProgress",
            "securityMockHistory",
            "securityMockStats",
            "sessions",
            "settings",
            "skills",
            "streak",
            "techniqueStats",
            "xp"
          ],
          "schema": 5,
          "revision": 3,
          "writer": "751ea97c-f333-4560-8f9c-b60b7b23908e",
          "hasChecksum": false,
          "checksum": null,
          "payloadKeys": null,
          "payloadRevision": null,
          "payloadWriter": null
        }
      },
      {
        "key": "fequest_profile_v4",
        "bytes": 239594,
        "json": {
          "keys": [
            "activity",
            "bCompoundHistory",
            "bCompoundStats",
            "bFinalHistory",
            "bFinalMistakeStats",
            "bFinalStats",
            "bMockHistory",
            "bMockStats",
            "bProgress",
            "chapterMastery",
            "dailyPlans",
            "diagnosticCompleted",
            "diagnosticScores",
            "lastStudyDate",
            "lessonProgress",
            "masteryHistory",
            "mockHistory",
            "mockMistakeStats",
            "mockQuestionStats",
            "profileMeta",
            "profileSchemaVersion",
            "qStats",
            "reviewJourney",
            "reviewJourneys",
            "securityBProgress",
            "securityMockHistory",
            "securityMockStats",
            "sessions",
            "settings",
            "skills",
            "streak",
            "techniqueStats",
            "xp"
          ],
          "schema": 5,
          "revision": 4,
          "writer": "751ea97c-f333-4560-8f9c-b60b7b23908e",
          "hasChecksum": false,
          "checksum": null,
          "payloadKeys": null,
          "payloadRevision": null,
          "payloadWriter": null
        }
      }
    ]
  },
  "committed": {
    "ok": true,
    "value": null
  }
}
```

The next integration slice must derive its cloud descriptor from the already-committed atomic envelope/profile state rather than inventing a second revision or checksum scheme. No production cloud script is loaded by this discovery.
