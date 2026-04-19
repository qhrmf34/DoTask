'use client';

import React from 'react';

type MascotVariant = 'default' | 'happy' | 'sleep' | 'check' | 'pat' | 'drape';
interface MascotProps { size?: number; variant?: MascotVariant; className?: string }

const SKIN  = '#F5C5A0';
const BODY  = '#C8D0F5';
const BODY2 = '#A8B4E8';
const FIRE1 = '#D93A10';
const FIRE2 = '#F06820';
const FIRE3 = '#FFA030';
const PINK  = '#F09090';
const CHEEK = '#F0A090';
const INK   = '#2A1A0A';

// 불꽃 머리카락
function Hair({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* 불꽃 베이스 */}
      <ellipse cx="50" cy="4" rx="14" ry="8" fill={FIRE2} opacity="0.9"/>
      {/* 왼쪽 불꽃 */}
      <path d="M 36 6 Q 28 -8 36 -18 Q 40 -24 44 -14 Q 46 -4 40 2 Z" fill={FIRE1}/>
      {/* 중앙 불꽃 */}
      <path d="M 44 4 Q 42 -16 50 -26 Q 58 -16 56 4 Z" fill={FIRE1}/>
      {/* 오른쪽 불꽃 */}
      <path d="M 56 2 Q 60 -14 66 -18 Q 70 -10 64 2 Z" fill={FIRE2}/>
      {/* 스파크 */}
      <circle cx="32" cy="-14" r="3.5" fill={FIRE3} opacity="0.9"/>
      <circle cx="68" cy="-12" r="3"   fill={FIRE3} opacity="0.85"/>
      <circle cx="50" cy="-28" r="3"   fill={FIRE1} opacity="0.8"/>
      <circle cx="40" cy="-26" r="2"   fill={FIRE2} opacity="0.75"/>
      <circle cx="62" cy="-22" r="2.5" fill={FIRE2} opacity="0.75"/>
    </g>
  );
}

// 서 있는 캐릭터
function Standing({ variant }: { variant: MascotVariant }) {
  const happy = variant === 'happy' || variant === 'check' || variant === 'pat';
  const sleep = variant === 'sleep';

  return (
    <>
      {/* 불꽃 */}
      <Hair x={0} y={48} />

      {/* 머리 */}
      <circle cx="50" cy="62" r="28" fill={SKIN} stroke={INK} strokeWidth="2"/>

      {/* 눈썹 */}
      {sleep ? null : happy ? (
        <>
          <path d="M 35 54 Q 39 51 43 54" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M 57 54 Q 61 51 65 54" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <path d="M 35 54 Q 39 51 43 54" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M 57 54 Q 61 51 65 54" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </>
      )}

      {/* 눈 */}
      {sleep || happy ? (
        <>
          <path d="M 36 61 Q 41 56 46 61" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M 54 61 Q 59 56 64 61" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <circle cx="41" cy="61" r="4" fill={INK}/>
          <circle cx="59" cy="61" r="4" fill={INK}/>
          <circle cx="43" cy="59" r="1.5" fill="white"/>
          <circle cx="61" cy="59" r="1.5" fill="white"/>
        </>
      )}

      {/* 입 */}
      {happy
        ? <path d="M 43 72 Q 50 79 57 72" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round"/>
        : <ellipse cx="50" cy="73" rx="4" ry="4.5" fill={INK}/>
      }

      {/* 볼 */}
      <ellipse cx="32" cy="68" rx="8" ry="5.5" fill={CHEEK} opacity="0.4"/>
      <ellipse cx="68" cy="68" rx="8" ry="5.5" fill={CHEEK} opacity="0.4"/>

      {/* 몸통 */}
      <ellipse cx="50" cy="116" rx="26" ry="30" fill={BODY} stroke={INK} strokeWidth="2"/>

      {/* 단추 */}
      <circle cx="50" cy="105" r="3" fill={BODY2}/>
      <circle cx="50" cy="117" r="3" fill={BODY2}/>

      {/* 팔 왼 */}
      <ellipse cx="20" cy="112" rx="9" ry="14" fill={SKIN} stroke={INK} strokeWidth="1.8"
        transform="rotate(-10, 20, 112)"/>
      {/* 팔 오 */}
      <ellipse cx="80" cy="112" rx="9" ry="14" fill={SKIN} stroke={INK} strokeWidth="1.8"
        transform="rotate(10, 80, 112)"/>

      {/* 발 왼 */}
      <ellipse cx="39" cy="142" rx="12" ry="7.5" fill={PINK} stroke={INK} strokeWidth="1.8"/>
      {/* 발 오 */}
      <ellipse cx="61" cy="142" rx="12" ry="7.5" fill={PINK} stroke={INK} strokeWidth="1.8"/>

      {/* check 배지 */}
      {variant === 'check' && (
        <g transform="translate(58,92)">
          <circle cx="14" cy="14" r="14" fill="#8b5cf6"/>
          <path d="M7,14 L11,18 L21,8" stroke="white" strokeWidth="3" fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )}
    </>
  );
}

