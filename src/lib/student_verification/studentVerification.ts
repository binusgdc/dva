import { Logger } from "../../util/loggers/logger"
import { Result, error, ok } from "../../util/result"
import { StudentData, StudentDataEntry } from "./studentData"
import {
    StudentDiscordServerClient,
} from "./studentDiscordServerClient"

export class StudentVerificationService{

    private readonly studentData: StudentData
    private readonly discordServerClient: StudentDiscordServerClient
    private readonly logger: Logger

    constructor(
        studentData: StudentData,
        discordServerClient: StudentDiscordServerClient,
        logger: Logger
    ) {
        this.studentData = studentData
        this.discordServerClient = discordServerClient
        this.logger = logger
    }

    public async verifyStudents(startRow: number, batchSize: number) {
        const peekQueueResult = await this.studentData.peek(startRow, batchSize)

        if (!peekQueueResult.ok) {
            void this.logger.fatal("Unable to access registration data. Exiting...")
            return
        }

        const queue = peekQueueResult.value

        let unprocessedNims: string[] = [] 

        for (const entry of queue) {
            void this.logger.info(
                `Processing: <@${entry.discordUid}> | ${entry.nim} ${entry.name}`
            )
            void this.logger.info(`Parsing Roles...`)

            void this.logger.info(`Distributing roles for <@${entry.discordUid}>...`)

            try {
                await this.discordServerClient.applyStudentRole(entry.discordUid)
                void this.logger.info(`Roles distributed for <@${entry.discordUid}>`)
            } catch (error) {
                void this.logger.error(`Error distributing roles: ${error}`)
                unprocessedNims.push(entry.nim)
            }
            
        }

        void this.logger.info(`Batch finished. Here are the list of unprocessed NIMs: ${
            unprocessedNims.length == 0 ? "None" : unprocessedNims.join(" ")
        }`)
    }
}

