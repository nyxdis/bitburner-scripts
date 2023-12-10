/**
 * 
 * @param {NS} ns 
 */
export async function main(ns) {
    const target = ns.args[0]
    const weakenRam = ns.getScriptRam('/newserver/weaken.js')
    const growRam = ns.getScriptRam('/newserver/grow.js') * 12
    const totalRam = weakenRam + growRam
    prime(ns, target, 'home', totalRam)
    for (const server of ns.getPurchasedServers()) {
        prime(ns, target, server, totalRam)
    }
}

/**
 * 
 * @param {NS} ns 
 * @param {string} target 
 * @param {string} _host 
 * @param {number} totalRam 
 */
function prime(ns, target, _host, totalRam) {
    const host = ns.getServer(_host)
    const freeRam = host.maxRam - host.ramUsed
    const threadMult = Math.floor(freeRam / totalRam)
    ns.tprint('Running simple-prime with ', threadMult, ' threads on ', host.hostname)
    ns.exec('/newserver/grow.js', host.hostname, 12 * threadMult, target, 0)
    ns.exec('/newserver/weaken.js', host.hostname, threadMult, target, 0)
}