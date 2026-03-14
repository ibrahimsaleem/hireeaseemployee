import { Switch, Route, Redirect } from "wouter";
import { AuthContext, useAuthState, useAuth } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/toast";
import { Sidebar, MobileSidebar } from "@/components/Sidebar";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ClientListPage from "@/pages/ClientListPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import ApplyWizardPage from "@/pages/ApplyWizardPage";
import ApplicationsPage from "@/pages/ApplicationsPage";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar className="hidden lg:flex w-56 shrink-0" />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b lg:hidden bg-card">
          <MobileSidebar />
          <p className="text-sm font-semibold">Aplyease Employee Portal</p>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

export default function App() {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      <ToastProvider>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/dashboard">
            <ProtectedRoute component={DashboardPage} />
          </Route>
          <Route path="/clients/:id">
            {() => <ProtectedRoute component={ClientDetailPage} />}
          </Route>
          <Route path="/clients">
            <ProtectedRoute component={ClientListPage} />
          </Route>
          <Route path="/apply">
            <ProtectedRoute component={ApplyWizardPage} />
          </Route>
          <Route path="/applications">
            <ProtectedRoute component={ApplicationsPage} />
          </Route>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </ToastProvider>
    </AuthContext.Provider>
  );
}
