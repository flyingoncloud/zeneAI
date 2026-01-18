import React from 'react';
import svgPaths from "./svg-rq1s5ofmyc";

export default function Logo() {
  return (
    <div className="relative w-full h-full" data-name="Logo">
      <div className="absolute flex h-[32.268px] items-center justify-center left-0 top-0 w-[32px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[0.241deg]">
          <div className="h-[32.134px] relative w-[31.865px]" data-name="Logo">
            <svg className="block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31.8654 32.1341">
              <g id="Logo">
                <path d={svgPaths.p35875480} fill="var(--fill-0, #9463F6)" id="Vector" />
                <path d={svgPaths.p3e9bfe00} fill="var(--fill-0, #9463F6)" id="Vector_2" />
                <path d={svgPaths.p7970470} fill="var(--fill-0, #D8CEE6)" id="Vector_3" />
                <path d={svgPaths.p105d2900} fill="var(--fill-0, #FFDDA9)" id="Vector_4" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[27.188px] items-center justify-center left-[40px] top-[7px] w-[131.251px]" style={{ "--transform-inner-width": "117", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none rotate-[0.241deg]">
          <p className="font-['Mangsi'] font-normal h-[26.638px] leading-none not-italic relative text-[24px] text-white w-[131.141px]">ZeneMe</p>
        </div>
      </div>
    </div>
  );
}
