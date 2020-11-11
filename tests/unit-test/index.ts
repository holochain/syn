import { Orchestrator } from '@holochain/tryorama'

const orchestrator = new Orchestrator()

require('./sym')(orchestrator)

orchestrator.run()
