import { ApplicationCommandData, ChatInputCommandInteraction } from "discord.js"

export interface CommandHandler {
    handle(command: ChatInputCommandInteraction): Promise<void>
}

export abstract class AbstractCommandHandler implements CommandHandler {
    public abstract getSignature(): ApplicationCommandData
    public abstract handle(command: ChatInputCommandInteraction): Promise<void>
}
