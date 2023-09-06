import { REST, Routes } from "discord.js"

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

export class DiscordServerClient {
    private readonly restClient: REST
    private readonly guildId: string
    private readonly visitorRoleId: string
    private readonly memberRoleId: string
    private readonly newMemberRoleId: string
    private readonly angkatanRoleIds: Record<BinusianAngkatan, string>
    private readonly regionRoleIds: Record<MemberRegion, string>

    constructor(
        restClient: REST,
        guildId: string,
        visitorRoleId: string,
        memberRoleId: string,
        newMemberRoleId: string,
        angkatanRoleIds: Record<BinusianAngkatan, string>,
        regionRoleIds: Record<MemberRegion, string>
    ) {
        this.restClient = restClient
        this.guildId = guildId
        this.visitorRoleId = visitorRoleId
        this.memberRoleId = memberRoleId
        this.newMemberRoleId = newMemberRoleId
        this.angkatanRoleIds = angkatanRoleIds
        this.regionRoleIds = regionRoleIds
    }
    public async applyRoleDistribution(userId: string, details: MemberRoleDetails) {
        await this.removeVisitorRole(userId)
        await this.applyMemberRole(userId)
        await this.applyAngkatanRole(userId, details.angkatan)
        await this.applyRegionRole(userId, details.region)
    }
    private async removeVisitorRole(userId: string) {
        await this.restClient.delete(
            Routes.guildMemberRole(this.guildId, userId, this.visitorRoleId)
        )
    }
    private async applyMemberRole(userId: string) {
        await this.restClient.put(Routes.guildMemberRole(this.guildId, userId, this.memberRoleId))
        await this.restClient.put(
            Routes.guildMemberRole(this.guildId, userId, this.newMemberRoleId)
        )
    }
    private async applyAngkatanRole(userId: string, angkatan: BinusianAngkatan) {
        await this.restClient.put(
            Routes.guildMemberRole(this.guildId, userId, this.angkatanRoleIds[angkatan])
        )
    }
    private async applyRegionRole(userId: string, region: MemberRegion) {
        await this.restClient.put(
            Routes.guildMemberRole(this.guildId, userId, this.regionRoleIds[region])
        )
    }
}
