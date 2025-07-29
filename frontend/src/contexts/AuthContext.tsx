import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  getRedirectResult,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

interface User {
  uid: string;
  displayName: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const userData: User = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "Unknown User",
            email: firebaseUser.email || "",
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for redirect result on app load
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // User successfully signed in via redirect
          console.log("User signed in via redirect");
        }
      })
      .catch((error) => {
        console.error("Error with redirect result:", error);
      });

    return () => unsubscribe();
  }, []);

  const login = async (): Promise<void> => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
