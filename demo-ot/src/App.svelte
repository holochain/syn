<script>
  import Title from './Title.svelte';
  import {
    OTSynStore,
    SynClient,
    OTDocumentStore,
    OTWorkspaceStore
  } from '@holochain-syn/core';
  import '@holochain-syn/core/dist/elements/syn-context.js'
  import '@holochain-syn/core/dist/elements/commit-history.js'
  import '@holochain-syn/core/dist/elements/session-participants.js'
  import '@holochain-syn/text-editor/dist/elements/syn-markdown-editor.js';
  import { createClient, DocumentGrammar, textSlice } from './syn';
  import {toPromise} from '@holochain-open-dev/stores'
  import { setContext, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import {
    ProfilesClient,
    ProfilesStore,
  } from '@holochain-open-dev/profiles';
  import '@holochain-open-dev/profiles/dist/elements/profiles-context.js'
  import '@holochain-open-dev/profiles/dist/elements/profile-prompt.js'
  import { v1 as uuidv1 } from "uuid";

  // ============= UNIVER IMPORTS =============

  import "@univerjs/sheets-numfmt/lib/index.css";
  import '@univerjs/thread-comment-ui/lib/index.css';
  import "@univerjs/design/lib/index.css";
  import "@univerjs/ui/lib/index.css";
  import "@univerjs/sheets-ui/lib/index.css";
  import "@univerjs/sheets-formula/lib/index.css";
  import "@univerjs/docs-ui/lib/index.css";
  
  import ThreadCommentUIEnUS from '@univerjs/thread-comment-ui/locale/en-US';
  import SheetsThreadCommentEnUS from '@univerjs/sheets-thread-comment/locale/en-US';
  import DesignEnUS from '@univerjs/design/locale/en-US';
  import DocsUIEnUS from '@univerjs/docs-ui/locale/en-US';
  import SheetsEnUS from '@univerjs/sheets/locale/en-US';
  import SheetsUIEnUS from '@univerjs/sheets-ui/locale/en-US';
  import UIEnUS from '@univerjs/ui/locale/en-US';

  import { LocaleType, LogLevel, LocaleService, Univer, UniverInstanceType, TextXActionType, TextX, JSONX, ICommandService, UserManagerService , Tools, IUniverInstanceService, MemoryCursor } from '@univerjs/core';
  // import type {JSONXActions, DocumentDataModel} from '@univerjs/core';
  import { defaultTheme } from '@univerjs/design';
  import { UniverDocsPlugin, DocSkeletonManagerService } from '@univerjs/docs';
  import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
  import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
  import { UniverSheetsPlugin } from '@univerjs/sheets';
  import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
  import { UniverUIPlugin } from '@univerjs/ui';
  import { UniverSheetsConditionalFormattingUIPlugin } from '@univerjs/sheets-conditional-formatting-ui';
  import { UniverSheetsThreadCommentPlugin } from '@univerjs/sheets-thread-comment';
  import { UniverSheetsHyperLinkUIPlugin } from '@univerjs/sheets-hyper-link-ui';
  import { IThreadCommentMentionDataService, UniverThreadCommentUIPlugin } from '@univerjs/thread-comment-ui';
  import { UniverThreadCommentPlugin } from '@univerjs/thread-comment';
  import { UniverSheetsThreadCommentBasePlugin } from '@univerjs/sheets-thread-comment-base';
  import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
  // import type { IUniverRPCMainThreadConfig } from '@univerjs/rpc';
  import { UniverRPCMainThreadPlugin } from '@univerjs/rpc';
  import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
  import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt';
  import { UniverSheetsDataValidationPlugin } from '@univerjs/sheets-data-validation';
  import { UniverSheetsDrawingUIPlugin } from '@univerjs/sheets-drawing-ui';
  import { UniverSheetsZenEditorPlugin } from '@univerjs/sheets-zen-editor';
  import { UniverSheetsSortPlugin } from '@univerjs/sheets-sort';
  import { UniverSheetsSortUIPlugin } from '@univerjs/sheets-sort-ui';
  import { UniverDocsDrawingUIPlugin } from '@univerjs/docs-drawing-ui';
  import { UniverDocsThreadCommentUIPlugin } from '@univerjs/docs-thread-comment-ui';
  import { UniverSlidesPlugin } from '@univerjs/slides';
  import { UniverSlidesUIPlugin } from '@univerjs/slides-ui';
  import { FUniver } from "@univerjs/facade";

  // ============= UNIVER IMPORTS ENDS =============

  // ================== UNIVER PLUGINS REGISTER ==================
  let univer = new Univer({
    theme: defaultTheme,
    locale: LocaleType.EN_US,
    locales: {
      [LocaleType.EN_US]: Tools.deepMerge(
        DesignEnUS,
        DocsUIEnUS,
        SheetsEnUS,
        SheetsUIEnUS,
        UIEnUS,
        ThreadCommentUIEnUS,
        SheetsThreadCommentEnUS,
        ThreadCommentUIEnUS,
      ),
    },
  });
    
  univer.registerPlugin(UniverDocsPlugin, {
      hasScroll: false,
  });
  univer.registerPlugin(UniverRenderEnginePlugin);
  univer.registerPlugin(UniverUIPlugin, {
      container: "univerContainer",
      header: true,
      toolbar: true,
      footer: true,
    });

  univer.registerPlugin(UniverDocsUIPlugin, {
    container: 'univerdoc',
    layout: {
      docContainerConfig: {
        innerLeft: false,
      },
    },
  });

  univer.registerPlugin(UniverSheetsPlugin, {
      notExecuteFormula: true,
  });
  univer.registerPlugin(UniverSheetsUIPlugin);
  univer.registerPlugin(UniverSheetsNumfmtPlugin);
  univer.registerPlugin(UniverSheetsZenEditorPlugin);
  univer.registerPlugin(UniverFormulaEnginePlugin, {
      notExecuteFormula: true,
  });
  univer.registerPlugin(UniverSheetsFormulaPlugin);
  univer.registerPlugin(UniverRPCMainThreadPlugin, {
      workerURL: './worker.js',
  });
  univer.registerPlugin(UniverSheetsHyperLinkUIPlugin);
  univer.registerPlugin(UniverSheetsDataValidationPlugin);
  univer.registerPlugin(UniverSheetsSortPlugin);
  univer.registerPlugin(UniverSheetsSortUIPlugin);
  univer.registerPlugin(UniverSheetsConditionalFormattingUIPlugin);
  univer.registerPlugin(UniverSlidesPlugin);
  univer.registerPlugin(UniverSlidesUIPlugin);
  univer.registerPlugin(UniverSheetsDrawingUIPlugin);
  
  const univerAPI = FUniver.newAPI(univer);
  // ================== UNIVER PLUGINS REGISTER ENDS ==================

  $: disconnected = false;
  let syn;

  // The debug drawer's ability to resized and hidden
  let resizeable;
  let resizeHandle;
  const minDrawerSize = 0;
  const maxDrawerSize = document.documentElement.clientHeight - 30 - 10;
  const initResizeable = resizeableEl => {
    resizeableEl.style.setProperty('--max-height', `${maxDrawerSize}px`);
    resizeableEl.style.setProperty('--min-height', `${minDrawerSize}px`);
  };

  const setDrawerHeight = height => {
    document.documentElement.style.setProperty(
      '--resizeable-height',
      `${height}px`
    );
  };
  const getDrawerHeight = () => {
    const pxHeight = getComputedStyle(resizeable).getPropertyValue(
      '--resizeable-height'
    );
    return parseInt(pxHeight, 10);
  };

  const startDragging = event => {
    event.preventDefault();
    const host = resizeable;
    const startingDrawerHeight = getDrawerHeight();
    const yOffset = event.pageY;

    const mouseDragHandler = moveEvent => {
      moveEvent.preventDefault();
      const primaryButtonPressed = moveEvent.buttons === 1;
      if (!primaryButtonPressed) {
        setDrawerHeight(
          Math.min(Math.max(getDrawerHeight(), minDrawerSize), maxDrawerSize)
        );
        window.removeEventListener('pointermove', mouseDragHandler);
        return;
      }
      setDrawerHeight(
        Math.min(
          Math.max(
            yOffset - moveEvent.pageY + startingDrawerHeight,
            minDrawerSize
          ),
          maxDrawerSize
        )
      );
    };
    const remove = window.addEventListener('pointermove', mouseDragHandler);
  };

  let drawerHidden = false;
  const hideDrawer = () => {
    drawerHidden = true;
  };
  const showDrawer = () => {
    drawerHidden = false;
  };

  let tabShown = false;
  const showTab = () => {
    tabShown = true;
  };
  const hideTab = () => {
    tabShown = false;
  };

  let profilesStore;
  let synStore;
  let documentStore;
  let workspaceStore;
  let sessionStore;
  let clerk;
  let sentOperations = []
  let clerkOperations = []
  let univerDoc;
  $: chronicle = sessionStore ? sessionStore.chronicle : null;
  $: clerkLive = sessionStore ? sessionStore.clerk : null;
  $: clerkStatus = sessionStore ? sessionStore.clerkStatus : null;
  let chronicleEstimation = []
  let chronicleEstimationLength = 0
  let lastSelection = {startOffset: 0, endOffset: 0}

  // function opsTransform(ops1, ops2, textX = TextX) {
  //   let transforms = textX.transform(ops1, ops2, "left")
  //   // return TextX.transform(ops1, ops2, "left")
  //   return transforms
  // }

  // function opsTransformWithInjection(ops1, ops2) {
  //   let opsTransformString = opsTransform.toString()
  //   let textXString = TextX.toString()
  //   let metaFunction = `function(ops1, ops2) {
  //     eval(${textXString})
  //     return TextX.transform(ops1, ops2, "left")
  //   }`
  //   return metaFunction
  // }

  async function initSyn(client) {
    const synClient = new SynClient(client, 'syn-test')
    // console.log("OPS TRANSFORM FUNCTION", opsTransformWithInjection())
    const store = new OTSynStore(synClient);
    // console.log("stored function", store.opsTransformFunction)
    const documentsHashes = Array.from((await toPromise(store.documentsByTag.get("active"))).keys());

    // synClient.onSignal(async synSignal => {
    //   console.log("synSignal", synSignal)
    // });

    if (documentsHashes.length === 0) {
      documentStore = await store.createDocument(DocumentGrammar.initialState());

      await store.client.tagDocument(documentStore.documentHash, 'active')

      workspaceStore = await documentStore.createWorkspace(
        'main'
      );
      sessionStore = await workspaceStore.joinSession();
      synStore = store;
    } else {
      documentStore = store.documents.get(documentsHashes[0]);
      const workspaces = await toPromise(documentStore.allWorkspaces);

      workspaceStore = Array.from(workspaces.values())[0];
      sessionStore = await workspaceStore.joinSession();
      clerk = await sessionStore.clerk;
      synStore = store;
    }
  }

  function getRandomLetter() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    return alphabet[randomIndex];
  }

  async function sendOperationsToClerk(operations, lastKnownCommandIndex) {
    const clerksNewOperations = await sessionStore.sendOperationsToClerk(operations, lastKnownCommandIndex);
    clerkOperations = clerksNewOperations;
    console.log("clerksNewOperations", clerksNewOperations)
    return clerksNewOperations;
  }

  function hackRefresh(selection) {
    console.log("hack refresh selection", selection)
    const unitId = univerDoc.getUnitId()

    let underlineCommand = {
      "id": "doc.mutation.rich-text-editing",
      "type": 2,
      "params": {
          "unitId": unitId,
          "actions": [
              "body",
              {
                  "et": "text-x",
                  "e": [
                      {
                          "t": "r",
                          "body": {
                              "dataStream": "",
                              "textRuns": [
                                  {
                                      "st": 0,
                                      "ed": 0,
                                      "ts": {
                                          "cl": {
                                              "rgb": "#1e222b"
                                          }
                                      }
                                  }
                              ]
                          },
                          "len": 0,
                          "segmentId": "",
                          "oldBody": {
                              "dataStream": "",
                              "textRuns": [
                                  {
                                      "st": 0,
                                      "ed": 0,
                                      "ts": {
                                          "bl": 1,
                                          "cl": {
                                              "rgb": "#1e222b"
                                          }
                                      }
                                  }
                              ],
                              "customDecorations": [],
                              "customRanges": []
                          }
                      }
                  ]
              }
          ],
          "textRanges": [
              {
                  "startOffset": selection ? selection.startOffset : 0,
                  "endOffset": selection ? selection.endOffset : 0,
                  "collapsed": true,
                  "rangeType": "TEXT",
                  "startNodePosition": {
                      "glyph": 0,
                      "divide": 0,
                      "line": 0,
                      "column": 0,
                      "section": 0,
                      "page": 0,
                      "pageType": 0,
                      "segmentPage": -1,
                      "isBack": true,
                      "path": [
                          "pages",
                          0
                      ]
                  },
                  "endNodePosition": {
                      "glyph": 0,
                      "divide": 0,
                      "line": 0,
                      "column": 0,
                      "section": 0,
                      "page": 0,
                      "pageType": 0,
                      "segmentPage": -1,
                      "isBack": true,
                      "path": [
                          "pages",
                          0
                      ]
                  },
                  "direction": "none",
                  "segmentId": "",
                  "segmentPage": -1,
                  "isActive": true
              }
          ],
          "trigger": "doc.command.set-inline-format"
      }
    }
    univerAPI.executeCommand(underlineCommand.id, underlineCommand.params, {"fromCollab": true})

    // let cursor = new MemoryCursor(0)
    // cursor.moveCursor(3)
    // console.log("cursor", cursor)

    // let setSelectionsCommand = {
    //   "id": "doc.operation.set-selections",
    //   "type": 1,
    //   "params": {
    //       "unitId": unitId,
    //       "subUnitId": "Hhqy2C",
    //       "segmentId": "",
    //       "style": {
    //           "strokeWidth": 1.5,
    //           "stroke": "rgba(0, 0, 0, 0)",
    //           "strokeActive": "rgba(0, 0, 0, 1)",
    //           "fill": "rgba(0, 65, 198, 0.8)"
    //       },
    //       "isEditing": true,
    //       "ranges": [
    //           {
    //               // "startOffset": 0,
    //               "startOffset": selection ? selection.startOffset : 0,
    //               // "endOffset": 0,
    //               "endOffset": selection ? selection.endOffset : 0,
    //               "collapsed": true,
    //               "rangeType": "TEXT",
    //               "direction": "none",
    //               "segmentId": "",
    //               "segmentPage": -1,
    //               "isActive": true
    //           }
    //       ]
    //   }
    // }

    // console.log("selection", selection)
    // univerAPI.executeCommand(setSelectionsCommand.id, setSelectionsCommand.params, {"fromCollab": true})
  }


  function hackRefresh2() {
    const unitId = univerDoc.getUnitId()

    let underlineCommand = {
      "id": "doc.mutation.rich-text-editing",
      "type": 2,
      "params": {
          "unitId": unitId,
          "actions": [
              "body",
              {
                  "et": "text-x",
                  "e": [
                      {
                          "t": "r",
                          "body": {
                              "dataStream": "",
                              "textRuns": [
                                  {
                                      "st": 0,
                                      "ed": 0,
                                      "ts": {
                                          "cl": {
                                              "rgb": "#1e222b"
                                          }
                                      }
                                  }
                              ]
                          },
                          "len": 0,
                          "segmentId": "",
                          "oldBody": {
                              "dataStream": "",
                              "textRuns": [
                                  {
                                      "st": 0,
                                      "ed": 0,
                                      "ts": {
                                          "bl": 1,
                                          "cl": {
                                              "rgb": "#1e222b"
                                          }
                                      }
                                  }
                              ],
                              "customDecorations": [],
                              "customRanges": []
                          }
                      }
                  ]
              }
          ],
          "textRanges": [
              {
                  "startOffset": 0,
                  "endOffset": 0,
                  "collapsed": true,
                  "rangeType": "TEXT",
                  "startNodePosition": {
                      "glyph": 0,
                      "divide": 0,
                      "line": 0,
                      "column": 0,
                      "section": 0,
                      "page": 0,
                      "pageType": 0,
                      "segmentPage": -1,
                      "isBack": true,
                      "path": [
                          "pages",
                          0
                      ]
                  },
                  "endNodePosition": {
                      "glyph": 0,
                      "divide": 0,
                      "line": 0,
                      "column": 0,
                      "section": 0,
                      "page": 0,
                      "pageType": 0,
                      "segmentPage": -1,
                      "isBack": true,
                      "path": [
                          "pages",
                          0
                      ]
                  },
                  "direction": "none",
                  "segmentId": "",
                  "segmentPage": -1,
                  "isActive": true
              }
          ],
          "trigger": "doc.command.set-inline-format"
      }
    }
    univerAPI.executeCommand(underlineCommand.id, underlineCommand.params)
  }

  function buildFromCommands(commands) {
    console.log("c o m m a n d s ", commands)
    let univer2 = new Univer({
      theme: defaultTheme,
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: Tools.deepMerge(
          DesignEnUS,
          DocsUIEnUS,
          SheetsEnUS,
          SheetsUIEnUS,
          UIEnUS,
          ThreadCommentUIEnUS,
          SheetsThreadCommentEnUS,
          ThreadCommentUIEnUS,
        ),
      },
    });
    let operations = extractActionsFromCommands(commands)
    let testDoc = univer2.createUnit(UniverInstanceType.UNIVER_DOC, {});
    // let composed = TextX.apply(testDoc.getSnapshot().body, operations, "left")
    // operations.forEach(op => {
    //   TextX.apply(testDoc.getSnapshot().body, [op], "left")
    // })
    console.log("testDoc", testDoc?.getSnapshot()?.body?.dataStream)
  }

  function extractActionsFromCommands(commands) {
    let actions = []
    let lastRetainLen = 0
    commands?.forEach(command => {
      if (command.transformed) {
        actions = actions.concat(command.transformed)
      } else if (command.params?.actions) {
        if (command.params.actions[1]["e"].length == 2) {
          // let retainOp = command.params.actions[1]["e"][0]
          // if (retainOp.len == lastRetainLen + 1) {
          //   actions.push(command.params.actions[1]["e"][0])
          //   lastRetainLen = retainOp.len
          // }
          actions.push(command.params.actions[1]["e"][0])
          actions.push(command.params.actions[1]["e"][1])
        } else {
          actions.push(command.params.actions[1]["e"][0])
        }

        // actions.push(removeSymbolFields(command.params.actions))
      }
    })
    return actions
  }
