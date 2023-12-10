/** @param {NS} ns */
export async function main(ns) {
    ns.tprintf('Karma: %d', ns.heart.break())
    ns.tprintf('People killed: %d', ns.getPlayer().numPeopleKilled)
}