export function ArabicText({ children }: { children: React.ReactNode }) {
  return (
    <div lang="ar" dir="rtl" translate="no" className="font-scheherazade">
      {children}
    </div>
  );
}
