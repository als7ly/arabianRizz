import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

const Header = ({ title, subtitle, rightElement }: HeaderProps) => {
  return (
    <div className="flex-between w-full">
      <div>
        <h2 className="h2-bold text-dark-600">{title}</h2>
        {subtitle && <p className="p-16-regular mt-2 text-dark-400">{subtitle}</p>}
      </div>

      {rightElement && (
        <div className="flex gap-2 items-center">
            {rightElement}
        </div>
      )}
    </div>
  );
};

export default Header;
