#!/bin/sh
tsc -b $(find ui/libs -maxdepth 1 -mindepth 1) $@
