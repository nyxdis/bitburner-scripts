export function root(ns, target) {
    if (ns.fileExists('BruteSSH.exe', 'home')) {
        ns.brutessh(server);
    }
    if (ns.fileExists('FTPCrack.exe', 'home')) {
        ns.ftpcrack(server);
    }
    if (ns.fileExists('relaySMTP.exe', 'home')) {
        ns.relaysmtp(server);
    }
    if (ns.fileExists('HTTPWorm.exe', 'home')) {
        ns.httpworm(server);
    }
    if (ns.fileExists('SQLInject.exe', 'home')) {
        ns.sqlinject(server);
    }
    ns.nuke(server);

}