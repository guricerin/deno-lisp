#!/bin/bash
set -eu

readonly SCRIPT_ROOT=$(cd $(dirname ${0}); pwd)

main() {
    case ${1} in
        run)
            deno run ${SCRIPT_ROOT}/main.ts;;
        test)
            deno test --allow-read;;
        *)
            deno run --allow-read ${SCRIPT_ROOT}/main.ts ${1};;
    esac
}

main ${1}
