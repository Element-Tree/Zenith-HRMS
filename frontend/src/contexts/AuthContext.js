import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorHandler';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.access_token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        loading: false
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,  // Start with loading=true to prevent premature redirects
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Set loading to true during initialization
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = Cookies.get('access_token');
      const user = Cookies.get('user');
      
      console.log('🔍 Checking stored auth:', { hasToken: !!token, hasUser: !!user });
      
      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);
          console.log('✅ Found stored user:', parsedUser.username, parsedUser.role);
          
          // Set authorization header first
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Dispatch login success
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              access_token: token,
              user: parsedUser
            }
          });
          
          console.log('✅ Auth state restored from cookies');
          
        } catch (error) {
          console.error('❌ Error parsing stored user:', error);
          dispatch({ type: 'SET_LOADING', payload: false });
          logout();
        }
      } else {
        console.log('ℹ️ No stored authentication found');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    initializeAuth();
  }, []);

  // Setup axios interceptors for automatic token refresh - simplified
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Only logout on 401 if we're NOT on the login page AND user is authenticated
        // This prevents logout redirect during login attempts
        const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        
        console.log('Interceptor caught error:', {
          status: error.response?.status,
          isLoginPage,
          isLoginRequest,
          isAuthenticated: state.isAuthenticated,
          pathname: window.location.pathname
        });
        
        if (error.response?.status === 401 && !isLoginPage && !isLoginRequest && state.isAuthenticated) {
          console.log('❌ 401 Unauthorized - logging out');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [state.isAuthenticated]);

  const generateOTP = async (employeeId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.post(`${API}/auth/generate-otp`, {
        employee_id: employeeId
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const errorMessage = getErrorMessage(error, 'Failed to generate OTP');
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // Create a new axios instance without interceptors for login
      const loginAxios = axios.create();
      const response = await loginAxios.post(`${API}/auth/login`, credentials);
      const { access_token, refresh_token, user } = response.data;
      
      // Store tokens and user data with secure settings
      Cookies.set('access_token', access_token, { 
        expires: 7,  // 7 days - longer than token validity for refresh mechanism
        secure: window.location.protocol === 'https:',
        sameSite: 'lax'
      });
      Cookies.set('refresh_token', refresh_token, { 
        expires: 7,  // 7 days
        secure: window.location.protocol === 'https:',
        sameSite: 'lax' 
      });
      Cookies.set('user', JSON.stringify(user), { 
        expires: 7,  // 7 days
        secure: window.location.protocol === 'https:',
        sameSite: 'lax'
      });
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { access_token, user }
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Login failed');
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    console.log('🚪 Logging out...');
    try {
      // Call logout endpoint if user is authenticated
      const token = Cookies.get('access_token');
      if (token) {
        await axios.post(`${API}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored data with explicit paths and domains
      Cookies.remove('access_token', { path: '/' });
      Cookies.remove('refresh_token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      delete axios.defaults.headers.common['Authorization'];
      
      dispatch({ type: 'LOGOUT' });
      console.log('✅ Logout complete');
      
      // Navigate to login page
      window.location.href = '/login';
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = Cookies.get('refresh_token');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(`${API}/auth/refresh`, {
        refresh_token: refreshTokenValue
      });
      
      const { access_token } = response.data;
      
      // Update stored access token with same settings
      Cookies.set('access_token', access_token, { 
        expires: 7,
        secure: window.location.protocol === 'https:',
        sameSite: 'lax'
      });
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Update state with new token
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { 
          access_token, 
          user: state.user 
        }
      });
      
      return access_token;
    } catch (error) {
      console.error('Refresh token failed:', error);
      logout();
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    generateOTP,
    refreshToken,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};