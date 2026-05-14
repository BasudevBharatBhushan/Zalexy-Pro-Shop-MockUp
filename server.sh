#!/bin/sh
cd /home/z/my-project
while true; do
  rm -f dev.log
  node --max-old-space-size=256 node_modules/.bin/next dev -p 3000 > dev.log 2>&1
  sleep 1
done
