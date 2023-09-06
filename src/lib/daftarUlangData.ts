import { sheets_v4 } from "googleapis"
import { Result, error, ok } from "../util/result"
import { z } from "zod"

export type DaftarUlangDataEntry = {
    name: string
    nim: string
    discordUid: string
    region: string
}

export interface DaftarUlangData {
    // return the top entries that are in the queue
    peekUnprocessed(limit: number): Promise<Result<DaftarUlangDataEntry[]>>
    // pop entries from the top whose keys match the filter
    popUnprocessed(nims: string[]): Promise<void>
}

export class SheetsDaftarUlangData implements DaftarUlangData {
    private readonly sheetsClient: sheets_v4.Sheets
    private readonly spreadsheetId: string
    private readonly daftarUlangSchema = z.tuple([
        z.string().nonempty(),
        z.string().nonempty(),
        z.string().nonempty(),
        z.string().nonempty(),
        z.string().nonempty(),
        z.string().nonempty(),
    ])
    private readonly markCellBuffer: Map<string, string> = new Map()

    constructor(sheetsClient: sheets_v4.Sheets, spreadsheetId: string) {
        this.sheetsClient = sheetsClient
        this.spreadsheetId = spreadsheetId
    }
    public async peekUnprocessed(limit: number): Promise<Result<DaftarUlangDataEntry[]>> {
        try {
            this.markCellBuffer.clear()

            const sheetsGetEntriesResult = await this.sheetsClient.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `DaftarUlangUnprocessedValidated!A2:F${limit + 1}`,
            })

            const daftarUlangParseResult = sheetsGetEntriesResult.data.values
                ?.map((row) => this.daftarUlangSchema.safeParse(row))
                .map((result) => (result.success ? result.data : undefined))
                .filter((result) => result !== undefined) as z.infer<
                typeof this.daftarUlangSchema
            >[]

            if (daftarUlangParseResult === undefined) {
                return error(undefined)
            }

            for (const row of daftarUlangParseResult) {
                const [_name, nim, _username, _uid, _region, markCell] = row
                this.markCellBuffer.set(nim, markCell)
            }

            return ok(
                daftarUlangParseResult.map<DaftarUlangDataEntry>((e) => ({
                    name: e[0],
                    nim: e[1],
                    discordUid: e[3],
                    region: e[4],
                }))
            )
        } catch (e) {
            return error(undefined)
        }
    }
    public async popUnprocessed(nims: string[]): Promise<void> {
        const markCells = nims
            .map((e) => this.markCellBuffer.get(e))
            .filter((e) => e !== undefined) as string[]

        const markResult = await this.sheetsClient.spreadsheets.values.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                data: markCells.map((cell) => ({
                    range: `DaftarUlang!${cell}`,
                    values: [["TRUE"]],
                })),
                valueInputOption: "USER_ENTERED",
            },
        })
    }
}
