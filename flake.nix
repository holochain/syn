{
  description = "Template for Holochain app development";

  inputs = {
    holochain-nix-versions.url  = "github:holochain/holochain/?dir=versions/0_2";
    holochain-flake = {
      url = "github:holochain/holochain/a92af07552c5cb70436c501b67e0c064ac699157";
      inputs.versions.follows = "holochain-nix-versions";
    };

    nixpkgs.follows = "holochain-flake/nixpkgs";
    flake-parts.follows = "holochain-flake/flake-parts";
  };

  outputs = inputs @ { flake-parts, holochain-flake, ... }:
    flake-parts.lib.mkFlake
      {
        inherit inputs;
      }
      {
        systems = builtins.attrNames holochain-flake.devShells;
        perSystem =
          { config
          , pkgs
          , system
          , ...
          }: {
            devShells.default = pkgs.mkShell {
              inputsFrom = [ holochain-flake.devShells.${system}.holonix ];
              packages = [ pkgs.nodejs-18_x ];
            };
          };
      };
}   