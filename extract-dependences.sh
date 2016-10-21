#!/usr/bin/env bash
for f in .modules/*.tgz; do tar -zxf "$f" -C node_modules/; done
