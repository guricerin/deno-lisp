#!/bin/bash
set -eu

main() {
    case ${1} in
        run)
            deno run main.ts;;
        test)
            deno test --allow-read;;
    esac
}

main ${1}
