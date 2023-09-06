import {
    ApplicationCommandData,
    ApplicationCommandOptionType,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
} from "discord.js"
import { AbstractCommandHandler } from "../discord/commandHandler"
import { MemberVerificationService } from "../lib/memberVerification"

export class VerifyMembersCommandHandler extends AbstractCommandHandler {
    private readonly memberVerificationService: MemberVerificationService

    constructor(memberVerificationService: MemberVerificationService) {
        super()
        this.memberVerificationService = memberVerificationService
    }

    public getSignature(): ApplicationCommandData {
        return {
            name: "verifynewmembers",
            description: "Verify members based on registration data",
            options: [
                {
                    name: "dryrun",
                    description: "Whether to do a dry run, with no effects. True by default.",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false,
                },
                {
                    name: "batchsize",
                    description:
                        "The limit of how many members to attempt to process on this command.",
                    type: ApplicationCommandOptionType.Integer,
                    required: false,
                },
            ],
        }
    }

    public async handle(interaction: ChatInputCommandInteraction) {
        const batchSize = interaction.options.getInteger("batchsize") ?? 5
        const isDryRun = interaction.options.getBoolean("dryrun") ?? true

        await interaction.reply("Command Received.")

        await this.memberVerificationService.verifyMembers(batchSize, isDryRun)
    }
}
