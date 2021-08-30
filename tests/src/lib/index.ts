import { Orchestrator } from '@holochain/tryorama'

const orchestrator = new Orchestrator()

import { oFn } from './syn-store'

oFn(orchestrator)
orchestrator.run()
