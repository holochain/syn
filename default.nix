let
  holonixPath = (import ./nix/sources.nix).holonix; # points to the current state of the Holochain repository
  holonix = import (holonixPath) {
    holochainVersionId = "v0_1_0-beta-rc_3"; # specifies the Holochain version
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  packages = with nixpkgs; [
    niv
    nodejs-16_x
    # any additional packages needed for this project, e. g. Nodejs
  ];
  shellHook = ''
    export GIO_MODULE_DIR="${nixpkgs.glib-networking}/lib/gio/modules/";
  '';
}
