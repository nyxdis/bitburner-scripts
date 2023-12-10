/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0]
    
    // Defines how much money a server should have before we hack it
    // In this case, it is set to the maximum amount of money.
    const moneyMax = ns.getServerMaxMoney(target)
    const moneyThresh = moneyMax*0.9

    // Defines the maximum security level the target server can
    // have. If the target's security level is higher than this,
    // we'll weaken it before doing anything else
    const securityMin = ns.getServerMinSecurityLevel(target)
    const securityThresh = securityMin*1.1

    // Infinite loop that continously hacks/grows/weakens the target server
    while(true) {
        const sec = ns.getServerSecurityLevel(target)
        const money = ns.getServerMoneyAvailable(target)

        if (sec > securityThresh) {
            ns.printf("security level: %f/%f (%d %%)", sec, securityMin, sec/securityMin*100)
            // If the server's security level is above our threshold, weaken it
            await ns.weaken(target);
        } else if (money < moneyThresh) {
            ns.printf("money: %d/%d (%d %%)", money, moneyMax, money/moneyMax*100)
            // If the server's money is less than our threshold, grow it
            await ns.grow(target);
        } else {
            // Otherwise, hack it
            await ns.hack(target);
        }
    }
}