export const Card = ({ children, className }: any) => <div className={`bg-dark-900 rounded-lg p-4 ${className}`}>{children}</div>;
export const CardHeader = ({ children, className }: any) => <div className={`mb-4 ${className}`}>{children}</div>;
export const CardTitle = ({ children, className }: any) => <h3 className={`text-lg font-bold text-white ${className}`}>{children}</h3>;
export const CardContent = ({ children, className }: any) => <div className={className}>{children}</div>;
