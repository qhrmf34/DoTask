'use client';

import React from 'react';

type MascotVariant = 'default' | 'happy' | 'sleep' | 'check' | 'pat' | 'drape';
interface MascotProps { size?: number; variant?: MascotVariant; className?: string }

const OL = '#1a1a1a';   // outline
const WH = '#FFFFFF';   // white body
const OR = '#E8A85A';   // orange patch
const PK = '#FFB5C8';   // pink cheek / nose
const BG = '#F5F0E8';   // subtle cream for body shading

// ── 앉아있는 고양이 (두 번째 사진 스타일) ──────────────────────────────
function SittingCat({ variant }: { variant: MascotVariant }) {
  const isHappy  = variant === 'happy' || variant === 'pat' || variant === 'check';
  const isSleep  = variant === 'sleep';
  const eyeClosed = isHappy || isSleep;

  return (
    <>
      {/* ── 꼬리 (몸통 뒤, 왼쪽 아래에서 위로 말림) ── */}
      <path
        d="M 36 108 Q 10 100 12 80 Q 14 62 28 68"
        stroke={OL} strokeWidth="4" fill="none" strokeLinecap="round"
      />

      {/* ── 몸통 ── */}
      <ellipse cx="52" cy="88" rx="34" ry="30" fill={WH} stroke={OL} strokeWidth="3.5"/>

      {/* 앞발 구분선 */}
      <line x1="40" y1="108" x2="40" y2="116" stroke={OL} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="52" y1="110" x2="52" y2="118" stroke={OL} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="64" y1="108" x2="64" y2="116" stroke={OL} strokeWidth="2.5" strokeLinecap="round"/>

      {/* ── 머리 ── */}
      <circle cx="54" cy="42" r="30" fill={WH} stroke={OL} strokeWidth="3.5"/>

      {/* ── 왼쪽 귀 (흰색) ── */}
      <polygon points="28,24 34,4 46,22" fill={WH} stroke={OL} strokeWidth="3" strokeLinejoin="round"/>
      {/* 귀 안 */}
      <polygon points="31,23 35,8 44,22" fill={BG} stroke="none"/>

      {/* ── 오른쪽 귀 (주황 패치) ── */}
      <polygon points="62,20 72,2 84,18" fill={OR} stroke={OL} strokeWidth="3" strokeLinejoin="round"/>
      {/* 귀 안 */}
      <polygon points="65,20 73,6 82,18" fill="#F0BE80" stroke="none"/>

      {/* ── 머리 오른쪽 주황 패치 ── */}
      <path
        d="M 72 18 Q 84 26 80 42 Q 76 50 68 46 Q 60 44 62 34 Q 64 24 72 18 Z"
        fill={OR} stroke="none"
      />

      {/* ── 눈 ── */}
      {eyeClosed ? (
        <>
          <path d="M 40,40 Q 46,34 52,40" stroke={OL} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 56,40 Q 62,34 68,40" stroke={OL} strokeWidth="3" fill="none" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <ellipse cx="44" cy="40" rx="6" ry="6.5" fill={OL}/>
          <ellipse cx="62" cy="40" rx="6" ry="6.5" fill={OL}/>
          <circle cx="46" cy="37.5" r="2" fill="white"/>
          <circle cx="64" cy="37.5" r="2" fill="white"/>
        </>
      )}

      {/* ── 코 ── */}
      <ellipse cx="54" cy="49" rx="3.5" ry="2.5" fill={PK}/>

      {/* ── 입 ── */}
      <path d="M 50,51 Q 54,56 58,51" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* ── 볼터치 ── */}
      <ellipse cx="36" cy="50" rx="8" ry="5.5" fill={PK} opacity="0.65"/>
      <ellipse cx="72" cy="50" rx="8" ry="5.5" fill={PK} opacity="0.65"/>

      {/* ── 수염 왼쪽 ── */}
      <line x1="6"  y1="46" x2="36" y2="49" stroke={OL} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="4"  y1="51" x2="36" y2="51" stroke={OL} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="8"  y1="56" x2="36" y2="53" stroke={OL} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>

      {/* ── 수염 오른쪽 ── */}
      <line x1="72" y1="49" x2="102" y2="46" stroke={OL} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="72" y1="51" x2="104" y2="51" stroke={OL} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="72" y1="53" x2="100" y2="56" stroke={OL} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>

      {/* ── 올린 앞발 (pat 변형) ── */}
      {variant === 'pat' && (
        <>
          <path d="M 28 80 Q 16 62 18 46" stroke={OL} strokeWidth="8" strokeLinecap="round" fill="none"/>
          <ellipse cx="18" cy="42" rx="11" ry="9" fill={WH} stroke={OL} strokeWidth="3"/>
          <line x1="13" y1="49" x2="13" y2="52" stroke={OL} strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="51" x2="18" y2="54" stroke={OL} strokeWidth="2" strokeLinecap="round"/>
          <line x1="23" y1="49" x2="23" y2="52" stroke={OL} strokeWidth="2" strokeLinecap="round"/>
        </>
      )}

      {/* ── 체크 뱃지 ── */}
      {variant === 'check' && (
        <g transform="translate(56,68)">
          <circle cx="14" cy="14" r="14" fill="#8b5cf6"/>
          <path d="M7,14 L11,18 L21,8" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )}
    </>
  );
}

