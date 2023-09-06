import { Logger } from "../util/loggers/logger"
import { Result, error, ok } from "../util/result"
import { DaftarUlangData, DaftarUlangDataEntry } from "./daftarUlangData"
import {
    DiscordServerClient,
    MemberRoleDetails,
    MemberRegion,
    BinusianAngkatan,
} from "./discordServerClient"

export class MemberVerificationService {
    private readonly daftarUlangData: DaftarUlangData
    private readonly discordServerClient: DiscordServerClient
    private readonly logger: Logger

    constructor(
        daftarUlangData: DaftarUlangData,
        discordServerClient: DiscordServerClient,
        logger: Logger
    ) {
        this.daftarUlangData = daftarUlangData
        this.discordServerClient = discordServerClient
        this.logger = logger
    }

    public async verifyMembers(batchSize: number, isDryRun: boolean) {
        const peekQueueResult = await this.daftarUlangData.peekUnprocessed(batchSize)

        if (!peekQueueResult.ok) {
            void this.logger.fatal("Unable to access registration data. Exiting...")
            return
        }

        const queue = peekQueueResult.value

        void this.logger.info(
            `${isDryRun ? "[DRY RUN] " : ""}Booting up. Starting verification process, loaded ${
                queue.length
            } unprocessed entries.`
        )

        let processedNims: string[] = []

        for (const entry of queue) {
            void this.logger.info(
                `Processing: <@${entry.discordUid}> | ${entry.nim} ${entry.name} from ${entry.region}`
            )
            void this.logger.info(`Parsing Roles...`)
            const parseRolesResult = this.parseMemberRoleDetails(entry)

            if (!parseRolesResult.ok) {
                let errStr = `Roles could not be parsed: `
                if (parseRolesResult.error.regionParseError) {
                    errStr += `Region "${entry.region}" could not be parsed. `
                }
                if (parseRolesResult.error.angkatanParseError) {
                    errStr += `NIM "${entry.nim}" could not be parsed into angkatan.`
                }
                void this.logger.error(errStr)
                void this.logger.error(`Skipping <@${entry.discordUid}>...`)
                continue
            }

            void this.logger.info(`Distributing roles for <@${entry.discordUid}>...`)

            if (!isDryRun) {
                try {
                    await this.discordServerClient.applyRoleDistribution(
                        entry.discordUid,
                        parseRolesResult.value
                    )
                    void this.logger.info(`Roles distributed for <@${entry.discordUid}>`)
                } catch (error) {
                    void this.logger.error(`Error distributing roles: ${error}`)
                    void this.logger.info(`Aborting process due to failure...`)
                    return
                }
            }

            processedNims.push(entry.nim)
        }

        void this.logger.info(`Batch finished. Processed: ${processedNims.length}.`)

        if (!isDryRun) {
            await this.daftarUlangData.popUnprocessed(processedNims)
        }
    }

    private parseMemberRoleDetails(entry: DaftarUlangDataEntry): Result<
        MemberRoleDetails,
        {
            regionParseError: boolean
            angkatanParseError: boolean
        }
    > {
        function parseRegionStr(str: string): MemberRegion | undefined {
            switch (str) {
                case "BINUS @Kemanggisan":
                    return "Kemanggisan"
                case "BINUS @Alam Sutera":
                    return "AlamSutera"
                case "BINUS @Bandung":
                    return "Bandung"
                case "BINUS @Malang":
                    return "Malang"
                case "BINUS @Semarang":
                    return "Semarang"
                case "BINUS @Senayan":
                    return "Senayan"
                case "BINUS @Bekasi":
                    return "Bekasi"
                case "BINUS @Online Learning":
                    return "Online"
                default:
                    return undefined
            }
        }

        function parseAngkatanFromNimStr(nim: string): BinusianAngkatan | undefined {
            return nim.startsWith("24")
                ? "B24"
                : nim.startsWith("25")
                ? "B25"
                : nim.startsWith("26")
                ? "B26"
                : nim.startsWith("27")
                ? "B27"
                : undefined
        }

        const regionParsed = parseRegionStr(entry.region)
        const angkatanParsed = parseAngkatanFromNimStr(entry.nim)

        if (regionParsed === undefined || angkatanParsed === undefined) {
            return error({
                regionParseError: regionParsed === undefined,
                angkatanParseError: angkatanParsed === undefined,
            })
        }

        return ok({
            angkatan: angkatanParsed,
            region: regionParsed,
        })
    }
}
