/** @param {NS} ns */
export async function main(ns) {
    const victim = ns.args[0]
    const result = await ns.hack(victim)
    ns.tprintf('money earned: %.3fm', result/1e6)
}