/**
 * 问候语组件
 */

import { useMemo } from 'react';

interface GreetingProps {
  userName?: string;
}

export function Greeting({ userName }: GreetingProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: '早上好', icon: '🌅' };
    } else if (hour >= 12 && hour < 14) {
      return { text: '中午好', icon: '☀️' };
    } else if (hour >= 14 && hour < 18) {
      return { text: '下午好', icon: '🌤️' };
    } else if (hour >= 18 && hour < 22) {
      return { text: '晚上好', icon: '🌆' };
    } else {
      return { text: '夜深了', icon: '🌙' };
    }
  }, []);

  return (
    <div className="text-center text-white/90 select-none">
      <h2 className="text-2xl font-light drop-shadow-lg">
        {greeting.text}
        {userName && <span className="ml-2">{userName}</span>}
      </h2>
    </div>
  );
}
