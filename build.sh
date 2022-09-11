#!/bin/bash
set -eu

readonly SCRIPT_ROOT=$(cd $(dirname ${0}); pwd)

main() {
    case ${1} in
        run)
            deno run ${SCRIPT_ROOT}/main.ts;;
        test)
            deno test --allow-read;;
    esac
}

main ${1}
