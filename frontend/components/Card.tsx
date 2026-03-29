import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
}

export default function Card({ glow, hover, className = "", children, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={`glass rounded-3xl ${glow ? "cyber-glow" : ""} ${hover ? "glass-hover cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
