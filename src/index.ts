import { loadAndParseEnv } from "./util/env"

async function main() {
    const env = loadAndParseEnv()
    if (env === undefined) {
        return
    }
}

void main()
