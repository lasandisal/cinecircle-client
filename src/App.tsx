import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppRoutes } from './routes/AppRoutes';
import { useAppDispatch } from './hooks/useAppRedux';
import { fetchCurrentUser } from './store/slices/authSlice';
import { ToastProvider } from './components/common/ToastProvider';

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // The session cookie is HttpOnly, so we cannot check it from JavaScript.
    // Ask the API who we are; a 401 simply means "guest".
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return <>{children}</>;
};


export const App: React.FC = () => {
  return (
    // Wrap the application with the Redux Provider and BrowserRouter
    <Provider store={store}>
      <BrowserRouter>
        <AuthInitializer>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

