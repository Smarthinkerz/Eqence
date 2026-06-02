import { Switch, Route } from "wouter";
import { I18nProvider } from "./contexts/I18nContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ReviewsProvider } from "./contexts/ReviewsContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Payment from "./pages/Payment";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Reviews from "./pages/Reviews";
import Analytics from "./pages/Analytics";
import Export from "./pages/Export";
import AdminLogin from "./pages/AdminLogin";
import CMS from "./pages/CMS";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/payment" component={Payment} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/export" component={Export} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/cms" component={CMS} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ReviewsProvider>
          <Router />
        </ReviewsProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
