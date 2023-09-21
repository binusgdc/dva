import {
    ApplicationCommandData,
    ApplicationCommandOptionType,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
} from "discord.js"
import { AbstractCommandHandler } from "../discord/commandHandler"
import { StudentVerificationService } from "../lib/student_verification/studentVerification"

export class VerifyStudentsCommandHandler extends AbstractCommandHandler {
    private readonly studentVerificationService: StudentVerificationService

    constructor(studentVerificationService: StudentVerificationService) {
        super()
        this.studentVerificationService = studentVerificationService
    }

    public getSignature(): ApplicationCommandData {
        return {
            name: "verifystudents",
            description: "Verify students based on class registration data",
            options: [
                {
                    name: "start-row",
                    description: "The row to start on the gsheet.",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
                {
                    name: "batchsize",
                    description:
                        "The limit of how many members to attempt to process on this command.",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
        }
    }

    public async handle(interaction: ChatInputCommandInteraction) {
        const startRow = interaction.options.getInteger("startRow") ?? 2
        const batchSize = interaction.options.getInteger("batchsize") ?? 5

        await interaction.reply("Command Received.")

        await this.studentVerificationService.verifyStudents(startRow, batchSize)
    }
}