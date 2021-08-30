import { Orchestrator } from "@holochain/tryorama";
import syn from "./syn.js";

const orchestrator = new Orchestrator();

syn(orchestrator);

orchestrator.run();
