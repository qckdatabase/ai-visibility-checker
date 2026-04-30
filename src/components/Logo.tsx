import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  height?: number;
}

const Logo = ({ className, height = 24 }: LogoProps) => {
  const width = Math.round((height * 67) / 25);
  return (
    <img
      src="/qck-logo.png"
      alt="QCK"
      width={width}
      height={height}
      className={cn("block select-none", className)}
      style={{ height, width }}
      draggable={false}
    />
  );
};

export default Logo;
