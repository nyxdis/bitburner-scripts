/** @param {NS} ns **/
export async function main(ns) {
    // ns.exec('/newserver/weaken.js', server2, 1, server, wsleep, 1, shiftCount, sleepTime);
    var server = ns.args[0];
    var sleeptime = ns.args[1];
    var ii = ns.args[2];
    await ns.sleep(sleeptime);
    await ns.weaken(server);
}