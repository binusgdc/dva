export type ValidatedRegistrationDataEntry = {
    name: string
    nim: string
    homeRegion: string
}

export interface ValidatedRegistrationData {
    searchByNim(nim: string): Promise<ValidatedRegistrationDataEntry | undefined>
    batchSearchByNim(nims: string[]): Promise<Map<string, ValidatedRegistrationDataEntry>>
}
