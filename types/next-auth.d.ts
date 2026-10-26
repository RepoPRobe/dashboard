import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        repoProbeAuthToken: string;
        error?: string
        user: {
            githubId: string
            login: string
        } & DefaultSession['user']
    }

    interface Profile {
        login: string
        id: number
        avatar_url: string
        url: string
        html_url: string
        type: string
        user_view_type: string
        site_admin: boolean
        name: string
        company: string | null
        email: string | null
        notification_email: string | null
        created_at: string
        updated_at: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken: string
        refreshToken: string
        accessTokenExpires: number
        githubId: string
        login: string
        error?: string
        repoProbeAuthToken?: string
    }
}