import { NS } from "@ns"

export async function main(ns: NS) {
    const server = ns.args[0]
    const sleeptime = ns.args[1]
    if (typeof(server) === "string" && typeof(sleeptime) === "number") {
        await ns.sleep(sleeptime)
        await ns.hack(server)
    }
}