import { z } from "zod"

const rawSchema = z.object({
    BOT_TOKEN: z.string().nonempty(),
    REREGIST_SHEET_ID: z.string().nonempty(),
    VALIDATED_REGIST_SHEET_ID: z.string().nonempty(),
    GSHEETS_JSON_KEY_64: z.string().nonempty(),
})

const envSchema = z.object({
    BOT_TOKEN: z.string().nonempty(),
    REREGIST_SHEET_ID: z.string().nonempty(),
    VALIDATED_REGIST_SHEET_ID: z.string().nonempty(),
    GSHEETS_CREDENTIALS: z.object({
        project_id: z.string().nonempty(),
        private_key: z.string().nonempty(),
        client_email: z.string().nonempty(),
    }),
})

export type Env = z.infer<typeof envSchema>

export function loadAndParseEnv(): Env | undefined {
    const rawParseResult = rawSchema.safeParse({
        BOT_TOKEN: process.env.BOT_TOKEN,
        REREGIST_SHEET_ID: process.env.REREGIST_SHEET_ID,
        VALIDATED_REGIST_SHEET_ID: process.env.VALIDATED_REGIST_SHEET_ID,
        GSHEETS_JSON_KEY_64: process.env.GSHEETS_JSON_KEY_64,
    })
    if (!rawParseResult.success) {
        return undefined
    }
    const gsheetsDecoded = JSON.parse(
        Buffer.from(process.env.GSHEETS_JSON_KEY_64 as string, "base64").toString()
    )
    const envParseResult = envSchema.safeParse({
        ...rawParseResult,
        GSHEETS_CREDENTIALS: gsheetsDecoded,
    })
    if (!envParseResult.success) {
        return undefined
    }
    return envParseResult.data
}
