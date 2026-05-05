#!/bin/bash
for dir in services/*; do
  if [ -d "$dir" ] && [ -f "$dir/build.gradle" ]; then
    echo "=================================="
    echo "COMPILING $dir"
    echo "=================================="
    cd "$dir"
    ./gradlew build -x test --no-daemon
    if [ $? -ne 0 ]; then
      echo "FAILED $dir"
      exit 1
    fi
    cd ../..
  fi
done
echo "ALL COMPILED SUCCESSFULLY"
