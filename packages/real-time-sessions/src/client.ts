import {CellClient} from '@holochain-open-dev/cell-client';
import {Record} from '@holochain/client'

export class RealTimeSessionsClient {

  constructor(
    public cellClient: CellClient,
    protected zomeName = 'real_time_sessions'
  ) {}

  createSession(info?: Uint8Array): Promise<Record> {
    return this.callZome('create_session', info);
  }

  /** Helpers */
  private async callZome(fnName: string, payload: any): Promise<any> {
    return this.cellClient.callZome(this.zomeName, fnName, payload);
  }
}