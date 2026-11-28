import Svg, { Circle, Path, Rect } from "react-native-svg";

type Ukuran = { width?: number; height?: number };

export function Guru({ width = 104, height = 88 }: Ukuran) {
  return <Svg accessible={false} width={width} height={height} viewBox="0 0 104 88">
    <Rect x="6" y="8" width="70" height="46" rx="6" fill="#1F5E4A"/>
    <Rect x="11" y="13" width="60" height="36" rx="3" fill="#2E7A61"/>
    <Path d="M18 24h22M18 31h32M18 38h16" stroke="#CFEBDF" strokeWidth="2.5" strokeLinecap="round"/>
    <Rect x="38" y="54" width="6" height="22" fill="#1F5E4A"/>
    <Circle cx="84" cy="30" r="9" fill="#F4C7A1"/>
    <Path d="M74 31c0-9 5-14 10-14s10 5 10 14c-2-4-5-6-10-6s-8 2-10 6z" fill="#0F5C45"/>
    <Path d="M72 84c0-18 5-30 12-30s12 12 12 30z" fill="#F2B544"/>
    <Path d="M78 58l-12-6" stroke="#F4C7A1" strokeWidth="4" strokeLinecap="round"/>
    <Rect x="58" y="70" width="18" height="12" rx="2" fill="#E6F3ED"/>
  </Svg>;
}

export function Madrasah({ width = 190, height = 150 }: Ukuran) {
  return <Svg accessible={false} width={width} height={height} viewBox="0 0 190 150">
    <Rect x="20" y="70" width="150" height="70" rx="6" fill="#F5FAF7"/>
    <Path d="M10 74 L95 26 L180 74 Z" fill="#F2B544"/>
    <Rect x="83" y="96" width="24" height="44" rx="4" fill="#0F5C45"/>
    <Rect x="36" y="88" width="26" height="22" rx="3" fill="#BFE0D3"/>
    <Rect x="128" y="88" width="26" height="22" rx="3" fill="#BFE0D3"/>
    <Rect x="92" y="6" width="6" height="26" fill="#F5FAF7"/>
    <Circle cx="95" cy="8" r="6" fill="#F2B544"/>
    <Circle cx="95" cy="56" r="10" fill="#0F5C45"/>
    <Rect x="0" y="138" width="190" height="6" rx="3" fill="#0B4A37"/>
  </Svg>;
}

export function Sukses({ width = 220, height = 190 }: Ukuran) {
  return <Svg accessible={false} width={width} height={height} viewBox="0 0 220 190">
    <Circle cx="110" cy="96" r="84" fill="#E6F3ED"/>
    <Circle cx="40" cy="40" r="6" fill="#F2B544"/>
    <Circle cx="186" cy="58" r="4" fill="#0F5C45"/>
    <Circle cx="176" cy="150" r="7" fill="#F2B544"/>
    <Path d="M28 132l6 6M34 132l-6 6" stroke="#0F5C45" strokeWidth="3" strokeLinecap="round"/>
    <Rect x="62" y="50" width="96" height="112" rx="12" fill="#FFFFFF" stroke="#0F5C45" strokeWidth="3"/>
    <Rect x="88" y="42" width="44" height="16" rx="6" fill="#0F5C45"/>
    <Path d="M78 82h44M78 98h64M78 114h36" stroke="#BFE0D3" strokeWidth="5" strokeLinecap="round"/>
    <Circle cx="146" cy="140" r="26" fill="#11714F"/>
    <Path d="M134 140l8 8 16-16" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>;
}

export function Pengganti({ width = 72, height = 64 }: Ukuran) {
  return <Svg accessible={false} width={width} height={height} viewBox="0 0 72 64">
    <Circle cx="24" cy="18" r="9" fill="#F4C7A1"/><Path d="M14 20c0-8 4-12 10-12s10 4 10 12c-2-3-5-5-10-5s-8 2-10 5z" fill="#2F55C9"/>
    <Path d="M10 62c0-16 6-26 14-26s14 10 14 26z" fill="#2F55C9"/>
    <Circle cx="52" cy="22" r="8" fill="#E8B48A"/><Path d="M44 21c0-6 3-9 8-9s8 3 8 9c-2-2-4-3-8-3s-6 1-8 3z" fill="#12211C"/>
    <Path d="M40 62c0-14 5-22 12-22s12 8 12 22z" fill="#F2B544"/>
    <Path d="M33 44l9-3" stroke="#F4C7A1" strokeWidth="4" strokeLinecap="round"/>
  </Svg>;
}

export function Siluet({ width = 40, height = 46 }: Ukuran) {
  return <Svg accessible={false} width={width} height={height} viewBox="0 0 40 46">
    <Circle cx="20" cy="16" r="9" fill="#F4C7A1"/><Path d="M10 18c0-8 4-13 10-13s10 5 10 13c-2-4-5-6-10-6s-8 2-10 6z" fill="#0F5C45"/><Path d="M4 46c0-12 7-20 16-20s16 8 16 20z" fill="#F2B544"/>
  </Svg>;
}
