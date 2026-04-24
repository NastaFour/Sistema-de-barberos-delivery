export const Button = ({ children, className, variant, size, ...props }: any) => (
  <button className={`px-4 py-2 bg-primary-500 text-dark-950 font-bold rounded-lg ${className}`} {...props}>
    {children}
  </button>
);
