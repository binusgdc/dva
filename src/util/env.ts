import { z } from "zod"

const rawSchema = z.object({
    BOT_TOKEN: z.string().nonempty(),
    LOG_CHANNEL_ID: z.string().nonempty(),
    REREGIST_SHEET_ID: z.string().nonempty(),
    GSHEETS_JSON_KEY_64: z.string().nonempty(),
    GUILD_ID: z.string().nonempty(),
    VISITOR_ROLE_ID: z.string().nonempty(),
    MEMBER_ROLE_ID: z.string().nonempty(),
    NEW_MEMBER_ROLE_ID: z.string().nonempty(),
    B27_ROLE_ID: z.string().nonempty(),
    B26_ROLE_ID: z.string().nonempty(),
    B25_ROLE_ID: z.string().nonempty(),
    B24_ROLE_ID: z.string().nonempty(),
    KMG_ROLE_ID: z.string().nonempty(),
    AS_ROLE_ID: z.string().nonempty(),
    SNY_ROLE_ID: z.string().nonempty(),
    MLG_ROLE_ID: z.string().nonempty(),
    BDG_ROLE_ID: z.string().nonempty(),
    BKS_ROLE_ID: z.string().nonempty(),
    SMG_ROLE_ID: z.string().nonempty(),
    ONL_ROLE_ID: z.string().nonempty(),
})

const envSchema = z.object({
    BOT_TOKEN: z.string().nonempty(),
    LOG_CHANNEL_ID: z.string().nonempty(),
    REREGIST_SHEET_ID: z.string().nonempty(),
    GSHEETS_CREDENTIALS: z.object({
        project_id: z.string().nonempty(),
        private_key: z.string().nonempty(),
        client_email: z.string().nonempty(),
    }),
    GUILD_ID: z.string().nonempty(),
    VISITOR_ROLE_ID: z.string().nonempty(),
    MEMBER_ROLE_ID: z.string().nonempty(),
    NEW_MEMBER_ROLE_ID: z.string().nonempty(),
    B27_ROLE_ID: z.string().nonempty(),
    B26_ROLE_ID: z.string().nonempty(),
    B25_ROLE_ID: z.string().nonempty(),
    B24_ROLE_ID: z.string().nonempty(),
    KMG_ROLE_ID: z.string().nonempty(),
    AS_ROLE_ID: z.string().nonempty(),
    SNY_ROLE_ID: z.string().nonempty(),
    MLG_ROLE_ID: z.string().nonempty(),
    BDG_ROLE_ID: z.string().nonempty(),
    BKS_ROLE_ID: z.string().nonempty(),
    SMG_ROLE_ID: z.string().nonempty(),
    ONL_ROLE_ID: z.string().nonempty(),
})

export type Env = z.infer<typeof envSchema>

export function loadAndParseEnv(): Env | undefined {
    const rawParseResult = rawSchema.safeParse({
        ...process.env,
    })
    if (!rawParseResult.success) {
        return undefined
    }
    const gsheetsDecoded = JSON.parse(
        Buffer.from(process.env.GSHEETS_JSON_KEY_64 as string, "base64").toString()
    )
    const envParseResult = envSchema.safeParse({
        ...rawParseResult.data,
        GSHEETS_CREDENTIALS: gsheetsDecoded,
    })
    if (!envParseResult.success) {
        console.error(envParseResult.error)
        return undefined
    }
    return envParseResult.data
}
