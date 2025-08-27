import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

type Props = {
  to?: string;
  label?: string;
  className?: string;
};

export default function BackButton({
  to = "/groundtype",
  label = "Tilbage",
  className = "",
}: Props) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${className}`}
      aria-label={label}
    >
      <MdArrowBack className="text-lg" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
