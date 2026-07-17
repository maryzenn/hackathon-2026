 import type { ReactNode } from 'react';
import { View } from 'react-native';

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className = '' }: SectionCardProps) {
  return (
    <View className={`mb-[14px] rounded-[14px] border border-[#262f45] bg-[#131826] p-4 ${className}`}>
      {children}
    </View>
  );
}
