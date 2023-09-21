import { sheets_v4 } from "googleapis"
import { Result, error, ok } from "../../util/result"
import { z } from "zod"

export type StudentDataEntry = {
    nim: string
    name: string
    discordUid: string
}

export interface StudentData{
    peek(start: number, limit: number): Promise<Result<StudentDataEntry[]>>
}

export class SheetsStudentData implements StudentData{
    private readonly sheetsClient: sheets_v4.Sheets
    private readonly spreadsheetId: string
    private readonly studentsDataSchema = z.tuple([
        z.string().nonempty(),
        z.string().nonempty(),
        z.string().nonempty(),
    ])

    constructor(sheetsClient: sheets_v4.Sheets, spreadsheetId: string) {
        this.sheetsClient = sheetsClient
        this.spreadsheetId = spreadsheetId
    }

    public async peek(start: number, limit: number): Promise<Result<StudentDataEntry[]>>{
        try {
            const sheetsGetEntriesResult = await this.sheetsClient.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `Student to Assign to!A${start}:F${limit + 1}`,
            })

            const studentParseResult = sheetsGetEntriesResult.data.values
                ?.map((row) => this.studentsDataSchema.safeParse(row))
                .map((result) => (result.success ? result.data : undefined))
                .filter((result) => result !== undefined) as z.infer<
                typeof this.studentsDataSchema
            >[]

            if (studentParseResult === undefined) {
                return error(undefined)
            }

            for (const row of studentParseResult) {
                const [nim, _name, _uid] = row
            }

            return ok(
                studentParseResult.map<StudentDataEntry>((e) => ({
                    nim: e[0],
                    name: e[1],
                    discordUid: e[2],
                }))
            )
        } catch (e) {
            return error(undefined)
        }
    }
}