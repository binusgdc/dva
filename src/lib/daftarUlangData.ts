export type DaftarUlangDataEntry = {
    name: string
    nim: string
    discordUid: string
}

export interface DaftarUlangData {
    getUnprocessed(limit: number): Promise<DaftarUlangDataEntry[]>
    batchMarkAsProcessed(nims: string[]): void
}
