export type MemberRegion =
    | "Kemanggisan"
    | "AlamSutera"
    | "Bandung"
    | "Malang"
    | "Semarang"
    | "Senayan"
    | "Bekasi"
    | "Online"

export type BinusianAngkatan = "B24" | "B25" | "B26" | "B27"

export type MemberRoleDetails = {
    angkatan: BinusianAngkatan
    region: MemberRegion
}

export interface DiscordServerClient {
    applyMemberRoles(discordUserId: string, memberRoleDetails: MemberRoleDetails): Promise<boolean>
}
