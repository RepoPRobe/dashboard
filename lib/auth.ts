import type { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'read:user read:org'
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account?.provider === 'github' && profile) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/github-login`, {
                        method: 'POST',
                        signal: AbortSignal.timeout(10_000),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            githubUserId: profile.id,
                            githubLogin: profile.login,
                            name: profile.name,
                            avatarUrl: profile.avatar_url,
                            htmlUrl: profile.html_url,
                            accessToken: account.access_token,
                            accessTokenExpiry: account.expires_at ? account.expires_at * 1000 : 0,
                            refreshToken: account.refresh_token,
                            refreshTokenExpiry: account.refresh_token_expires_in
                                ? Date.now() + Number(account.refresh_token_expires_in) * 1000
                                : 0,
                        }),
                    });
                    const parsed: { success?: boolean; token?: string } = await response.json();
                    if (response.ok && parsed.success && parsed.token) {
                        token.repoProbeAuthToken = parsed.token;
                        delete token.error;
                    } else {
                        throw new Error('RepoPRobeLoginFailed');
                    }
                } catch (error) {
                    console.error('[/github-login] Error:', error);
                    throw new Error('RepoPRobeLoginFailed');
                }
            }

            if (account) {
                token.accessToken = account.access_token?.toString() ?? '';
                token.githubId = profile?.id?.toString() ?? '';
                token.login = profile?.login ?? '';
            }
            return token
        },
        async session({ session, token }) {
            session.repoProbeAuthToken = token.repoProbeAuthToken ?? '';
            session.error = token.error;
            session.user.githubId = token.githubId?.toString() ?? '';
            session.user.login = token.login ?? '';
            return session
        },
    }
}