import { encode, decode } from '@msgpack/msgpack';
    import { encodeHashToBase64 } from '@holochain/client';
  
  onMount(async () => {
    let client = await createClient();
    profilesStore = new ProfilesStore(new ProfilesClient(client, 'syn-test'));
    await initSyn(client);
    univerDoc = univer.createUnit(UniverInstanceType.UNIVER_DOC, {});
    // $synState.commentCommands.forEach(comment => {
    //   // console.log("executing comment", comment)
    //   univerAPI.executeCommand(comment.id, comment.params, {"fromCollab": true})
    // })

    univerAPI.onCommandExecuted(async (command, options) => {
      console.log("command executed 1", command)
      if (!command.id.includes("mutation") || options?.fromCollab) { return; }
      console.log("command executed", command)
      let commandSelection = {
        startOffset: command.params.textRanges[0].startOffset,
        endOffset: command.params.textRanges[0].endOffset
      }
      console.log("commandselection 1", commandSelection)
      let transformedCommand = extractActionsFromCommands([command])
      let lastKnownCommandIndex = chronicleEstimationLength - 1 //chronicleEstimation.length ? chronicleEstimation.length - 1 : -1;
      let lastKnownCommandId = chronicleEstimation[lastKnownCommandIndex]?.uniqueId;
      let uniqueId = uuidv1()
      let authorId = sessionStore.myPubKey;
      let modifiedCommand = {
        ...command,
        uniqueId,
        authorId,
        lastKnownCommandIndex,
        lastKnownCommandId
      }

      console.log("onBeforeCommandExecute", modifiedCommand, options, "lkci", lastKnownCommandIndex, "c len", chronicleEstimation.length, chronicleEstimation)
      // let operations = extractActionsFromCommands([command])
      console.log("modifiedCommand", modifiedCommand, lastKnownCommandIndex)
      let preOps = await sendOperationsToClerk([modifiedCommand], lastKnownCommandIndex);
      // await new Promise(resolve => setTimeout(resolve, 100));

      // sentOperations = sentOperations.concat(operations);
      // sentOperations.push(modifiedCommand);
      // sentOperations = [...sentOperations];
      console.log("preOps", preOps)
      clerkOperations = preOps;
      // apply preOps to univer document
      // let transforms = TextX.transform(extractActionsFromCommands(preOps), extractActionsFromCommands([command]), "left")

      let localTransforms = extractActionsFromCommands([command])
      let localTransformsReverse = TextX.invert(localTransforms)
      TextX.apply(univerDoc.getSnapshot().body, localTransformsReverse)
      commandSelection = {
        startOffset: TextX.transformPosition(localTransformsReverse, commandSelection.startOffset),
        endOffset: TextX.transformPosition(localTransformsReverse, commandSelection.endOffset)
      }
      console.log("command selection 2", commandSelection)

      for (let i = 0; i < preOps.length; i++) {
        let c = preOps[i]
        let cDocIndex = c.params.textRanges[0].startOffset
        let operations = extractActionsFromCommands([c])
        let unknownCommands = chronicleEstimation.slice(c.lastKnownCommandIndex + 1)
        // .filter(op => {
        //   let opDocIndex = op.params.textRanges[0].startOffset
        //   return opDocIndex <= cDocIndex
        // })
        let unknownOps = extractActionsFromCommands(unknownCommands)
        console.log("operations", operations, unknownOps)
        let funString = operations[1]?.body?.dataStream + "/" + operations[0]?.body?.dataStream + " doesn't know about " + unknownOps[1]?.body?.dataStream + "/" + unknownOps[0]?.body?.dataStream
        console.log(funString)
        let transforms = operations
        unknownOps.forEach(op => {
          let opDocIndex = op.len
          let transformsDocIndex = transforms[0].len
          console.log("opDocIndex", opDocIndex, "transformsDocIndex", transformsDocIndex)
          if (opDocIndex < transformsDocIndex) {
            transforms = TextX.transform(transforms, [op], "left")
            console.log(op.body?.dataStream + " -- transforms -- ", transforms[0]?.len)
          }
        })
        
        let applyTransforms = transforms
        // if (cDocIndex > commandDocIndex) {
        //   console.log("=========APPLYING RIGHT=========", cDocIndex, commandDocIndex)
        //   applyTransforms = TextX.transform(transforms, localTransforms, "right")
        // }

        // console.log("transforms --- ", transforms)
        // let transforms1 = TextX.transform(operations, unknownOps, "right")
        // let transforms3 = TextX.transform(operations, unknownOps, "left")
        // console.log("transforms1", transforms, "transforms3", transforms3)
        // let transforms2 = TextX.transform(transforms, transforms1, "left")
        // console.log("transforms2", transforms2)
        // console.log("transforms", transforms1)
        TextX.apply(univerDoc.getSnapshot().body
        , applyTransforms)
        
        // adjust local transforms according to transformed preOps
        transforms.forEach(op => {
          let opDocIndex = op.len
          let localTransformsDocIndex = localTransforms[0].len
          console.log("opDocIndex", opDocIndex, "localTransformsDocIndex", localTransformsDocIndex)
          if (opDocIndex < localTransformsDocIndex) {
            localTransforms = TextX.transform(localTransforms, [op], "left")
            console.log(op.body?.dataStream + " -- local transforms -- ", transforms[0]?.len)
          }
        })

        // localTransforms = TextX.transform(localTransforms, transforms)
        
        // commandSelection = {
        //   startOffset: TextX.transformPosition(transforms, commandSelection.startOffset),
        //   endOffset: TextX.transformPosition(transforms, commandSelection.endOffset)
        // }

        // console.log("command selection 3", commandSelection)

        chronicleEstimation.push({
          ...c,
          transformed: transforms
        })
        chronicleEstimationLength += 1
      }

      TextX.apply(univerDoc.getSnapshot().body, localTransforms)
      lastSelection = {
        startOffset: TextX.transformPosition(localTransforms, commandSelection.startOffset),
        endOffset: TextX.transformPosition(localTransforms, commandSelection.endOffset)
      }

      chronicleEstimation.push(modifiedCommand)
      chronicleEstimationLength += 1
      chronicleEstimation = [...chronicleEstimation];
      console.log("chronicleEstimation", chronicleEstimation)
      
      console.log("last selection", lastSelection, "command selection", commandSelection, "localTransforms", localTransforms)

      // hackRefresh({
      //   startOffset: localTransforms[0].len + localTransforms[1].len,
      //   endOffset: localTransforms[0].len + localTransforms[1].len
      // })
      hackRefresh(lastSelection)


      // return error
      // throw new Error("error")

      
      // chronicleEstimation = chronicleEstimation.concat(preOps);
      // chronicleEstimation = chronicleEstimation.concat(operations);
      // chronicleEstimation = [...chronicleEstimation];
      
      // TextX.apply(univerDoc.getSnapshot().body
      // , preOps)
      // hackRefresh(0)


      // let calculateCursorPosition = TextX.transformPosition([transforms[i], transforms[i+1]], 0)
      // console.log("calculateCursorPosition", calculateCursorPosition)
      // hackRefresh(calculateCursorPosition)

      // for (let i = 0; i < transforms.length; i+=2) {
      //   TextX.apply(univerDoc.getSnapshot().body
      //   , [transforms[i], transforms[i+1]])

      //   let calculateCursorPosition = TextX.transformPosition([transforms[i], transforms[i+1]], lastCursorPosition.startOffset)
      //   console.log("calculateCursorPosition", calculateCursorPosition)
      //   hackRefresh(calculateCursorPosition)
      // }
    })
  });

  $: synStore, workspaceStore, profilesStore, sessionStore, sentOperations;

  let autoType = false

  setContext('sessionStore', {
    getSessionStore: () => sessionStore,
  });
