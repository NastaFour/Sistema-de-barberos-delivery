import { useState } from 'react';
export const Tabs = ({ children, value, onValueChange, className }: any) => <div className={className}>{children}</div>;
export const TabsList = ({ children, className }: any) => <div className={`flex gap-4 border-b border-dark-700 mb-8 ${className}`}>{children}</div>;
export const TabsTrigger = ({ children, value, className }: any) => <button className={`px-4 py-2 font-semibold ${className}`}>{children}</button>;
export const TabsContent = ({ children, value }: any) => <div>{children}</div>;
