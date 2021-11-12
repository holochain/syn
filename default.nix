{
  holonixPath ?  builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/2f8ca2fa76165e2978112cb693c572f1086c5541.tar.gz"; }
}:

let
  holonix = import (holonixPath) { };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  buildInputs = with nixpkgs; [
    binaryen
    nodejs-16_x
  ];
}
