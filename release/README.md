# syn-release

Steps required for making a new release:
 1. `cd` into this `release` directory
 1. Copy `holochain` and `lair-keystore` binaries to `bin` subfolder in this `release` folder adding the build platform suffix while doing so, i.e. `holochain-linux`
 1. run the `sh release_build.sh` to build the ui and the electron package in one go
