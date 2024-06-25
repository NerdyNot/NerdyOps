import React, { ReactNode } from 'react';
import Image from 'next/image';
import { containerMaxW } from '../config';

type Props = {
  children: ReactNode;
};

export default function FooterBar({ children }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className={`py-2 px-6 ${containerMaxW}`}>
      <div className="block md:flex items-center justify-between">
        <div className="text-center md:text-left mb-6 md:mb-0">
          <b>
            &copy;{year},{` `}
            <a href="https://github.com/NerdyNot/" rel="noreferrer" target="_blank">
              NerdyNot
            </a>
            .
          </b>
          {` `}
          {children}
        </div>
        <div className="md:py-2">
          <a href="https://github.com/NerdyNot" rel="noreferrer" target="_blank">
            <Image 
              src="/images/nerdynot-circle.png" 
              alt="NerdyNot Logo" 
              width={128} 
              height={48} 
              className="w-auto h-20 md:h-20 mx-auto" 
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
