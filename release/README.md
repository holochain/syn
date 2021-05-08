# syn-release

Steps required for making a new release:
 1. `cd` into this `release` directory
 1. Copy `holochain` and `lair-keystore` binaries to `bin` subfolder in this `release` folder adding the following build platform suffixes while doing so:
    - Linux: `-linux` (`holochain-linux` and `lair-keystore-linux`).
    - macOS: No suffix (`holochain` and `lair-keystore`).
 1. From this `release` directory, run `sh release_build.sh` to build the ui and the electron package in one go
