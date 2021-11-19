import { Orchestrator } from '@holochain/tryorama';

import { selectMissedDeltas } from '@syn/store';
import { SynState } from '@syn/store/dist/state/syn-state';

const synState = {
  myPubKey: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
  activeSessionHash: 'uhCEkgFZH6hxzxwDD7qoLUWJgiwtbibkCuAsGUGhMUgjUy7_ZWSMW',
  sessions: {
    uhCEkgFZH6hxzxwDD7qoLUWJgiwtbibkCuAsGUGhMUgjUy7_ZWSMW: {
      initialCommitHash:
        'uhCEk8BzYgDJd9D58E3XZVDFX9U8b8vto2s68fdMBapTqrCFv6O6m',
      scribe: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
      createdAt: 1637321571572,
    },
  },
  joinedSessions: {
    uhCEkgFZH6hxzxwDD7qoLUWJgiwtbibkCuAsGUGhMUgjUy7_ZWSMW: {
      lastCommitHash: 'uhCEk3zht4ctyzgsyH-7xIRFZjzXx6OTIOWmM6Ej_nMhm8pn0fyI5',
      sessionHash: 'uhCEkgFZH6hxzxwDD7qoLUWJgiwtbibkCuAsGUGhMUgjUy7_ZWSMW',
      currentContent: {
        text: '777777777775555555555555555yyyyyyyyyyy\n\n\n\n\n\n\n\n\njjjjjjjjjjjjjjjjjjjj888888888888888',
        selections: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            position: 27,
            characterCount: 0,
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            position: 82,
            characterCount: 0,
          },
        },
      },
      myFolkIndex: 334,
      nonEmittedChangeBundle: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 333,
            commitChanges: [15],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 20,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 21,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 22,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 23,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 24,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 25,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 26,
              text: '5',
            },
          },
        ],
      },
      nonEmittedLastDeltaSeen: {
        commitHash: 'uhCEkP48o9trU9la_IR6hPozh2iY6KmI6VIVgVU_YSssDMdUM0R4j',
        deltaIndexInCommit: 9,
      },
      requestedChanges: [],
      nonRequestedChanges: [],
      uncommittedChanges: {
        authors: {},
        deltas: [],
      },
      folks: {
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          lastSeen: 1637321699502,
        },
      },
    },
  },
  joiningSessions: {},
  commits: {
    uhCEkL8Zf57924wOtAS1IWkK__L4m6F05RnHTJ7ltxaVewXbaQBFt: {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 35,
            commitChanges: [25],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 1,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 0,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 1,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 2,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 3,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 4,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 5,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 6,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 7,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 8,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 9,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 10,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 11,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 12,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 13,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 14,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 15,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 16,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 17,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 18,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 19,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 20,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 21,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 22,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 24,
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkaOMRwjfXUG1it082OUKjwPgE-4yP0A_m92ivmTFmQT3hJj9z',
      ],
      createdAt: 1637321368926,
      previousContentHash:
        'uhCEkQ6J3vPMFlY-5tk7RuvWmA9cDQCbud389RYUsmhe5zl37MNHq',
      newContentHash: 'uhCEkXE92ppTaKwrCdepaQAMArbtqegXOCf4X26HLPzCU0Z--G4D8',
      meta: {
        witnesses: [],
        appSpecific: null,
      },
    },
    'uhCEkaOMRwjfXUG1it082OUKjwPgE-4yP0A_m92ivmTFmQT3hJj9z': {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 9,
            commitChanges: [9],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 0,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 1,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 2,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 3,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 4,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 5,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 6,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 7,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 0,
            },
          },
        ],
      },
      previousCommitHashes: [],
      createdAt: 1637321356878,
      previousContentHash:
        'uhCEkjDbEtqON4IFjAVeB_p_WuHZaUp5NabDBOLfmxzu6BEP_YFAp',
      newContentHash: 'uhCEkQ6J3vPMFlY-5tk7RuvWmA9cDQCbud389RYUsmhe5zl37MNHq',
      meta: {
        witnesses: [],
        appSpecific: null,
      },
    },
    'uhCEkI2ndHe-El_-W22BIFzL5KFf56Hieg0L1r9oho-TfYNlfK9Ri': {
      changes: {
        authors: {
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 0,
            commitChanges: [0],
          },
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 2,
            commitChanges: [3],
          },
        },
        deltas: [
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 23,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 23,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 23,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'delete',
              position: 0,
              characterCount: 23,
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkL8Zf57924wOtAS1IWkK__L4m6F05RnHTJ7ltxaVewXbaQBFt',
      ],
      createdAt: 1637321519724,
      previousContentHash:
        'uhCEkXE92ppTaKwrCdepaQAMArbtqegXOCf4X26HLPzCU0Z--G4D8',
      newContentHash: 'uhCEkQ6J3vPMFlY-5tk7RuvWmA9cDQCbud389RYUsmhe5zl37MNHq',
      meta: {
        witnesses: [],
        appSpecific: null,
      },
    },
    uhCEk8BzYgDJd9D58E3XZVDFX9U8b8vto2s68fdMBapTqrCFv6O6m: {
      changes: {
        authors: {
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 2,
            commitChanges: [1],
          },
        },
        deltas: [
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 23,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 31,
              characterCount: 0,
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkI2ndHe-El_-W22BIFzL5KFf56Hieg0L1r9oho-TfYNlfK9Ri',
      ],
      createdAt: 1637321552687,
      previousContentHash:
        'uhCEkQ6J3vPMFlY-5tk7RuvWmA9cDQCbud389RYUsmhe5zl37MNHq',
      newContentHash: 'uhCEkQ6J3vPMFlY-5tk7RuvWmA9cDQCbud389RYUsmhe5zl37MNHq',
      meta: {
        witnesses: [],
        appSpecific: null,
      },
    },
    uhCEkni8_CSBA35WqAJkc6Xx4dn_VkMlaDzO9Li_h35xYg0fZk3NH: {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 4,
            commitChanges: [6],
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 2,
            commitChanges: [7, 8, 9],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 1,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 8,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 8,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 1,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 2,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 3,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 4,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 12,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 13,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 14,
              text: 'j',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEk8BzYgDJd9D58E3XZVDFX9U8b8vto2s68fdMBapTqrCFv6O6m',
      ],
      previousContentHash:
        'uhCEkQ6J3vPMFlY-5tk7RuvWmA9cDQCbud389RYUsmhe5zl37MNHq',
      newContentHash: 'uhCEkG5_b_DiqDR_ow1NRtf04B_KI1zfdtv_Ejf86higrZIs8BzfL',
      createdAt: 1637321583744,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEkw9pM8-UkCR5dZHGq69-eYueP3o5OUerT1GoupnitwIJtxie7': {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 20,
            commitChanges: [15],
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 5,
            commitChanges: [
              16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
            ],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 5,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 6,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 7,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 8,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 9,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 10,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 11,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 12,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 13,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 14,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 15,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 16,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 17,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 18,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 19,
              text: 'k',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 20,
              text: 'k',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 31,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 32,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 33,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 34,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 35,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 36,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 37,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 38,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 39,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 40,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 41,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 42,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 43,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 44,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 45,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 46,
              text: 'l',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkni8_CSBA35WqAJkc6Xx4dn_VkMlaDzO9Li_h35xYg0fZk3NH',
      ],
      previousContentHash:
        'uhCEkG5_b_DiqDR_ow1NRtf04B_KI1zfdtv_Ejf86higrZIs8BzfL',
      newContentHash: 'uhCEks005MLM3fSdAB4GiZDZ-VyKIFAs5HCNfLuFuDnJEZ4U8Mshu',
      createdAt: 1637321591699,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEkkaPp-xpZ4KdPhjTdjjqoJZtp8SrvjA7kf3GVxUqWBooAqmQt': {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 42,
            commitChanges: [21],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 21,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 22,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 23,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 24,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 25,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 26,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 27,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 28,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 29,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 30,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 31,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 32,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 33,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 34,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 35,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 36,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 37,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 38,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 39,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 40,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 41,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 42,
              text: ',',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkw9pM8-UkCR5dZHGq69-eYueP3o5OUerT1GoupnitwIJtxie7',
      ],
      previousContentHash:
        'uhCEks005MLM3fSdAB4GiZDZ-VyKIFAs5HCNfLuFuDnJEZ4U8Mshu',
      newContentHash: 'uhCEkC7PpMWsPezPmgDefVTIC0Xd7ntc-xGyEo7SksgFEUWnP_5V9',
      createdAt: 1637321599700,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    uhCEkK1fBJ80w_sXr8DtOMAF6Ulinne7qV6Ic1PFIDijiWPhc2tTf: {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 125,
            commitChanges: [82],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 43,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 44,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 45,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 46,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 47,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 48,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 49,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 50,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 51,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 52,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 53,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 54,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 55,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 56,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 57,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 58,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 59,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 60,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 61,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 62,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 63,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 64,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 65,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 66,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 67,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 68,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 69,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 70,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 71,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 72,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 73,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 74,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 75,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 76,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 77,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 78,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 79,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 80,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 81,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 82,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 83,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 84,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 85,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 86,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 87,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 88,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 89,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 90,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 91,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 92,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 93,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 94,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 95,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 96,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 97,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 98,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 99,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 100,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 101,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 102,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 103,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 104,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 105,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 106,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 107,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 108,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 109,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 110,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 111,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 112,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 113,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 114,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 115,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 116,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 117,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 118,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 119,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 120,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 121,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 122,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 123,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 124,
              text: ',',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 125,
              text: ',',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkkaPp-xpZ4KdPhjTdjjqoJZtp8SrvjA7kf3GVxUqWBooAqmQt',
      ],
      previousContentHash:
        'uhCEkC7PpMWsPezPmgDefVTIC0Xd7ntc-xGyEo7SksgFEUWnP_5V9',
      newContentHash: 'uhCEkj1YMggpKy8ivlu7uPQnEAJko7GSWpLweUX_J0VvWcOu_vt5L',
      createdAt: 1637321603784,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    uhCEktxga8lddrjDHHh6R3SqkcdPpxncQpC3ceABkqnBnDhAPZGCy: {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 147,
            commitChanges: [21],
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 21,
            commitChanges: [
              22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
              38, 39, 40, 41, 42, 43, 44, 45,
            ],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 126,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 127,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 128,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 129,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 130,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 131,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 132,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 133,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 134,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 135,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 136,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 137,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 138,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 139,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 140,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 141,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 142,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 143,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 144,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 145,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 146,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 147,
              text: 'ñ',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 174,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 175,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 176,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 177,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 178,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 179,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 180,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 181,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 182,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 183,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 184,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 185,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 186,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 187,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 188,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 189,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 190,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 191,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 192,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 193,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 194,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 195,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 196,
              text: '.',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 197,
              text: '.',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkK1fBJ80w_sXr8DtOMAF6Ulinne7qV6Ic1PFIDijiWPhc2tTf',
      ],
      previousContentHash:
        'uhCEkj1YMggpKy8ivlu7uPQnEAJko7GSWpLweUX_J0VvWcOu_vt5L',
      newContentHash: 'uhCEk3Aq0ScXo3HKiQ2H0SIfpYEgxWay5-eZS4zMMW6nhc6L8h1iI',
      createdAt: 1637321611693,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEkxcjTdfOCuF9Lc-WcXWGOVZmoAhyy1LGA8x0s3h7BWvuABbLX': {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 186,
            commitChanges: [57],
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 45,
            commitChanges: [
              38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
              54, 55, 56,
            ],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 148,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 149,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 150,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 151,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 152,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 153,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 154,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 155,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 156,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 157,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 158,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 159,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 160,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 161,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 162,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 163,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 164,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 165,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 166,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 167,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 168,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 169,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 170,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 171,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 172,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 173,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 174,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 175,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 176,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 177,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 178,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 179,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 180,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 181,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 182,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 183,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 184,
              text: 'l',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 185,
              text: 'l',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 236,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 237,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 238,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 239,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 240,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 241,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 242,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 243,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 244,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 245,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 246,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 247,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 248,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 249,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 250,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 251,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 252,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 253,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 254,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 186,
              text: 'l',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEktxga8lddrjDHHh6R3SqkcdPpxncQpC3ceABkqnBnDhAPZGCy',
      ],
      previousContentHash:
        'uhCEk3Aq0ScXo3HKiQ2H0SIfpYEgxWay5-eZS4zMMW6nhc6L8h1iI',
      newContentHash: 'uhCEk2kw7g6w5oSX8esJwqLklc4Oj6Dg4kXosArrojJFv4yohMPmn',
      createdAt: 1637321619700,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEk3CyetA1teyesenqrgp14_g-APqJjayuJ58qLZ6YaQ72krjJI': {
      changes: {
        authors: {
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 64,
            commitChanges: [0, 1, 2, 3, 4],
          },
        },
        deltas: [
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 256,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 257,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 258,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 259,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 260,
              text: 'i',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkxcjTdfOCuF9Lc-WcXWGOVZmoAhyy1LGA8x0s3h7BWvuABbLX',
      ],
      previousContentHash:
        'uhCEk2kw7g6w5oSX8esJwqLklc4Oj6Dg4kXosArrojJFv4yohMPmn',
      newContentHash: 'uhCEkU62C_nFEGsivpVGNIfN5hJfqjDiF-KCJrLL8KGuBE8rkKpya',
      createdAt: 1637321623699,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    uhCEkAMXIEw6ZQjjm_tgLLhntLeXGjsixwYOydxF4ns_uEgoX07Bb: {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 264,
            commitChanges: [77],
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 69,
            commitChanges: [
              78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93,
              94, 95, 96,
            ],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 187,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 188,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 189,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 190,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 191,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 192,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 193,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 194,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 195,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 196,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 197,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 198,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 199,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 200,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 201,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 202,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 203,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 204,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 205,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 206,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 207,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 208,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 209,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 210,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 211,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 212,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 213,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 214,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 215,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 216,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 217,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 218,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 219,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 220,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 221,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 222,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 223,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 224,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 225,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 226,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 227,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 228,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 229,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 230,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 231,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 232,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 233,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 234,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 235,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 236,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 237,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 238,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 239,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 240,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 241,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 242,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 243,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 244,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 245,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 246,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 247,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 248,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 249,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 250,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 251,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 252,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 253,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 254,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 255,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 256,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 257,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 258,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 259,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 260,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 261,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 262,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 263,
              text: 'u',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 264,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 339,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 340,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 341,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 342,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 343,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 344,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 345,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 346,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 347,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 348,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 349,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 350,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 351,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 352,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 353,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 354,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 355,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 356,
              text: 'i',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 357,
              text: 'i',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEk3CyetA1teyesenqrgp14_g-APqJjayuJ58qLZ6YaQ72krjJI',
      ],
      previousContentHash:
        'uhCEkU62C_nFEGsivpVGNIfN5hJfqjDiF-KCJrLL8KGuBE8rkKpya',
      newContentHash: 'uhCEkzW7zLHXeX6HUVjRySvcAP9J9qPcfWU3QoMWyIw3SmskU16V5',
      createdAt: 1637321627681,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    uhCEk1plrFLPN4PH98oSVCiJPPypsbHa6xPDFaQVDzOLcjtKvVIii: {
      changes: {
        authors: {
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 88,
            commitChanges: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
          },
        },
        deltas: [
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 358,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 359,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 360,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 361,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 362,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 363,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 364,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 365,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 366,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 367,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 368,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 369,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 370,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 371,
              text: 'o',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 372,
              text: 'o',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkAMXIEw6ZQjjm_tgLLhntLeXGjsixwYOydxF4ns_uEgoX07Bb',
      ],
      previousContentHash:
        'uhCEkzW7zLHXeX6HUVjRySvcAP9J9qPcfWU3QoMWyIw3SmskU16V5',
      newContentHash: 'uhCEkwAgLEM7W2BA04emxTMcb1Y2HtLhWzRrE3sMiY2BWIMScWv7-',
      createdAt: 1637321631685,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    uhCEkGy2kuGOldXCr7Ci42Evoh8cdnToQwqS3_aVgA4gXOYrFhBBs: {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 267,
            commitChanges: [2],
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 104,
            commitChanges: [4, 5],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 265,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 373,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'delete',
              position: 0,
              characterCount: 373,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 19,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 19,
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEk1plrFLPN4PH98oSVCiJPPypsbHa6xPDFaQVDzOLcjtKvVIii',
      ],
      previousContentHash:
        'uhCEkwAgLEM7W2BA04emxTMcb1Y2HtLhWzRrE3sMiY2BWIMScWv7-',
      newContentHash: 'uhCEkjDbEtqON4IFjAVeB_p_WuHZaUp5NabDBOLfmxzu6BEP_YFAp',
      createdAt: 1637321659720,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEkH44c34nycXX6dZ-ZpeDb3Aoq-CqFWctnNCjkE-4eKtWHE25X': {
      changes: {
        authors: {
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 106,
            commitChanges: [0],
          },
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 277,
            commitChanges: [10],
          },
        },
        deltas: [
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'delete',
              position: 0,
              characterCount: 19,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 0,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 1,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 2,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 3,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 4,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 5,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 6,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 7,
              text: '\n',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 8,
              text: '\n',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkGy2kuGOldXCr7Ci42Evoh8cdnToQwqS3_aVgA4gXOYrFhBBs',
      ],
      previousContentHash:
        'uhCEkjDbEtqON4IFjAVeB_p_WuHZaUp5NabDBOLfmxzu6BEP_YFAp',
      newContentHash: 'uhCEkSxbxgG2-0C_DforKOrep1PiLOQT1DsRnOPfGwZ2fYHRTeBHN',
      createdAt: 1637321671674,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEkyO2up-pwswI4pMH61Gk7AX_wLGVvqPlHeZS9cnplw5mqe_e5': {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 297,
            commitChanges: [19],
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 107,
            commitChanges: [20],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 9,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 10,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 11,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 12,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 13,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 14,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 15,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 16,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 17,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 18,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 19,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 20,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 21,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 22,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 23,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 24,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 25,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 26,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 27,
              text: 'j',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 28,
              text: 'j',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 0,
              text: 'y',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkH44c34nycXX6dZ-ZpeDb3Aoq-CqFWctnNCjkE-4eKtWHE25X',
      ],
      previousContentHash:
        'uhCEkSxbxgG2-0C_DforKOrep1PiLOQT1DsRnOPfGwZ2fYHRTeBHN',
      newContentHash: 'uhCEkOAUBeAcjOMZ1_7g2sj_u935itvH7vgUUngFFMZLMbZkQpWQZ',
      createdAt: 1637321675694,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEkIx9OflxNoOdMICoAjna6oekhXJ8y2-0xHk4qI-GI4hZoA40C': {
      changes: {
        authors: {
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 108,
            commitChanges: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          },
        },
        deltas: [
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 1,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 2,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 3,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 4,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 5,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 6,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 7,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 8,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 9,
              text: 'y',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 10,
              text: 'y',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkyO2up-pwswI4pMH61Gk7AX_wLGVvqPlHeZS9cnplw5mqe_e5',
      ],
      previousContentHash:
        'uhCEkOAUBeAcjOMZ1_7g2sj_u935itvH7vgUUngFFMZLMbZkQpWQZ',
      newContentHash: 'uhCEkvxmNRYkT3BW-7h_fGWCI_jYbvaxv5LwfRUe_XjE19SF6tjDP',
      createdAt: 1637321679678,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEkMdXEwflZyagbmmSyefCTbo6AbCv42-TQxH26ZafbEWLmNDyY': {
      changes: {
        authors: {
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 119,
            commitChanges: [10, 11, 12, 13, 14, 15, 16, 17, 18],
          },
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 307,
            commitChanges: [19],
          },
        },
        deltas: [
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 12,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 19,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 18,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 17,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 16,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 15,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 14,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 13,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 12,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'change_selection',
              position: 0,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 13,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 14,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 15,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 16,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 17,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 18,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 19,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 20,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'change_selection',
              position: 40,
              characterCount: 0,
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 0,
              text: '7',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkIx9OflxNoOdMICoAjna6oekhXJ8y2-0xHk4qI-GI4hZoA40C',
      ],
      previousContentHash:
        'uhCEkvxmNRYkT3BW-7h_fGWCI_jYbvaxv5LwfRUe_XjE19SF6tjDP',
      newContentHash: 'uhCEk1F0vuhhXt2LlMzGWmmhhCuQWxkjpW11N9RgBHq43-7qePHXW',
      createdAt: 1637321687685,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    uhCEkP48o9trU9la_IR6hPozh2iY6KmI6VIVgVU_YSssDMdUM0R4j: {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 317,
            commitChanges: [9],
          },
          uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
            atFolkIndex: 128,
            commitChanges: [
              10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            ],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 1,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 2,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 3,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 4,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 5,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 6,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 7,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 8,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 9,
              text: '7',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 10,
              text: '7',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 51,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 52,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 53,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 54,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 55,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 56,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 57,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 58,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 59,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 60,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 61,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 62,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 63,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 64,
              text: '8',
            },
          },
          {
            author: 'uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG',
            delta: {
              type: 'insert',
              position: 65,
              text: '8',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkMdXEwflZyagbmmSyefCTbo6AbCv42-TQxH26ZafbEWLmNDyY',
      ],
      previousContentHash:
        'uhCEk1F0vuhhXt2LlMzGWmmhhCuQWxkjpW11N9RgBHq43-7qePHXW',
      newContentHash: 'uhCEk0TVvowiMiUmWvuW1Shl7Q5YiSS84fQF-fhKbxrou0Dqd8Je8',
      createdAt: 1637321691684,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
    'uhCEk3zht4ctyzgsyH-7xIRFZjzXx6OTIOWmM6Ej_nMhm8pn0fyI5': {
      changes: {
        authors: {
          'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
            atFolkIndex: 333,
            commitChanges: [15],
          },
        },
        deltas: [
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 11,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 12,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 13,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 14,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 15,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 16,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 17,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 18,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 19,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 20,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 21,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 22,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 23,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 24,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 25,
              text: '5',
            },
          },
          {
            author: 'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD',
            delta: {
              type: 'insert',
              position: 26,
              text: '5',
            },
          },
        ],
      },
      previousCommitHashes: [
        'uhCEkP48o9trU9la_IR6hPozh2iY6KmI6VIVgVU_YSssDMdUM0R4j',
      ],
      previousContentHash:
        'uhCEk0TVvowiMiUmWvuW1Shl7Q5YiSS84fQF-fhKbxrou0Dqd8Je8',
      newContentHash: 'uhCEkLZ8LcP_9i2WnN9ulplGWEhX9hxiJ3GcOd_FqdP-K8iocfWtd',
      createdAt: 1637321695918,
      meta: {
        appSpecific: null,
        witnesses: [],
      },
    },
  },
  snapshots: {
    'uhCEkXE92ppTaKwrCdepaQAMArbtqegXOCf4X26HLPzCU0Z--G4D8': {
      text: 'lllllllllllllllllllllll\n\n\n\n\n\n\n\n',
      selections: {},
    },
    'uhCEkQ6J3vPMFlY-5tk7RuvWmA9cDQCbud389RYUsmhe5zl37MNHq': {
      text: '\n\n\n\n\n\n\n\n',
      selections: {},
    },
    uhCEkG5_b_DiqDR_ow1NRtf04B_KI1zfdtv_Ejf86higrZIs8BzfL: {
      text: '\nñlkj\n\n\n\n\n\n\nñlj',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 5,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 15,
          characterCount: 0,
        },
      },
    },
    'uhCEks005MLM3fSdAB4GiZDZ-VyKIFAs5HCNfLuFuDnJEZ4U8Mshu': {
      text: '\nñlkjkkkkkkkkkkkkkkkk\n\n\n\n\n\n\nñljllllllllllllllll',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 21,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 47,
          characterCount: 0,
        },
      },
    },
    'uhCEkC7PpMWsPezPmgDefVTIC0Xd7ntc-xGyEo7SksgFEUWnP_5V9': {
      text: '\nñlkjkkkkkkkkkkkkkkkk,,,,,,,,,,,,,,,,,,,,,,\n\n\n\n\n\n\nñljllllllllllllllll',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 43,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 69,
          characterCount: 0,
        },
      },
    },
    uhCEkj1YMggpKy8ivlu7uPQnEAJko7GSWpLweUX_J0VvWcOu_vt5L: {
      text: '\nñlkjkkkkkkkkkkkkkkkk,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n\n\n\n\n\n\nñljllllllllllllllll',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 126,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 152,
          characterCount: 0,
        },
      },
    },
    'uhCEk3Aq0ScXo3HKiQ2H0SIfpYEgxWay5-eZS4zMMW6nhc6L8h1iI': {
      text: '\nñlkjkkkkkkkkkkkkkkkk,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ññññññññññññññññññññññ\n\n\n\n\n\n\nñljllllllllllllllll........................',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 148,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 198,
          characterCount: 0,
        },
      },
    },
    uhCEk2kw7g6w5oSX8esJwqLklc4Oj6Dg4kXosArrojJFv4yohMPmn: {
      text: '\nñlkjkkkkkkkkkkkkkkkk,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ññññññññññññññññññññññlllllllllllllllllllllllllllllllllllllll\n\n\n\n\n\n\nñljllllllllllllllll........................jjjjjjjjjjjjjjjjjjj',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 187,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 256,
          characterCount: 0,
        },
      },
    },
    'uhCEkU62C_nFEGsivpVGNIfN5hJfqjDiF-KCJrLL8KGuBE8rkKpya': {
      text: '\nñlkjkkkkkkkkkkkkkkkk,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ññññññññññññññññññññññlllllllllllllllllllllllllllllllllllllll\n\n\n\n\n\n\nñljllllllllllllllll........................jjjjjjjjjjjjjjjjjjjiiiii',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 187,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 261,
          characterCount: 0,
        },
      },
    },
    uhCEkzW7zLHXeX6HUVjRySvcAP9J9qPcfWU3QoMWyIw3SmskU16V5: {
      text: '\nñlkjkkkkkkkkkkkkkkkk,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ññññññññññññññññññññññllllllllllllllllllllllllllllllllllllllluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuo\n\n\n\n\n\n\nñljllllllllllllllll........................jjjjjjjjjjjjjjjjjjjiiiiiiiiiiiiiiiiiiiiiiii',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 265,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 358,
          characterCount: 0,
        },
      },
    },
    'uhCEkwAgLEM7W2BA04emxTMcb1Y2HtLhWzRrE3sMiY2BWIMScWv7-': {
      text: '\nñlkjkkkkkkkkkkkkkkkk,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,ññññññññññññññññññññññllllllllllllllllllllllllllllllllllllllluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuo\n\n\n\n\n\n\nñljllllllllllllllll........................jjjjjjjjjjjjjjjjjjjiiiiiiiiiiiiiiiiiiiiiiiiooooooooooooooo',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 265,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 373,
          characterCount: 0,
        },
      },
    },
    uhCEkjDbEtqON4IFjAVeB_p_WuHZaUp5NabDBOLfmxzu6BEP_YFAp: {
      text: '',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 0,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 0,
          characterCount: 19,
        },
      },
    },
    'uhCEkSxbxgG2-0C_DforKOrep1PiLOQT1DsRnOPfGwZ2fYHRTeBHN': {
      text: '\n\n\n\n\n\n\n\n\n',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 9,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 0,
          characterCount: 0,
        },
      },
    },
    uhCEkOAUBeAcjOMZ1_7g2sj_u935itvH7vgUUngFFMZLMbZkQpWQZ: {
      text: 'y\n\n\n\n\n\n\n\n\njjjjjjjjjjjjjjjjjjjj',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 30,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 1,
          characterCount: 0,
        },
      },
    },
    'uhCEkvxmNRYkT3BW-7h_fGWCI_jYbvaxv5LwfRUe_XjE19SF6tjDP': {
      text: 'yyyyyyyyyyy\n\n\n\n\n\n\n\n\njjjjjjjjjjjjjjjjjjjj',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 40,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 11,
          characterCount: 0,
        },
      },
    },
    'uhCEk1F0vuhhXt2LlMzGWmmhhCuQWxkjpW11N9RgBHq43-7qePHXW': {
      text: '7yyyyyyyyyyy\n\n\n\n\n\n\n\n\njjjjjjjjjjjjjjjjjjjj',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 1,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 41,
          characterCount: 0,
        },
      },
    },
    'uhCEk0TVvowiMiUmWvuW1Shl7Q5YiSS84fQF-fhKbxrou0Dqd8Je8': {
      text: '77777777777yyyyyyyyyyy\n\n\n\n\n\n\n\n\njjjjjjjjjjjjjjjjjjjj888888888888888',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 11,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 66,
          characterCount: 0,
        },
      },
    },
    'uhCEkLZ8LcP_9i2WnN9ulplGWEhX9hxiJ3GcOd_FqdP-K8iocfWtd': {
      text: '777777777775555555555555555yyyyyyyyyyy\n\n\n\n\n\n\n\n\njjjjjjjjjjjjjjjjjjjj888888888888888',
      selections: {
        'uhCAkTQK-dOniBe986kPeL1skevMO4K8M7_0Y0hjg8KhlQz5MVdoD': {
          position: 27,
          characterCount: 0,
        },
        uhCAkJEnzCyYt892KUkFcKmw7W4YsWSNkzd2I3PpSDrpgU44NMPIG: {
          position: 82,
          characterCount: 0,
        },
      },
    },
  },
};

const lastDeltaSeen = {
  commitHash: 'uhCEkP48o9trU9la_IR6hPozh2iY6KmI6VIVgVU_YSssDMdUM0R4j',
  deltaIndexInCommit: 9,
};

const sessionHash = 'uhCEkgFZH6hxzxwDD7qoLUWJgiwtbibkCuAsGUGhMUgjUy7_ZWSMW';

export default (orchestrator: Orchestrator<any>) => {
  orchestrator.registerScenario('syn 2 nodes', async (s, t) => {
    const missedDeltas = selectMissedDeltas(
      synState as any,
      sessionHash,
      lastDeltaSeen
    );

    let expectedDeltas =
      synState.commits['uhCEk3zht4ctyzgsyH-7xIRFZjzXx6OTIOWmM6Ej_nMhm8pn0fyI5']
        .changes.deltas.length +
      synState.commits[
        'uhCEkP48o9trU9la_IR6hPozh2iY6KmI6VIVgVU_YSssDMdUM0R4j'
      ].changes.deltas.slice(lastDeltaSeen.deltaIndexInCommit).length;


    t.equal(expectedDeltas, missedDeltas.length);
  });
};