// ── 채팅창 위에 엎드려 앞발을 뻗은 고양이 ──────────────────────────────
// 몸통(왼쪽) + 머리(오른쪽)가 가로로 나란히 → 엎드린 자세
function DrapingCat() {
  return (
    <>
      {/* ── 꼬리 (왼쪽 위로 말림) ── */}
      <path d="M 10 52 Q -2 40 2 24 Q 5 12 15 18"
        stroke={OL} strokeWidth="4" fill="none" strokeLinecap="round"/>

      {/* ── 몸통 (가로로 납작한 타원 — 엎드린 느낌) ── */}
      <ellipse cx="34" cy="70" rx="28" ry="17"
        fill={WH} stroke={OL} strokeWidth="3.5"/>

      {/* ── 뒷발 (왼쪽 아래로 삐져나옴) ── */}
      <path d="M 14 80 Q 6 90 2 88"
        stroke={OL} strokeWidth="6" fill="none" strokeLinecap="round"/>
      <ellipse cx="1" cy="88" rx="8" ry="5" fill={WH} stroke={OL} strokeWidth="2.5"/>

      {/* ── 앞발 두 개 — 오른쪽으로 뻗어 입력창 위에 얹힘 ── */}
      {/* 위 앞발 */}
      <path d="M 52 62 Q 68 58 82 56"
        stroke={OL} strokeWidth="8" fill="none" strokeLinecap="round"/>
      <ellipse cx="84" cy="56" rx="10" ry="6.5" fill={WH} stroke={OL} strokeWidth="2.5"/>
      <line x1="78" y1="61" x2="78" y2="63" stroke={OL} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="84" y1="62" x2="84" y2="64" stroke={OL} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="90" y1="61" x2="90" y2="63" stroke={OL} strokeWidth="1.8" strokeLinecap="round"/>
      {/* 아래 앞발 */}
      <path d="M 50 74 Q 64 74 78 76"
        stroke={OL} strokeWidth="8" fill="none" strokeLinecap="round"/>
      <ellipse cx="80" cy="76" rx="10" ry="6.5" fill={WH} stroke={OL} strokeWidth="2.5"/>
      <line x1="74" y1="81" x2="74" y2="83" stroke={OL} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="80" y1="82" x2="80" y2="84" stroke={OL} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="86" y1="81" x2="86" y2="83" stroke={OL} strokeWidth="1.8" strokeLinecap="round"/>

      {/* ── 머리 (몸통 오른쪽, 같은 높이 — 가로 배치 핵심) ── */}
      <circle cx="66" cy="50" r="24" fill={WH} stroke={OL} strokeWidth="3.5"/>

      {/* ── 왼쪽 귀 (흰색) ── */}
      <polygon points="52,28 56,14 66,30" fill={WH} stroke={OL} strokeWidth="2.5" strokeLinejoin="round"/>
      <polygon points="55,28 57,18 64,29" fill={BG} stroke="none"/>
      {/* ── 오른쪽 귀 (주황) ── */}
      <polygon points="68,26 76,12 84,26" fill={OR} stroke={OL} strokeWidth="2.5" strokeLinejoin="round"/>
      <polygon points="70,26 76,16 82,25" fill="#F0BE80" stroke="none"/>

      {/* ── 머리 오른쪽 주황 패치 ── */}
      <path d="M 76 26 Q 86 34 82 46 Q 78 54 70 50 Q 62 46 64 36 Q 66 26 76 26 Z"
        fill={OR} stroke="none"/>

      {/* ── 눈 (행복하게 감은 눈) ── */}
      <path d="M 54,46 Q 60,40 66,46" stroke={OL} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 66,46 Q 72,40 78,46" stroke={OL} strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* ── 코 / 입 ── */}
      <ellipse cx="66" cy="54" rx="3.5" ry="2.5" fill={PK}/>
      <path d="M 62,57 Q 66,61 70,57" stroke={OL} strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      {/* ── 볼터치 ── */}
      <ellipse cx="50" cy="57" rx="7" ry="4.5" fill={PK} opacity="0.6"/>
      <ellipse cx="82" cy="57" rx="7" ry="4.5" fill={PK} opacity="0.6"/>

      {/* ── 수염 왼쪽 ── */}
      <line x1="30" y1="52" x2="50" y2="55" stroke={OL} strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
      <line x1="30" y1="57" x2="50" y2="57" stroke={OL} strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
      {/* ── 수염 오른쪽 ── */}
      <line x1="82" y1="55" x2="100" y2="52" stroke={OL} strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
      <line x1="82" y1="57" x2="100" y2="59" stroke={OL} strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
    </>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────
export function Mascot({ size = 48, variant = 'default', className }: MascotProps) {
  if (variant === 'drape') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
        xmlns="http://www.w3.org/2000/svg" className={className}>
        <DrapingCat />
      </svg>
    );
  }

  return (
    <svg width={size} height={Math.round(size * 1.3)} viewBox="0 0 108 128"
      fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <SittingCat variant={variant} />
    </svg>
  );
}
