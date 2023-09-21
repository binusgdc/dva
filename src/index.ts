import { VerifyMembersCommandHandler } from "./commands/verifyMembers"
import { AbstractCommandHandler, CommandHandler } from "./discord/commandHandler"
import { RoutingCommandHandler } from "./discord/router"
import { MemberVerificationService } from "./lib/memberVerification"
import { loadAndParseEnv } from "./util/env"
import { ApplicationCommandData, CacheType, Client, Interaction, REST, Snowflake } from "discord.js"
import { DiscordChannelLogger } from "./util/loggers/discordChannelLogger"
import { google } from "googleapis"
import { SheetsDaftarUlangData } from "./lib/daftarUlangData"
import { DiscordServerClient } from "./lib/discordServerClient"
import { CompositeLogger } from "./util/loggers/compositeLogger"
import { ConsoleLogger } from "./util/loggers/consoleLogger"
import { StudentVerificationService} from "./lib/student_verification/studentVerification"
import { SheetsStudentData } from "./lib/student_verification/studentData"
import { StudentDiscordServerClient } from "./lib/student_verification/studentDiscordServerClient"
import { VerifyStudentsCommandHandler } from "./commands/verifyStudents"

async function main() {
    const env = loadAndParseEnv()
    if (env === undefined) {
        console.error("Error parsing ENV")
        return
    }

    const botClient = new Client({ intents: [] })
    const restClient = new REST({
        version: "10",
    }).setToken(env.BOT_TOKEN)

    const googleAuth = new google.auth.GoogleAuth({
        projectId: env.GSHEETS_CREDENTIALS.project_id,
        credentials: {
            client_email: env.GSHEETS_CREDENTIALS.client_email,
            private_key: env.GSHEETS_CREDENTIALS.private_key,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })
    const sheetsClient = google.sheets({
        version: "v4",
        auth: googleAuth,
    })

    const discordChannelLogger = new DiscordChannelLogger(restClient, env.LOG_CHANNEL_ID)
    const daftarUlangData = new SheetsDaftarUlangData(sheetsClient, env.REREGIST_SHEET_ID)
    const discordServerClient = new DiscordServerClient(
        restClient,
        env.GUILD_ID,
        env.VISITOR_ROLE_ID,
        env.MEMBER_ROLE_ID,
        env.NEW_MEMBER_ROLE_ID,
        {
            B24: env.B24_ROLE_ID,
            B25: env.B25_ROLE_ID,
            B26: env.B26_ROLE_ID,
            B27: env.B27_ROLE_ID,
        },
        {
            Kemanggisan: env.KMG_ROLE_ID,
            AlamSutera: env.AS_ROLE_ID,
            Senayan: env.SNY_ROLE_ID,
            Malang: env.MLG_ROLE_ID,
            Bandung: env.BDG_ROLE_ID,
            Bekasi: env.BKS_ROLE_ID,
            Semarang: env.SMG_ROLE_ID,
            Online: env.ONL_ROLE_ID,
        }
    )

    const memberVerificationService = new MemberVerificationService(
        daftarUlangData,
        discordServerClient,
        new CompositeLogger([discordChannelLogger, new ConsoleLogger()])
    )

    //verify students stuffs
    const studentData = new SheetsStudentData(sheetsClient, env.STUDENT_SHEET_ID)
    const studentDiscordServerClient = new StudentDiscordServerClient(
        restClient,
        env.GUILD_ID,
        env.STUDENT_ROLE_ID
    )

    const studentVerificationService = new StudentVerificationService(
        studentData,
        studentDiscordServerClient,
        new CompositeLogger([discordChannelLogger, new ConsoleLogger()])
    )

    const commands: AbstractCommandHandler[] = [
        new VerifyMembersCommandHandler(memberVerificationService),
        new VerifyStudentsCommandHandler(studentVerificationService)
    ]
    const router = new RoutingCommandHandler(
        commands.map((c) => ({ route: c.getSignature().name, handler: c }))
    )
    botClient.on("ready", async () => {
        await reRegisterCommands(
            botClient,
            env.GUILD_ID,
            commands.map((cmd) => cmd.getSignature())
        )

        if (!botClient.user) {
            console.log(">>> Something went wrong :(")
            return
        }

        console.log(`>>> Logged in as ${botClient.user.tag}`)
        console.log(">>> Hyvää päivää!")
    })
    botClient.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return
        await router.handle(interaction)
    })

    await botClient.login(env.BOT_TOKEN)
}

async function reRegisterCommands(
    client: Client,
    guildId: Snowflake,
    commands: ApplicationCommandData[]
) {
    const guild = await client.guilds.fetch(guildId)

    for (const command of commands) {
        await guild.commands.create(command)
    }
}

void main()