</script>

<svelte:head>
  <script
    src="https://kit.fontawesome.com/80d72fa568.js"
    crossorigin="anonymous"></script>
</svelte:head>

{#if synStore}
  <!-- <profiles-context store={profilesStore}> -->
    <syn-context synstore={synStore}>
      <div class="toolbar">
        <h1>SynText</h1>
        <div>
          <Title />
        </div>
        <div on:click={()=>autoType = !autoType}>autoType: {autoType}</div>
      </div>
      <main style="display: flex; height: 400px;">
      <!-- <profile-prompt> -->
        <div style="display:flex; flex-direction: column; width: 100%">
            {#if clerkLive && encodeHashToBase64($clerkLive) == encodeHashToBase64(sessionStore.myPubKey)}
            ✅ clerk
            {:else}
            ❌ clerk
            {/if}
          <div style="display: flex; flex-direction: row; width: 100px;">
            {$clerkStatus}: {encodeHashToBase64($clerkLive)}
          </div>

          <div style="display: flex; flex-direction: row; width: 100px;">
            <button on:click={() => {sessionStore.handleVoteOfNoConfidence(sessionStore.myPubKey, get(sessionStore.clerk))}}>No confidence</button>
            <button on:click={() => {sessionStore.handleElectionNotice(get(sessionStore.clerk))}}>Initiate election</button>
            <button on:click={() => {buildFromCommands(chronicleEstimation)}}>build</button>
            <button on:click={() => {clerk = get(sessionStore.clerk)}}>recheck</button>
            <button on:click={() => {sessionStore._clerk.set(sessionStore.myPubKey); clerk = sessionStore.myPubKey}}>set clerk to me</button>
            <button on:click={() => {hackRefresh2()}}>refresh</button>
            <button on:click={() => {
              let randomLetter = getRandomLetter();
              sendOperationsToClerk([randomLetter]);
              sentOperations.push(randomLetter);
              sentOperations = [...sentOperations];
            }}>Send to clerk</button>
            <button on:click={() => {
              sendOperationsToClerk([]);
              sentOperations.push(null);
              sentOperations = [...sentOperations];
            }}>Send empty</button>
          </div>
          <div id="univerContainer" style="height: 500px;">

          </div>
          <div style="display: flex; flex-direction:row; flex: 1;">
            <!-- last known command length: {chronicleEstimationLength} -->
            <!-- chronicle: {JSON.stringify($chronicle.map(op => op.params?.actions[1]?.e[1]?.body?.dataStream))} -->
            <!-- <br>chronicle estimation: {JSON.stringify(chronicleEstimation.map(op => op.params?.actions[1]?.e[1]?.body?.dataStream))} ({chronicleEstimation.find(op2 => op2.uniqueId == op.lastKnownCommandId)?.params?.actions[1]?.e[1]?.body?.dataStream}) -->
            
            <br>
            {#each chronicleEstimation as op}
              &nbsp;
              {#if op.params?.actions[1]?.e[1]}
                {op.params?.actions[1]?.e[1]?.body?.dataStream}
              {:else}
                {op.params?.actions[1]?.e[0]?.body?.dataStream}
              {/if}
              {#if op.lastKnownCommandId}
                ({chronicleEstimation.find(op2 => op2.uniqueId == op.lastKnownCommandId)?.params?.actions[1]?.e[1]?.body?.dataStream})
              {/if}
            {/each}
          
            {#if sentOperations.length > -1}
            <br> sent: {JSON.stringify(sentOperations.length)}
            <br> clerk: {JSON.stringify(clerkOperations.length)}
            {/if}
            <commit-history documentstore={documentStore}></commit-history>
          </div>
        </div>
      <!-- </profile-prompt> -->
      </main>

      <div class="folks-tray">
        <h3>Participants</h3>
        {#each get(sessionStore.participants).active as participant}
          <div>{encodeHashToBase64(participant)}</div>
        {/each}
        <!-- <session-participants sessionstore={sessionStore} /> -->
      </div>
    </syn-context>
  <!-- </profiles-context> -->
{/if}

<style>
  main {
    padding: 1em;
    background: hsla(100, 20%, 50%, 0.2);
    grid-column: 1 / 1;
    grid-row: 2 / 2;
  }
  syn-markdown-editor {
    height: 100%;
    width: 100%;
  }
  .toolbar {
    background: hsla(19, 20%, 50%, 0.2);
    padding: 2rem;
    grid-column: 1 / 1;
    grid-row: 1 / 1;
  }

  .folks-tray {
    min-width: calc((var(--folks-padding) * 2) + var(--folk-hex-width));
    width: auto;
    background: hsla(255, 20%, 50%, 0.2);
    grid-column: 2 / 2;
    grid-row: 1 / 3;
  }

  :global(:root) {
    --resizeable-height: 200px;
    --tab-width: 60px;
  }

  .debug-drawer {
    width: 100%;
    box-sizing: border-box;
    height: var(--resizeable-height);
    min-height: var(--min-height);
    max-height: var(--max-height);
    background: hsla(180, 30%, 85%, 1);
    position: absolute;
    bottom: 0;
    text-align: left;
    grid-column: 1 / 2;
    overflow: hidden;
    z-index: 90;
  }

  .hidden {
    height: 0;
    min-height: 0;
  }

  .handle {
    height: 1px;
    width: 100%;
    background-color: hsla(180, 15%, 65%, 1);
    z-index: 100;
  }

  .handle::after {
    content: '';
    height: 9px;
    position: absolute;
    left: 0;
    right: 0;
    margin-bottom: -4px;
    background-color: transparent;
    cursor: ns-resize;
    z-index: 101;
  }

  /* tab styling reverse-engineered from Atom */
  .tab {
    z-index: 130;
    position: absolute;
    width: var(--tab-width);
    height: calc(var(--tab-width) / 2);
    left: calc(50% - (var(--tab-width) / 2));
    bottom: var(--resizeable-height);
    overflow: hidden;
    margin-bottom: -2px;
    border-top-left-radius: calc(var(--tab-width) / 2);
    border-top-right-radius: calc(var(--tab-width) / 2);

    pointer-events: none;
  }

  .tab-inner {
    position: absolute;
    box-sizing: border-box; /* borders included in size */
    width: var(--tab-width);
    height: var(--tab-width);
    background: hsla(180, 30%, 85%);
    border: 1px solid hsla(180, 20%, 65%, 1);
    color: hsla(180, 20%, 50%, 1); /* color of chevron */
    border-radius: calc(var(--tab-width) / 2);
    cursor: pointer;
    text-align: center;

    top: calc(var(--tab-width) / 2);
    transition: transform 0.2s ease-out 0.2s;
  }

  .tab.shown {
    pointer-events: all;
  }

  .tab-inner.shown {
    transform: translateY(-50%);
    transition: transform 0.2s ease-out 0s;
  }

  /* allow the tab to pop up when drawer is hidden */
  .tab.drawer-hidden {
    bottom: 0;
    pointer-events: all;
  }

  .tab-icon {
    margin-top: 9px;
  }

  .debug-content {
    padding: 1rem;
    word-wrap: break-word;
    height: 100%;
    overflow-y: scroll;
    box-sizing: border-box;
    z-index: 90;
  }

  body {
    font-family: system-ui, sans-serif;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
    margin: auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
