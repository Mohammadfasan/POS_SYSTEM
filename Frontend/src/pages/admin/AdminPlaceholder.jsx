import {
  Construction,
} from "lucide-react";

const AdminPlaceholder = ({
  title,
}) => {
  return (
    <div
      className="
        flex
        min-h-[500px]
        items-center
        justify-center
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      <div className="text-center">

        <div
          className="
            mx-auto
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-blue-50
            text-blue-600
          "
        >
          <Construction
            size={30}
          />
        </div>

        <h2
          className="
            mt-4
            text-xl
            font-bold
            text-slate-900
          "
        >
          {title}
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-slate-500
          "
        >
          This module will be
          implemented next.
        </p>
      </div>
    </div>
  );
};

export default AdminPlaceholder;