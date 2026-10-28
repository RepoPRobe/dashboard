export interface UserType {
    id: string;
    login: string; // username
    avatarUrl: string;
    githubUrl: string;
    userType: string;
}

export type GithubInstallationType = {
    _id: string;
    installationId: string;
    ownedBy?: UserType | null;
    githubRedirect: string;
    target: {
        id: string;
        accountType: string;
    };
    installedBy?: UserType | null;
    suspendedAt?: Date | null;
    installedOn?: Date | null;
    deletedAt?: Date | null;
    lastUpdatedAt?: Date | null;
    repositorySelection: "all" | "selected";
    createdAt: Date;
    updatedAt: Date;
}