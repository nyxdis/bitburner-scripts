/** @param {NS} ns **/
export async function main(ns) {
    var server = ns.args[0];
    var sleeptime = ns.args[1];
    var ii = ns.args[2];
    await ns.sleep(sleeptime);
    await ns.grow(server);
}