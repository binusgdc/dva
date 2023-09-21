import { REST, Routes } from "discord.js"

export class StudentDiscordServerClient {
    private readonly restClient: REST
    private readonly guildId: string
    private readonly studentRoleId: string

    constructor(
        restClient: REST,
        guildId: string,
        studentRoleId: string,
    ) {
        this.restClient = restClient
        this.guildId = guildId
        this.studentRoleId = studentRoleId
    }

    public async applyStudentRole(userId: string) {
        await this.restClient.put(Routes.guildMemberRole(this.guildId, userId, this.studentRoleId))
        await this.restClient.put(
            Routes.guildMemberRole(this.guildId, userId, this.studentRoleId)
        )
    }
}
