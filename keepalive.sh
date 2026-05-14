#!/bin/bash
while true; do
  sleep 8
  curl -s -o /dev/null http://localhost:3000/ 2>/dev/null || {
    # Server died, restart it
    cd /home/z/my-project
    nohup node --max-old-space-size=256 node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
  }
done
