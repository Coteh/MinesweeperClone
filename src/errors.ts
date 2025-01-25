export class BoardOverfillException extends Error {
    constructor(message) {
        super(message);
        this.name = 'BoardOverfillException';
    }
}
