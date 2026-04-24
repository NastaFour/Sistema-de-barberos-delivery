export const Avatar = ({ children, className }: any) => <div className={`w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-white ${className}`}>{children}</div>;
export const AvatarImage = ({ src, alt, className }: any) => <img src={src} alt={alt} className={`w-full h-full rounded-full object-cover ${className}`} />;
export const AvatarFallback = ({ children, className }: any) => <span className={className}>{children}</span>;
