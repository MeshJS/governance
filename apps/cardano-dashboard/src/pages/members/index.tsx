import React from 'react';
import type { GetServerSideProps } from 'next';
import type { AuthPayload } from '@/utils/authCookie';
import { verifyAuthCookie } from '@/utils/authCookie';

interface Props {
    auth: AuthPayload | null;
}

export default function MembersHome({ auth }: Props) {
    if (!auth) {
        return (
            <div style={{ padding: 24 }}>
                <h1>Members Area</h1>
                <p>Please sign in with your wallet to access this page.</p>
            </div>
        );
    }
    return (
        <div style={{ padding: 24 }}>
            <h1>Members Area</h1>
            <p>Welcome, {auth.address}</p>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
    const cookie = req.cookies['cd_auth'];
    const auth = verifyAuthCookie(cookie);
    return { props: { auth } };
};


