import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export interface DataGSMProfile {
  id: number;
  email: string;
  role: string;
  isStudent: boolean;
  student?: {
    id: number;
    name: string;
    grade?: number;
    classNum?: number;
    number?: number;
    studentNumber?: number;
    major?: string;
  } | null;
}

type DataGSMChecks = ("pkce" | "state" | "none")[];

export function DataGSMProvider(
  options: OAuthUserConfig<DataGSMProfile>,
): OAuthConfig<DataGSMProfile> {
  const checks: DataGSMChecks = ["pkce", "state"];

  return {
    ...options,
    id: "datagsm",
    name: "DataGSM",
    type: "oauth",
    authorization: {
      url: "https://oauth.authorization.datagsm.kr/v1/oauth/authorize",
      params: { response_type: "code", scope: "datagsm:self_read" },
    },
    token: `${process.env.AUTH_URL}/api/auth/token`,
    userinfo: "https://oauth.resource.datagsm.kr/userinfo",
    client: { token_endpoint_auth_method: "client_secret_post" },
    checks,
    profile(profile) {
      return {
        id: String(profile.id),
        email: profile.email,
        name: profile.student?.name ?? profile.email,
      };
    },
  };
}
