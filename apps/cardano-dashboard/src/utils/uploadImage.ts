export type UploadImageOutput = {
    cid: string;
    gatewayUrl: string;
    ipfsUri: string;
};

export async function uploadImageToPinata({ file }: { file: File; }): Promise<UploadImageOutput> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload-to-pinata', {
        method: 'POST',
        body: form,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to upload image');
    }
    return res.json();
}


