/** @param {NS} ns */
export async function main(ns) {
    const wait = ns.args[0]
    const victim = ns.args[1]
  
    await ns.sleep(wait)
    await ns.grow(victim)
}