import { Orchestrator } from "@holochain/tryorama";
import syn from "./syn";

const orchestrator = new Orchestrator();

syn(orchestrator);

orchestrator.run();
