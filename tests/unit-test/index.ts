import { Orchestrator } from '@holochain/tryorama'

const orchestrator = new Orchestrator()

require('./syn')(orchestrator)

orchestrator.run()
