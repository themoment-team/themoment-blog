export type Role = "Frontend" | "Server" | "DevOps" | "Design";

export interface Member {
  name: string;
  githubId: string;
  role: Role;
}

export interface Project {
  name: string;
  description: string;
  url: string;
  banner: string;
}

export const MEMBERS: Member[] = [
  { name: "전지환", githubId: "jyeonjyan",      role: "Server"   },
  { name: "최장우", githubId: "jangwooooo",      role: "Server"   },
  { name: "하제우", githubId: "hajeu",            role: "Server"   },
  { name: "김겸비", githubId: "kimkyumbi",        role: "Server"   },
  { name: "신희성", githubId: "vumrra",           role: "Server"   },
  { name: "김태은", githubId: "snowykte0426",     role: "Server"   },
  { name: "이세민", githubId: "wwwcomcomcomcom",  role: "Server"   },
  { name: "배재현", githubId: "ZaMan0806",  role: "Server"   },
  { name: "홍지민", githubId: "hongjm0912",  role: "Server"   },
  { name: "이승제", githubId: "frorong",          role: "Frontend" },
  { name: "유시온", githubId: "yoosion030",       role: "Frontend" },
  { name: "전예빈", githubId: "yebin0310",        role: "Frontend" },
  { name: "전준연", githubId: "junjuny0227",      role: "Frontend" },
  { name: "정효주", githubId: "h-0y28",           role: "Frontend" },
  { name: "김재균", githubId: "gjaegyun",         role: "Frontend" },
  { name: "방가온", githubId: "gaoooon",          role: "Frontend" },
  { name: "이상혁", githubId: "LeeSangHyeok0731", role: "Frontend" },
  { name: "정연돈", githubId: "yeondon125",       role: "Frontend" },
  { name: "김서연", githubId: "seoxeon09",       role: "Frontend" },
  { name: "서채운", githubId: "coodns",           role: "DevOps"   },
  { name: "김주은", githubId: "jueuunn7",         role: "DevOps"   },
  { name: "진예원", githubId: "iamwls",           role: "Design"   },
  { name: "김하온", githubId: "haonee",           role: "Design"   },
  { name: "김유찬", githubId: "KIEYU5",       role: "Design"   },
];

export const PROJECTS: Project[] = [
  {
    name: "Hello, GSM",
    description: "광주소프트웨어마이스터고 입학지원시스템",
    url: "https://www.hellogsm.kr",
    banner: "/projects/hello-gsm.png",
  },
  {
    name: "DataGSM",
    description: "교내 학생 정보 관리 서비스",
    url: "https://datagsm.kr",
    banner: "/projects/data-gsm.png",
  },
  {
    name: "EveryGSM v2",
    description: "교내 프로젝트 통합 플랫폼",
    url: "https://www.every.datagsm.kr",
    banner: "/projects/every-gsm-v2.png",
  },
  {
    name: "Ready,GSM",
    description: "광주소프트웨어마이스터고 학과체험 신청 시스템",
    url: "",
    banner: "/projects/ready-gsm.png",
  },
  {
    name: "Who Are You",
    description: "AI 명함/인생네컷 생성 서비스",
    url: "https://github.com/themoment-team/who-are-you-client-v2",
    banner: "/projects/who-are-you.png",
  },
  {
    name: "officialGSM",
    description: "광주소프트웨어마이스터고 공식 홈페이지",
    url: "https://official.hellogsm.kr",
    banner: "/projects/official-gsm.png",
  },
];

export const GITHUB_ORG = "https://github.com/themoment-team";
export const INSTAGRAM = "https://www.instagram.com/team.the_moment/";

export const ROLE_LABEL: Record<Role, string> = {
  Frontend: "Frontend",
  Server:   "Server",
  DevOps:   "DevOps",
  Design:   "Design",
};

export const ROLE_COLOR: Record<Role, string> = {
  Frontend: "bg-blue-500/10 text-blue-500",
  Server:   "bg-green-500/10 text-green-500",
  DevOps:   "bg-orange-500/10 text-orange-500",
  Design:   "bg-pink-500/10 text-pink-500",
};

export const ROLE_ORDER: Role[] = ["Server", "Frontend", "DevOps", "Design"];
