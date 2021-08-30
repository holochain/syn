# Example: Custom Holochain And Binaries
# 
# The following `shell.nix` file can be used in your project's root folder and activated with `nix-shell`.
# It uses a custom revision and a custom set of binaries to be installed.

{ 
  holonixPath ?  builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/develop.tar.gz"; }
}:

let
  holonix = import (holonixPath) {
    include = {
        # making this explicit even though it's the default
        holochainBinaries = true;
    };

    holochainVersionId = "custom";

    holochainVersion = {
      rev = "d003eb7a45f1d7125c4701332202761721793d68";
      sha256 = "0qxadszm2a7807w49kfbj7cx6lr31qryxcyd2inyv7q5j7qbanf2";
      cargoSha256 = "129wicin99kmxb2qwhll8f4q78gviyp73hrkm6klpkql6810y3jy";
      bins = {
        holochain = "holochain";
        hc = "hc";
      };

      lairKeystoreHashes = {
        sha256 = "0khg5w5fgdp1sg22vqyzsb2ri7znbxiwl7vr2zx6bwn744wy2cyv";
        cargoSha256 = "1lm8vrxh7fw7gcir9lq85frfd0rdcca9p7883nikjfbn21ac4sn4";
      };
    };
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  buildInputs = with nixpkgs; [
    nodejs-16_x
  ];
}