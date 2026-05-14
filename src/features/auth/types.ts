import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isMomentMember: boolean;
    };
  }

  interface User {
    isMomentMember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isMomentMember?: boolean;
  }
}
