import { type ReactNode, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import NotFound from "@/pages/not-found";
import { Route, Switch, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { getGetProfileQueryKey, useGetProfile } from "@workspace/api-client-react";

import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Add from "@/pages/add";
import Lists from "@/pages/lists";
import ListDetail from "@/pages/list-detail";
import Profile from "@/pages/profile";
import EntryDetail from "@/pages/entry-detail";
import Onboarding from "@/pages/onboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/cortado-logo.png`,
  },
  variables: {
    colorPrimary: "hsl(353 67% 80%)", // Peach
    colorForeground: "hsl(0 0% 100%)",
    colorMutedForeground: "hsl(245 15% 65%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(245 28% 12%)",
    colorInput: "hsl(245 20% 20%)",
    colorInputForeground: "hsl(0 0% 100%)",
    colorNeutral: "hsl(245 20% 20%)",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "1.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(245_26%_16%)] rounded-[2rem] w-[440px] max-w-full overflow-hidden border border-[hsl(245_20%_22%)] shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold text-2xl tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/80 transition-colors font-semibold",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive",
    logoBox: "mb-6 flex justify-center",
    logoImage: "w-10 h-10 object-contain",
    socialButtonsBlockButton: "bg-secondary border-border hover:bg-secondary/80 rounded-xl h-12 transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 shadow-sm font-semibold transition-colors",
    formFieldInput: "bg-input border-border text-foreground rounded-xl h-12 px-4 focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
    footerAction: "bg-secondary/50 rounded-xl p-4 mt-6",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border border-destructive/20 rounded-xl",
    otpCodeFieldInput: "bg-input border-border text-foreground rounded-xl focus:ring-2 focus:ring-ring",
    formFieldRow: "mb-4",
    main: "flex flex-col gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/home" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isLoaded, isSignedIn } = useUser();
  const { data: profile, isLoading: isProfileLoading, error, refetch, isFetching } = useGetProfile({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: getGetProfileQueryKey(),
      staleTime: 30_000,
    }
  });

  const [location] = useLocation();

  if (!isLoaded) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  if (!isSignedIn) {
    return <Redirect to="/" />;
  }

  if (isProfileLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  if (error || !profile) {
    return (
      <div className="min-h-[100dvh] flex flex-col gap-4 items-center justify-center bg-background px-6 text-center">
        <h1 className="text-xl font-semibold">We couldn’t load your profile</h1>
        <p className="text-muted-foreground">Please retry. Your saved library hasn’t been changed.</p>
        <button className="rounded-xl bg-primary text-primary-foreground px-6 py-3 disabled:opacity-50" disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? "Trying again…" : "Try again"}
        </button>
      </div>
    );
  }

  if (!profile.onboardingCompleted && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  if (profile.onboardingCompleted && location === "/onboarding") {
    return <Redirect to="/home" />;
  }

  return <Component />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientInstance = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClientInstance.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClientInstance]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your library",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start building your learning path",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/onboarding"><ProtectedRoute component={Onboarding} /></Route>
            <Route path="/home"><ProtectedRoute component={Home} /></Route>
            <Route path="/explore"><ProtectedRoute component={Explore} /></Route>
            <Route path="/add"><ProtectedRoute component={Add} /></Route>
            <Route path="/lists"><ProtectedRoute component={Lists} /></Route>
            <Route path="/lists/:id"><ProtectedRoute component={ListDetail} /></Route>
            <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
            <Route path="/entries/:id"><ProtectedRoute component={EntryDetail} /></Route>
            
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
