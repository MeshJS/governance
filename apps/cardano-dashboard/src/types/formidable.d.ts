declare module 'formidable' {
    export type Fields = Record<string, unknown>;
    export type Files = Record<string, unknown>;
    export type File = { filepath: string; originalFilename?: string | null };
    const formidable: any;
    export default formidable;
}