// 채팅 입력창 왼쪽 끝에 기대있는 캐릭터
// viewBox 0 0 56 88 — 캐릭터가 오른쪽 벽(= 입력창 왼쪽 둥근 테두리)에 기대 있는 포즈
function Leaning() {
  return (
    // 오른쪽으로 기울어진 느낌 — 오른쪽이 "벽" 방향
    <g transform="rotate(8, 28, 56)">
      {/* 불꽃 — 머리 위 */}
      <Hair x={-4} y={10} s={0.58}/>

      {/* 머리 */}
      <circle cx="28" cy="28" r="18" fill={SKIN} stroke={INK} strokeWidth="1.6"/>

      {/* 눈썹 */}
      <path d="M 18 22 Q 22 19 26 22" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M 30 22 Q 34 19 38 22" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round"/>

      {/* 눈 (졸린 반달눈) */}
      <path d="M 18 26 Q 23 22 28 26" stroke={INK} strokeWidth="1.9" fill="none" strokeLinecap="round"/>
      <path d="M 28 26 Q 33 22 38 26" stroke={INK} strokeWidth="1.9" fill="none" strokeLinecap="round"/>

      {/* 입 */}
      <ellipse cx="28" cy="34" rx="2.5" ry="3" fill={INK}/>

      {/* 볼 */}
      <ellipse cx="17" cy="31" rx="5" ry="3.5" fill={CHEEK} opacity="0.42"/>
      <ellipse cx="39" cy="31" rx="5" ry="3.5" fill={CHEEK} opacity="0.42"/>

      {/* 몸통 */}
      <ellipse cx="28" cy="60" rx="18" ry="21" fill={BODY} stroke={INK} strokeWidth="1.6"/>

      {/* 단추 */}
      <circle cx="28" cy="53" r="2" fill={BODY2}/>
      <circle cx="28" cy="62" r="2" fill={BODY2}/>

      {/* 팔 왼 */}
      <ellipse cx="8" cy="56" rx="6" ry="10" fill={SKIN} stroke={INK} strokeWidth="1.4"
        transform="rotate(-20, 8, 56)"/>
      {/* 팔 오 (벽 쪽 — 살짝 올라가 기댄 느낌) */}
      <ellipse cx="48" cy="52" rx="6" ry="10" fill={SKIN} stroke={INK} strokeWidth="1.4"
        transform="rotate(16, 48, 52)"/>

      {/* 발 */}
      <ellipse cx="21" cy="79" rx="8" ry="5" fill={PINK} stroke={INK} strokeWidth="1.4"/>
      <ellipse cx="35" cy="79" rx="8" ry="5" fill={PINK} stroke={INK} strokeWidth="1.4"/>
    </g>
  );
}

// 메인
export function Mascot({ size = 48, variant = 'default', className }: MascotProps) {
  if (variant === 'drape') {
    return (
      <svg width={size} height={size} viewBox="0 0 56 88" fill="none"
        xmlns="http://www.w3.org/2000/svg" className={className}>
        <Leaning />
      </svg>
    );
  }
  return (
    <svg width={size} height={Math.round(size * 1.56)} viewBox="0 0 100 156"
      fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <Standing variant={variant} />
    </svg>
  );
}
