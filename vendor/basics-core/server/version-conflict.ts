export class VersionConflictError extends Error {
    constructor(public readonly table: string, public readonly id: string) {
        super(`Version conflict on ${table}:${id}`);
        this.name = 'VersionConflictError';
    }
}
