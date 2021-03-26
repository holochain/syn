let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/87ad95a9a0b08deea64ad77ac14a68a7f12cff52.tar.gz";
    sha256 = "0fvbbaps9aggqkjr00b3b331avh0fjb2b8gn07yglshsgix7wrhh";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
      rev = "78e2591449f1467f32b24219b4ffac75b6b840ee";
      sha256 = "10znmmxba2n74np8kriwwbk977x9asq7abbjz5w8angzi1nhibfm";
      cargoSha256 = "19faydkxid1d2s0k4jks6y6plgchdhidcckacrcs841my6dvy131";
      bins = {
        holochain = "holochain";
        hc = "hc";
      };
    };
    holochainOtherDepsNames = ["lair-keystore"];
  };
in holonix.main
