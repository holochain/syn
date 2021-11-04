import { amIScribe, selectSessionWorkspace } from '../../../state/selectors';
import { putJustSeenFolks } from './utils';
export function handleFolkLore(workspace, sessionHash, folklore) {
    workspace.store.update(state => {
        if (amIScribe(state, sessionHash)) {
            console.log("Received folklore but I'm the scribe, ignoring");
            return state;
        }
        const session = selectSessionWorkspace(state, sessionHash);
        if (folklore.gone) {
            putGoneFolks(session, folklore.gone);
        }
        else {
            putJustSeenFolks(session, state.myPubKey, folklore.participants);
        }
        return state;
    });
}
function putGoneFolks(session, goneFolks) {
    for (const goneFolk of goneFolks) {
        if (!session.folks[goneFolk]) {
            session.folks[goneFolk] = {
                inSession: false,
                lastSeen: 0, // First time we are seeing this folk
            };
        }
        else {
            session.folks[goneFolk].inSession = false;
        }
    }
}
//# sourceMappingURL=folk.js.map