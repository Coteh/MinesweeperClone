export class BoardOverfillException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BoardOverfillException';
    }
}
