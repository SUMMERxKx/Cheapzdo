import { AppProvider, useApp } from '@/context/AppContext';
import { PasswordGate } from '@/components/PasswordGate';
import { Daily } from '@/components/Daily';

function DailyContent() {
  const { isAuthenticated, isLoading } = useApp();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <PasswordGate />;
  }
  
  return <Daily />;
}

const DailyPage = () => {
  return (
    <AppProvider>
      <DailyContent />
    </AppProvider>
  );
};

export default DailyPage;
