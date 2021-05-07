let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/refs/heads/experiment/holochain-darwin-ldflags.tar.gz";
    sha256 = "1765x81nkm79fn98kv782wr6amj2vaxccp9l4ppv8h1lhfvapbgp";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
      rev = "78e2591449f1467f32b24219b4ffac75b6b840ee";
      sha256 = "10znmmxba2n74np8kriwwbk977x9asq7abbjz5w8angzi1nhibfm";
      cargoSha256 = "1hdnfzn9nlfa5wb2xhk2h7myb21gbiilk8v4jm8sqcf5pjjk5x2j";
      bins = {
        holochain = "holochain";
        hc = "hc";
      };
    };
    holochainOtherDepsNames = ["lair-keystore"];
  };
in holonix.main
