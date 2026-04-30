import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  height?: number;
  variant?: "light" | "dark";
}

const Logo = ({ className, height = 24, variant = "dark" }: LogoProps) => {
  const width = Math.round((height * 67) / 25);
  const src = variant === "light" ? "/qck-light-logo.png" : "/qck-logo.png";
  return (
    <img
      src={src}
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