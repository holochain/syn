import { encodeHashToBase64 } from '@holochain/client';
import Automerge from 'automerge';
export var TextEditorDeltaType;
(function (TextEditorDeltaType) {
    TextEditorDeltaType["Insert"] = "insert";
    TextEditorDeltaType["Delete"] = "delete";
    TextEditorDeltaType["ChangeSelection"] = "change_selection";
})(TextEditorDeltaType || (TextEditorDeltaType = {}));
export const textEditorGrammar = {
    initState(doc) {
        doc.text = new Automerge.Text();
    },
    applyDelta(delta, state, ephemeral, author) {
        if (delta.type === TextEditorDeltaType.Insert) {
            state.text.insertAt(delta.position, ...delta.text);
            const elementId = state.text.getElemId(delta.position + delta.text.length - 1);
            ephemeral[encodeHashToBase64(author)] = {
                left: false,
                position: elementId,
                characterCount: 0,
            };
        }
        else if (delta.type === TextEditorDeltaType.Delete) {
            state.text.deleteAt(delta.position, delta.characterCount);
            if (state.text.length === 0)
                return;
            if (delta.position === 0) {
                const elementId = state.text.getElemId(0);
                ephemeral[encodeHashToBase64(author)] = {
                    left: true,
                    position: elementId,
                    characterCount: 0,
                };
            }
            else {
                const elementId = state.text.getElemId(delta.position - 1);
                ephemeral[encodeHashToBase64(author)] = {
                    left: false,
                    position: elementId,
                    characterCount: 0,
                };
            }
        }
        else {
            if (state.text.length === 0) {
            }
            else if (delta.position === state.text.length) {
                ephemeral[encodeHashToBase64(author)] = {
                    left: false,
                    position: state.text.getElemId(delta.position - 1),
                    characterCount: delta.characterCount,
                };
            }
            else {
                ephemeral[encodeHashToBase64(author)] = {
                    left: true,
                    position: state.text.getElemId(delta.position),
                    characterCount: delta.characterCount,
                };
            }
        }
    },
};
//# sourceMappingURL=grammar.js.map