/** @param {NS} ns */
export async function main(ns) {
    const victim = ns.args[0]
    await ns.weaken(victim)
}