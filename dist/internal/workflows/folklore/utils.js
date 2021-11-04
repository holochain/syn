export function putJustSeenFolks(session, myPubKey, folks) {
    const now = Date.now();
    for (const folk of folks) {
        if (folk !== myPubKey) {
            if (!session.folks[folk]) {
                // First time we are seeing this folk
                session.folks[folk] = {
                    lastSeen: now,
                    inSession: true,
                };
            }
            else {
                session.folks[folk].lastSeen = now;
                session.folks[folk].inSession = true;
            }
        }
    }
}
//# sourceMappingURL=utils.js.map