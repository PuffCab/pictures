import { ReactNode, createContext, useEffect, useState } from 'react';
import { UserType } from '../assets/types/UserType';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { Navigate } from 'react-router';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
//define type of context
type AuthContextType = {
  user: UserType | null;
  email: string;
  password: string;
  setUser: (user: UserType) => void;
  setPassword: (password: string) => void;
  setEmail: (email: string) => void;
  setSignUpPressed: (isPressed: boolean) => void;
  setLoginPressed: (isPressed: boolean) => void;
  loginPressed: boolean;
  signUpPressed: boolean;

  register: () => Promise<void>;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;

  addToFavorites: (image: { url: string }) => Promise<void>;

  isLoggedIn: boolean;
};

//define the initial value of context
const initAuthContextValue = {
  user: {} as UserType,
  setUser: () => {
    throw new Error('context not initialised');
  },
  setPassword: () => {
    throw new Error('context not initialised');
  },
  setEmail: () => {
    throw new Error('context not initialised');
  },
  register: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  logOut: () => Promise.resolve(),
  email: '',
  password: '',
  loggedIn: false,
  isLoggedIn: false,

  addToFavorites: () => Promise.resolve(),

  setSignUpPressed: () => {
    throw new Error('context not initialised');
  },
  setLoginPressed: () => {
    throw new Error('context not initialised');
  },
  loginPressed: false,
  signUpPressed: false,
};

//define type of props the AuthContextProvider recived

type AuthContextProviderProps = {
  children: ReactNode;
};
export const AuthContext = createContext<AuthContextType>(initAuthContextValue);

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  let [user, setUser] = useState<UserType | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loggedOut, setLoggedOut] = useState<boolean>(false);
  const [signUpPressed, setSignUpPressed] = useState<boolean>(true);
  const [loginPressed, setLoginPressed] = useState<boolean>(false);

  const register = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      if (user) {
        setUser({ email: user.email, id: user.uid });
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          imagesList: [],
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setEmail('');
      setPassword('');
    }
  };

  const addToFavorites = async (image: { url: string }) => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        imagesList: arrayUnion(image),
      });
    } else {
      throw new Error('User is not authenticated');
    }
  };

  const signIn = async () => {
    try {
      const isLoggedIn = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (isLoggedIn) {
        setIsLoggedIn(true);
        setLoggedOut(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const stayLoggedIn = () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setLoggedOut(true);
      setIsLoggedIn(false);
      setUser(null);
      console.log(auth.currentUser?.email);
    } catch (error) {
      console.log(error);
    }
  };
  // if (loggedOut) {
  //   return <Navigate to={'registration'} replace={true} />;
  // }

  useEffect(() => {
    stayLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        register,
        setEmail,
        setPassword,
        email,
        password,
        signIn,
        addToFavorites,
        logOut,
        isLoggedIn,
        setLoginPressed,
        setSignUpPressed,
        loginPressed,
        signUpPressed,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
