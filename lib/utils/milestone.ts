export type Milestone = {
    name: string
    badge: string
    threshold: number
}

export const MILESTONES: Milestone[] = [
    { name: 'Awakened', badge: '/badges/awakened.svg', threshold: 0 },
    { name: 'Contender', badge: '/badges/contender.svg', threshold: 1440 },
    { name: 'Sovereign', badge: '/badges/sovereign.svg', threshold: 7200 },
    { name: 'Architect', badge: '/badges/architect.svg', threshold: 21600 },
    { name: 'Chronarch', badge: '/badges/chronarch.svg', threshold: 72000 },
    { name: 'Sovereign Prime', badge: '/badges/sovereign-prime.svg', threshold: 216000 },
]

export function getMilestone(totalKT: number): Milestone {
    const reached = MILESTONES.filter(m => totalKT >= m.threshold)
    return reached[reached.length - 1]
}
