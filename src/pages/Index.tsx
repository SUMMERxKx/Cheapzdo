import { AppProvider, useApp } from '@/context/AppContext';
import { PasswordGate } from '@/components/PasswordGate';
import { MainBoard } from '@/components/MainBoard';

function AppContent() {
  const { isAuthenticated } = useApp();
  
  if (!isAuthenticated) {
    return <PasswordGate />;
  }
  
  return <MainBoard />;
}

const Index = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
