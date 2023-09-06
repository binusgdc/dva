import { Logger } from "./util/loggers/logger"
import { Result, error, ok } from "./util/result"

export type DaftarUlangDataEntry = {
    name: string
    nim: string
    discordUid: string
}

export interface DaftarUlangData {
    getUnprocessed(limit: number): Promise<DaftarUlangDataEntry[]>
    batchMarkAsProcessed(nims: string[]): void
}

export type ValidatedRegistrationDataEntry = {
    name: string
    nim: string
    homeRegion: string
}

export interface ValidatedRegistrationData {
    searchByNim(nim: string): Promise<ValidatedRegistrationDataEntry | undefined>
    batchSearchByNim(nims: string[]): Promise<Map<string, ValidatedRegistrationDataEntry>>
}

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

export class MemberVerificationService {
    private readonly daftarUlangData: DaftarUlangData
    private readonly validatedRegistrationData: ValidatedRegistrationData
    private readonly discordServerClient: DiscordServerClient
    private readonly logger: Logger

    constructor(
        daftarUlangData: DaftarUlangData,
        validatedRegistrationData: ValidatedRegistrationData,
        discordServerClient: DiscordServerClient,
        logger: Logger
    ) {
        this.daftarUlangData = daftarUlangData
        this.validatedRegistrationData = validatedRegistrationData
        this.discordServerClient = discordServerClient
        this.logger = logger
    }

    public async validateMembers(batchSize: number = 100, dryRun: boolean = true) {
        const queue = await this.daftarUlangData.getUnprocessed(batchSize)
        void this.logger.info(
            `${dryRun ? "[DRY RUN] " : ""}Booting up. Starting verification process, loaded ${
                queue.length
            } unprocessed entries.`
        )
        for (const daftarUlangEntry of queue) {
            void this.logger.info(
                `Processing: <@${daftarUlangEntry.discordUid}> | ${daftarUlangEntry.nim} ${daftarUlangEntry.name}`
            )
            void this.logger.info(`Searching in validated registrations:`)
            const validatedEntry = await this.validatedRegistrationData.searchByNim(
                daftarUlangEntry.nim
            )

            if (validatedEntry === undefined) {
                void this.logger.error(
                    `<@${daftarUlangEntry.discordUid}> not found in validated registration data. Moving on...`
                )
                continue
            }

            void this.logger.info(`Member found. Parsing Roles...`)

            const parseRolesResult = this.parseMemberRoleDetails(validatedEntry)

            if (!parseRolesResult.ok) {
                let errStr = `Roles could not be parsed: `
                if (parseRolesResult.error.regionParseError) {
                    errStr += `Region "${validatedEntry.homeRegion}" could not be parsed. `
                }
                if (parseRolesResult.error.angkatanParseError) {
                    errStr += `NIM "${validatedEntry.nim}" could not be parsed into angkatan.`
                }
                void this.logger.error(errStr)
                continue
            }

            const addRolesResult = await this.discordServerClient.applyMemberRoles(
                daftarUlangEntry.discordUid,
                parseRolesResult.value
            )

            void this.logger.info(`Roles distributed for <@${daftarUlangEntry.discordUid}>`)
        }
    }

    private parseMemberRoleDetails(entry: ValidatedRegistrationDataEntry): Result<
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
                : nim.startsWith("B25")
                ? "B25"
                : nim.startsWith("26")
                ? "B26"
                : nim.startsWith("27")
                ? "B27"
                : undefined
        }

        const regionParsed = parseRegionStr(entry.homeRegion)
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
