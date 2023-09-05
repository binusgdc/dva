import { google } from "googleapis"
import { z } from "zod"

const batchSize = 20

async function main() {
    const reRegistSheetId = process.env.REREGIST_SHEET_ID

    const parseCreds = z
        .object({
            project_id: z.string().nonempty(),
            private_key: z.string().nonempty(),
            client_email: z.string().nonempty(),
        })
        .safeParse(
            JSON.parse(Buffer.from(process.env.GSHEETS_JSON_KEY_64 as string, "base64").toString())
        )

    if (!parseCreds.success) {
        console.log("could not parse creds")
        return
    }

    const creds = parseCreds.data

    const auth = new google.auth.GoogleAuth({
        projectId: creds.project_id,
        credentials: {
            client_email: creds.client_email,
            private_key: creds.private_key,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheetsClient = google.sheets({
        version: "v4",
        auth: auth,
    })

    const sheetsGrabResult = await sheetsClient.spreadsheets.values.get({
        spreadsheetId: reRegistSheetId,
        range: `DaftarUlangUnprocessed!A2:D${batchSize + 1}`,
    })

    console.log(sheetsGrabResult.data)

    const daftarUlangSchema = z.array(z.tuple([z.string(), z.string(), z.string(), z.string()]))

    const daftarUlangParseResult = daftarUlangSchema.safeParse(sheetsGrabResult.data.values)

    if (!daftarUlangParseResult.success) {
        return
    }

    for (const row of daftarUlangParseResult.data) {
        console.log(row)
    }

    const processedIds = daftarUlangParseResult.data.map((e) => e[3])

    const lookupFill = await sheetsClient.spreadsheets.values.update({
        spreadsheetId: reRegistSheetId,
        range: `UidLookup!A2:A${processedIds.length + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: processedIds.map((e) => [e]),
        },
    })

    const getTargetCellsResult = await sheetsClient.spreadsheets.values.get({
        spreadsheetId: reRegistSheetId,
        range: `UidLookup!C2:C${processedIds.length + 1}`,
    })

    for (const result in getTargetCellsResult.data.values) {
        console.log(result)
    }
}

void main()
