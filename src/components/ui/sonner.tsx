import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset={20}
      gap={8}
      toastOptions={{
        style: {
          background: "#ffffff",
          color: "#374151",
          border: "none",
          borderRadius: "50px",
          padding: "10px 16px",
          fontSize: "14px",
          fontWeight: 500,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        },
        classNames: {
          toast: "group toast",
          description: "text-gray-500 text-sm",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
