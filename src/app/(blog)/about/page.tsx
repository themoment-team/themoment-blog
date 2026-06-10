import {
  GITHUB_ORG,
  INSTAGRAM,
  MEMBERS,
  PROJECTS,
  ROLE_COLOR,
  ROLE_LABEL,
  ROLE_ORDER,
  type Role,
} from '@shared/config/team';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = { title: '더모먼트 소개' };

const VALUES = [
  {
    keyword: 'Professional',
    title: '전문성을 갖춘 인재',
    description: '자신의 분야에서 최고가 되기 위해\n끊임없이 학습하고 역량을 키우는 인재',
    tags: ['#넘치는책임감', '#끊임없이노력하는'],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 text-fg-muted"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    keyword: 'Communication',
    title: '소통하고 협력하는 인재',
    description: '열린 태도와 신뢰를 바탕으로\n서로를 존중하고 협력하는 인재',
    tags: ['#수평적인문화', '#존중은편견없이'],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 text-fg-muted"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    keyword: 'Passion',
    title: '열정적으로 도전하는 인재',
    description: '창의적 사고로 변화와 도전을\n두려워하지 않는 열정적인 인재',
    tags: ['#도전은누구나', '#열정은힘이다'],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 text-fg-muted"
        aria-hidden="true"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

function groupByRole(members: typeof MEMBERS) {
  return ROLE_ORDER.map((role) => ({
    role,
    members: members.filter((m) => m.role === role),
  })).filter((g) => g.members.length > 0);
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.021C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

export default function AboutPage() {
  const groups = groupByRole(MEMBERS);

  return (
    <div className="mx-auto max-w-4xl space-y-24 px-4 py-16">
      {/* Hero */}
      <section>
        <p className="mb-4 font-medium text-accent text-xs uppercase tracking-[0.1em]">
          The Moment
        </p>
        <h1 className="mb-6 font-bold text-4xl text-fg tracking-[-0.04em]">더모먼트</h1>
        <p className="max-w-2xl text-base text-fg-muted leading-relaxed">
          더모먼트는 광주소프트웨어마이스터고등학교 재학생들로 구성된 개발 팀입니다. 주로 학교에
          필요한 서비스를 개발하고 있어요. 본교 입학지원시스템부터 교내 학생의 정보를 관리하는
          서비스, 프로젝트 관리 서비스를 만들어요.
        </p>
        <p className="mt-3 max-w-2xl text-base text-fg-muted leading-relaxed">
          가장 빠르게 트렌드를 파악하고 새로운 기술을 도입하며, 항상 새로운 비즈니스 모델에 대해
          고민하고 기술을 통해 사용자의 경험을 향상시키려 노력해요.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={GITHUB_ORG}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-fg-muted text-sm transition-colors hover:border-fg/30 hover:text-fg"
          >
            <GitHubIcon />
            themoment-team
          </Link>
          <Link
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-fg-muted text-sm transition-colors hover:border-fg/30 hover:text-fg"
          >
            <InstagramIcon />
            Instagram
          </Link>
        </div>
      </section>

      {/* What we want */}
      <section>
        <h2 className="mb-8 font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">
          What we want
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div
              key={v.keyword}
              className="flex flex-col gap-3 rounded-xl border border-border bg-bg-subtle p-6"
            >
              <p className="font-medium text-fg-muted text-xs uppercase tracking-widest">
                {v.keyword}
              </p>
              {v.icon}
              <h3 className="font-semibold text-fg text-sm">{v.title}</h3>
              <p className="whitespace-pre-line text-fg-muted text-xs leading-relaxed">
                {v.description}
              </p>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                {v.tags.map((tag) => (
                  <span key={tag} className="font-medium text-[10px] text-fg-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <h2 className="mb-8 font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">
          Projects
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {PROJECTS.map((project) => (
            <Link
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-xl border border-border transition-all hover:border-accent/40"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-bg-subtle">
                <Image
                  src={project.banner}
                  alt={project.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>
              <div className="flex items-start justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold text-fg text-sm transition-colors group-hover:text-accent">
                    {project.name}
                  </p>
                  <p className="mt-0.5 text-fg-muted text-xs leading-relaxed">
                    {project.description}
                  </p>
                </div>
                <span className="mt-0.5 shrink-0 text-fg-muted opacity-0 transition-opacity group-hover:opacity-100">
                  <ExternalLinkIcon />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Members */}
      <section>
        <h2 className="mb-10 font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">
          Members · {MEMBERS.length}
        </h2>
        <div className="space-y-12">
          {groups.map(({ role, members }) => (
            <div key={role}>
              <p className="mb-4 flex items-center gap-2 text-fg-muted text-xs">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 font-medium text-[10px] ${ROLE_COLOR[role as Role]}`}
                >
                  {ROLE_LABEL[role as Role]}
                </span>
                {members.length}명
              </p>
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
                {members.map((member) => (
                  <Link
                    key={member.githubId}
                    href={`https://github.com/${member.githubId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="relative size-12 overflow-hidden rounded-full ring-2 ring-border transition-all group-hover:ring-accent/50">
                      <Image
                        src={`https://avatars.githubusercontent.com/${member.githubId}`}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <p className="text-center font-medium text-[11px] text-fg-muted leading-tight transition-colors group-hover:text-fg">
                      {member.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
