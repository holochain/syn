import { Orchestrator } from '@holochain/tryorama'

const orchestrator = new Orchestrator()

import { oFn } from './syn-lib.js'

oFn(orchestrator)
orchestrator.run()
