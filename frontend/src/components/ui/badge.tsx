export const Badge = ({ children, className, variant }: any) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-primary-500/20 text-primary-500 ${className}`}>
    {children}
  </span>
);
