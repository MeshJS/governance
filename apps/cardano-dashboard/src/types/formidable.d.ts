declare module 'formidable' {
    export type Fields = Record<string, unknown>;
    export type Files = Record<string, unknown>;
    export type File = { filepath: string; originalFilename?: string | null };

    export type FormidableOptions = {
        multiples?: boolean;
        maxFiles?: number;
        [key: string]: unknown;
    };

    export type Form = {
        parse: (
            req: unknown,
            cb: (err: unknown, fields: Fields, files: Files) => void
        ) => void;
    };

    const formidable: (options?: FormidableOptions) => Form;
    export default formidable;
}


